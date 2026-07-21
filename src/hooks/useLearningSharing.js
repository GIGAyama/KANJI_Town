import { useCallback, useEffect, useRef, useState } from 'react';
import {
  claimLearningShareInvite,
  createLearningShareInvite,
  deleteLearningLink,
  deleteLearningShareInvite,
  fetchLinkedLearningReports,
  getCloudClient,
  listLearningLinks,
} from '../systems/cloud-client';
import {
  createShareToken,
  formatShareToken,
  hashShareToken,
  normalizeShareToken,
} from '../systems/cloud-sharing';

const initialState = {
  status: 'idle',
  links: [],
  reports: [],
  invite: null,
  error: null,
  notice: null,
};

function sharingError(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  if (code === 'P0002' || message.includes('invalid or expired invite')) {
    return '招待コードが違うか、有効期限が切れています。';
  }
  if (code === '22023') return '表示名と共有先を確認してください。';
  if (code === '54000') return 'この児童の見守り共有は上限の10人に達しています。';
  if (code === '23505') return '招待コードを作り直して、もう一度お試しください。';
  if (code === '42883' || code === '42P01' || code === 'PGRST202' || code === 'PGRST205') {
    return '見守り共有のデータベース設定がまだ完了していません。';
  }
  if (message.includes('fetch') || message.includes('network')) return '通信できませんでした。接続後にもう一度お試しください。';
  return '見守り共有を完了できませんでした。学習データは変更していません。';
}

export function useLearningSharing({ cloudSync }) {
  const userId = cloudSync.user?.id || null;
  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  const [state, setState] = useState(initialState);

  const patchState = useCallback((patch) => {
    if (!mountedRef.current) return;
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      patchState({ ...initialState });
      return;
    }
    const requestId = ++requestRef.current;
    patchState({ status: 'loading', error: null });
    try {
      const client = await getCloudClient();
      const [links, reports] = await Promise.all([
        listLearningLinks(client),
        fetchLinkedLearningReports(client),
      ]);
      if (requestId !== requestRef.current) return;
      patchState({ status: 'ready', links, reports, error: null });
    } catch (error) {
      if (requestId !== requestRef.current) return;
      patchState({ status: 'error', error: sharingError(error) });
    }
  }, [patchState, userId]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [refresh]);

  const createInvite = useCallback(async ({ learnerLabel, viewerRole }) => {
    if (!userId) return null;
    patchState({ status: 'saving', error: null, notice: null, invite: null });
    try {
      const token = createShareToken();
      const tokenHash = await hashShareToken(token);
      const client = await getCloudClient();
      const created = await createLearningShareInvite(client, {
        tokenHash,
        learnerLabel: learnerLabel.trim(),
        viewerRole,
      });
      const invite = {
        id: created.invite_id,
        token,
        formattedToken: formatShareToken(token),
        expiresAt: created.expires_at,
        viewerRole,
      };
      patchState({ status: 'ready', invite, notice: '15分間使える招待コードを作りました。' });
      return invite;
    } catch (error) {
      patchState({ status: 'error', error: sharingError(error) });
      return null;
    }
  }, [patchState, userId]);

  const claimInvite = useCallback(async ({ token, viewerLabel }) => {
    if (!userId) return false;
    const normalized = normalizeShareToken(token);
    if (!normalized) {
      patchState({ error: '招待コードは16文字です。文字を確認してください。' });
      return false;
    }
    patchState({ status: 'saving', error: null, notice: null });
    try {
      const client = await getCloudClient();
      await claimLearningShareInvite(client, await hashShareToken(normalized), viewerLabel.trim());
      patchState({ notice: '見守り共有を開始しました。' });
      await refresh();
      return true;
    } catch (error) {
      patchState({ status: 'error', error: sharingError(error) });
      return false;
    }
  }, [patchState, refresh, userId]);

  const cancelInvite = useCallback(async () => {
    if (!state.invite?.id) return false;
    patchState({ status: 'saving', error: null, notice: null });
    try {
      const client = await getCloudClient();
      const removed = await deleteLearningShareInvite(client, state.invite.id);
      patchState({
        status: 'ready',
        invite: null,
        notice: removed ? '招待コードを無効にしました。' : '招待コードは使用済みか、すでに無効です。',
      });
      return true;
    } catch (error) {
      patchState({ status: 'error', error: sharingError(error) });
      return false;
    }
  }, [patchState, state.invite?.id]);

  const removeLink = useCallback(async (linkId) => {
    patchState({ status: 'saving', error: null, notice: null });
    try {
      const client = await getCloudClient();
      const removed = await deleteLearningLink(client, linkId);
      if (!removed) throw new Error('link_not_found');
      patchState({ notice: '見守り共有を解除しました。' });
      await refresh();
      return true;
    } catch (error) {
      patchState({ status: 'error', error: sharingError(error) });
      return false;
    }
  }, [patchState, refresh]);

  return {
    ...state,
    refresh,
    createInvite,
    cancelInvite,
    claimInvite,
    removeLink,
    clearMessage: () => patchState({ error: null, notice: null }),
  };
}
