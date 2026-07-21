import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createCloudSave,
  fetchCloudSave,
  getAuthRedirectUrl,
  getCloudClient,
  getCloudConfiguration,
  updateCloudSave,
} from '../systems/cloud-client';
import {
  CLOUD_SAVE_VERSION,
  createSyncMeta,
  decideSyncAction,
  hashCloudPayload,
  isEmptyLearningData,
  prepareCloudPayload,
  summarizeCloudData,
} from '../systems/cloud-sync';
import { StorageAPI } from '../systems/storage';
import {
  attachReportSource,
  buildLearningReport,
  isLearningReportCurrent,
} from '../systems/learning-report';

const META_KEY_PREFIX = 'kanji_town_cloud_meta_v1:';
const LOCAL_OWNER_KEY = 'kanji_town_cloud_owner_v1';
const AUTO_SYNC_DELAY_MS = 1800;

function readMeta(userId) {
  try {
    const value = window.localStorage.getItem(`${META_KEY_PREFIX}${userId}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeMeta(userId, meta) {
  try {
    window.localStorage.setItem(`${META_KEY_PREFIX}${userId}`, JSON.stringify(meta));
  } catch {}
}

function readLocalOwner() {
  try {
    return window.localStorage.getItem(LOCAL_OWNER_KEY);
  } catch {
    return null;
  }
}

function writeLocalOwner(userId) {
  try {
    window.localStorage.setItem(LOCAL_OWNER_KEY, userId);
  } catch {}
}

function friendlyError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (code === 'newer_cloud_schema') return 'クラウドデータが新しい形式です。アプリを最新版に更新してください。';
  if (code === 'local_save_failed') return 'この端末の保存容量が不足しています。クラウドのデータは変更していません。';
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードを確認してください。';
  }
  if (message.includes('email not confirmed')) return '確認メールのリンクを開いてからログインしてください。';
  if (message.includes('user already registered')) return 'このメールアドレスは登録済みです。';
  if (message.includes('rate limit')) return '短時間に操作が集中しました。少し待ってからお試しください。';
  if (message.includes('password')) return 'パスワードは8文字以上で設定してください。';
  if (message.includes('fetch') || message.includes('network')) return '通信できませんでした。接続後に自動で再試行します。';
  if (code === '23505') return '別の端末で同期が始まりました。もう一度お試しください。';
  return 'クラウド同期を完了できませんでした。端末のデータは安全に残っています。';
}

const initialState = (configured) => ({
  status: configured ? 'initializing' : 'unavailable',
  user: null,
  error: null,
  notice: null,
  conflict: null,
  lastSyncedAt: null,
  needsPasswordReset: false,
});

export function useCloudSync({ stats, setStats }) {
  const configuration = getCloudConfiguration();
  const [state, setState] = useState(() => initialState(configuration.isConfigured));
  const mountedRef = useRef(true);
  const statsRef = useRef(stats);
  const userRef = useRef(null);
  const metaRef = useRef(null);
  const conflictRemoteRef = useRef(null);
  const syncPromiseRef = useRef(null);
  const autoSyncTimerRef = useRef(null);

  statsRef.current = stats;

  const patchState = useCallback((patch) => {
    if (!mountedRef.current) return;
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const rememberRemote = useCallback((userId, remote) => {
    const meta = createSyncMeta(remote);
    metaRef.current = meta;
    conflictRemoteRef.current = null;
    writeMeta(userId, meta);
    writeLocalOwner(userId);
    patchState({
      status: 'synced',
      error: null,
      conflict: null,
      lastSyncedAt: meta.lastSyncedAt,
    });
  }, [patchState]);

  const applyRemote = useCallback((userId, remote) => {
    if (!remote?.payload || typeof remote.payload !== 'object' || Array.isArray(remote.payload)) {
      throw new Error('invalid_cloud_payload');
    }
    if ((Number(remote.schema_version) || 0) > CLOUD_SAVE_VERSION) {
      const error = new Error('newer_cloud_schema');
      error.code = 'newer_cloud_schema';
      throw error;
    }

    // 既存の保存移行・ID検証を必ず通してからReact stateへ反映する。
    if (!StorageAPI.saveStatsImmediate(remote.payload)) {
      const error = new Error('local_save_failed');
      error.code = 'local_save_failed';
      throw error;
    }
    const normalized = StorageAPI.getStats();
    const meta = createSyncMeta(remote);
    metaRef.current = meta;
    conflictRemoteRef.current = null;
    writeMeta(userId, meta);
    writeLocalOwner(userId);
    setStats(normalized);
    patchState({
      status: 'synced',
      error: null,
      conflict: null,
      lastSyncedAt: meta.lastSyncedAt,
      notice: 'クラウドの学習データをこの端末へ復元しました。',
    });
  }, [patchState, setStats]);

  const showConflict = useCallback((remote, localStats, reason = 'both_changed') => {
    conflictRemoteRef.current = remote || { missing: true };
    patchState({
      status: 'conflict',
      error: null,
      conflict: {
        local: summarizeCloudData(localStats),
        cloud: summarizeCloudData(remote?.payload),
        cloudUpdatedAt: remote?.updated_at || null,
        cloudExists: Boolean(remote),
        reason,
      },
    });
  }, [patchState]);

  const performSync = useCallback(async (explicitUser = null) => {
    const activeUser = explicitUser || userRef.current;
    if (!configuration.isConfigured || !activeUser) return null;
    if (syncPromiseRef.current) return syncPromiseRef.current;

    const task = (async () => {
      patchState({ status: 'syncing', error: null, notice: null });
      try {
        const client = await getCloudClient();
        if (!client) return null;
        const localStats = statsRef.current;
        const payload = prepareCloudPayload(localStats);
        const localHash = await hashCloudPayload(payload);
        const reportPayload = attachReportSource(buildLearningReport(localStats), localHash);
        const remote = await fetchCloudSave(client, activeUser.id);
        // ログアウトや別アカウントへの切替後に、古いリクエスト結果を反映しない。
        if (userRef.current?.id !== activeUser.id) return null;
        const localOwner = readLocalOwner();
        const meta = metaRef.current || readMeta(activeUser.id);
        metaRef.current = meta;
        const decision = decideSyncAction({
          localHash,
          localIsEmpty: isEmptyLearningData(localStats),
          remote,
          meta,
          localOwnerId: localOwner,
          userId: activeUser.id,
        });

        if (decision.action === 'create_remote') {
          try {
            const created = await createCloudSave(client, activeUser.id, payload, localHash, reportPayload);
            if (userRef.current?.id !== activeUser.id) return null;
            rememberRemote(activeUser.id, created);
          } catch (error) {
            if (String(error?.code) !== '23505') throw error;
            const latest = await fetchCloudSave(client, activeUser.id);
            if (userRef.current?.id !== activeUser.id) return null;
            showConflict(latest, localStats);
          }
        } else if (decision.action === 'push_local') {
          const updated = await updateCloudSave(client, activeUser.id, remote.revision, payload, localHash, reportPayload);
          if (userRef.current?.id !== activeUser.id) return null;
          if (!updated) {
            const latest = await fetchCloudSave(client, activeUser.id);
            if (userRef.current?.id !== activeUser.id) return null;
            showConflict(latest, localStats);
          } else {
            rememberRemote(activeUser.id, updated);
          }
        } else if (decision.action === 'pull_remote') {
          applyRemote(activeUser.id, remote);
        } else if (decision.action === 'conflict') {
          showConflict(remote, localStats, decision.reason);
        } else if (!isLearningReportCurrent(remote.report_payload, remote.payload_hash)) {
          const updated = await updateCloudSave(
            client,
            activeUser.id,
            remote.revision,
            payload,
            localHash,
            reportPayload,
          );
          if (userRef.current?.id !== activeUser.id) return null;
          if (updated) rememberRemote(activeUser.id, updated);
          else {
            const latest = await fetchCloudSave(client, activeUser.id);
            if (userRef.current?.id !== activeUser.id) return null;
            showConflict(latest, localStats);
          }
        } else {
          rememberRemote(activeUser.id, remote);
        }
        return decision.action;
      } catch (error) {
        patchState({ status: 'error', error: friendlyError(error) });
        return null;
      }
    })();

    syncPromiseRef.current = task;
    try {
      return await task;
    } finally {
      syncPromiseRef.current = null;
    }
  }, [applyRemote, configuration.isConfigured, patchState, rememberRemote, showConflict]);

  useEffect(() => {
    mountedRef.current = true;
    if (!configuration.isConfigured) return () => { mountedRef.current = false; };

    let active = true;
    let unsubscribe = null;
    getCloudClient().then(async (client) => {
      if (!client || !active || !mountedRef.current) return;
      // URL内のPASSWORD_RECOVERYイベントを取りこぼさないよう、session読込より先に監視する。
      const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
        if (!active || !mountedRef.current) return;
        const nextUser = nextSession?.user || null;
        userRef.current = nextUser;
        metaRef.current = nextUser ? readMeta(nextUser.id) : null;
        conflictRemoteRef.current = null;
        patchState({
          user: nextUser,
          status: nextUser ? 'pending' : 'signed_out',
          conflict: null,
          error: null,
          lastSyncedAt: metaRef.current?.lastSyncedAt || null,
          needsPasswordReset: event === 'PASSWORD_RECOVERY',
        });
        if (nextUser) setTimeout(() => performSync(nextUser), 0);
      });
      unsubscribe = () => listener?.subscription?.unsubscribe();

      const { data } = await client.auth.getSession();
      if (!active || !mountedRef.current) return;
      const session = data?.session || null;
      userRef.current = session?.user || null;
      metaRef.current = session?.user ? readMeta(session.user.id) : null;
      patchState({
        status: session?.user ? 'pending' : 'signed_out',
        user: session?.user || null,
        lastSyncedAt: metaRef.current?.lastSyncedAt || null,
      });
      if (session?.user) setTimeout(() => performSync(session.user), 0);
    }).catch((error) => {
      if (active) patchState({ status: 'error', error: friendlyError(error) });
    });

    return () => {
      active = false;
      mountedRef.current = false;
      unsubscribe?.();
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [configuration.isConfigured, patchState, performSync]);

  useEffect(() => {
    if (!configuration.isConfigured || !userRef.current || conflictRemoteRef.current) return undefined;
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    patchState({ status: 'pending' });
    autoSyncTimerRef.current = setTimeout(() => performSync(), AUTO_SYNC_DELAY_MS);
    return () => clearTimeout(autoSyncTimerRef.current);
  }, [configuration.isConfigured, performSync, patchState, stats]);

  useEffect(() => {
    if (!configuration.isConfigured) return undefined;
    const handleOnline = () => performSync();
    const handleVisible = () => {
      if (document.visibilityState === 'visible') performSync();
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [configuration.isConfigured, performSync]);

  const signIn = useCallback(async ({ email, password }) => {
    patchState({ status: 'authenticating', error: null, notice: null });
    try {
      const client = await getCloudClient();
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      patchState({ status: 'signed_out', error: friendlyError(error) });
      throw error;
    }
  }, [patchState]);

  const signUp = useCallback(async ({ email, password }) => {
    patchState({ status: 'authenticating', error: null, notice: null });
    try {
      const client = await getCloudClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
      if (!data?.session) {
        patchState({ status: 'signed_out', notice: '確認メールを送りました。リンクを開いて登録を完了してください。' });
      }
    } catch (error) {
      patchState({ status: 'signed_out', error: friendlyError(error) });
      throw error;
    }
  }, [patchState]);

  const signOut = useCallback(async () => {
    try {
      const client = await getCloudClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      userRef.current = null;
      metaRef.current = null;
      conflictRemoteRef.current = null;
      patchState({ ...initialState(true), status: 'signed_out' });
    } catch (error) {
      patchState({ error: friendlyError(error) });
    }
  }, [patchState]);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      const client = await getCloudClient();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthRedirectUrl() });
      if (error) throw error;
      patchState({ notice: 'パスワード再設定メールを送りました。', error: null });
    } catch (error) {
      patchState({ error: friendlyError(error) });
      throw error;
    }
  }, [patchState]);

  const updatePassword = useCallback(async (password) => {
    try {
      const client = await getCloudClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      patchState({ needsPasswordReset: false, notice: 'パスワードを更新しました。', error: null });
    } catch (error) {
      patchState({ error: friendlyError(error) });
      throw error;
    }
  }, [patchState]);

  const resolveConflict = useCallback(async (choice) => {
    const activeUser = userRef.current;
    if (!activeUser) return;
    patchState({ status: 'syncing', error: null });
    try {
      const client = await getCloudClient();
      const latest = await fetchCloudSave(client, activeUser.id);
      if (userRef.current?.id !== activeUser.id) return;
      if (!latest) {
        if (choice !== 'local') {
          patchState({ status: 'conflict', error: 'このアカウントにはクラウドデータがありません。' });
          return;
        }
        const localStats = statsRef.current;
        const payload = prepareCloudPayload(localStats);
        const hash = await hashCloudPayload(payload);
        const report = attachReportSource(buildLearningReport(localStats), hash);
        const created = await createCloudSave(client, activeUser.id, payload, hash, report);
        if (userRef.current?.id !== activeUser.id) return;
        rememberRemote(activeUser.id, created);
        patchState({ notice: 'この端末の学習データを新しいアカウントへ保存しました。' });
        return;
      }

      if (choice === 'cloud') {
        applyRemote(activeUser.id, latest);
        return;
      }

      const localStats = statsRef.current;
      const payload = prepareCloudPayload(localStats);
      const hash = await hashCloudPayload(payload);
      const report = attachReportSource(buildLearningReport(localStats), hash);
      const updated = await updateCloudSave(client, activeUser.id, latest.revision, payload, hash, report);
      if (userRef.current?.id !== activeUser.id) return;
      if (!updated) {
        const newest = await fetchCloudSave(client, activeUser.id);
        if (userRef.current?.id !== activeUser.id) return;
        showConflict(newest, localStats);
        return;
      }
      rememberRemote(activeUser.id, updated);
      patchState({ notice: 'この端末の学習データをクラウドへ保存しました。' });
    } catch (error) {
      patchState({ status: 'error', error: friendlyError(error) });
    }
  }, [applyRemote, patchState, performSync, rememberRemote, showConflict]);

  return {
    ...state,
    isConfigured: configuration.isConfigured,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    syncNow: performSync,
    resolveConflict,
    clearMessage: () => patchState({ error: null, notice: null }),
  };
}
