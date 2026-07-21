export const CLOUD_SAVE_VERSION = 1;

const cloneJson = (value) => JSON.parse(JSON.stringify(value ?? {}));

function sortForStableJson(value) {
  if (Array.isArray(value)) return value.map(sortForStableJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForStableJson(value[key])]),
  );
}

export function prepareCloudPayload(stats) {
  const payload = cloneJson(stats);
  // 同期制御情報や直前の一時表示は端末ごとの状態なのでクラウドへ含めない。
  delete payload.cloudSync;
  delete payload.lastCollectionResult;
  return payload;
}

export function stableSerialize(value) {
  return JSON.stringify(sortForStableJson(value));
}

export async function hashCloudPayload(payload) {
  const serialized = stableSerialize(payload);
  const bytes = new TextEncoder().encode(serialized);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // 古いWebView向けフォールバック。衝突を抑えるため異なる初期値を2本組み合わせる。
  const fnv = (seed) => {
    let hash = seed;
    for (let i = 0; i < serialized.length; i++) {
      hash ^= serialized.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  };
  return `${fnv(0x811c9dc5)}${fnv(0x9e3779b9)}`;
}

export function isEmptyLearningData(stats = {}) {
  return (Number(stats.totalExp) || 0) === 0
    && Object.keys(stats.kanjiStats || {}).length === 0
    && (Number(stats.sessionCount) || 0) === 0
    && (Number(stats.population) || 0) === 0
    && (Number(stats.craftCount) || 0) === 0
    && Object.keys(stats.daily || {}).length === 0
    && (stats.myDrills || []).length === 0;
}

export function summarizeCloudData(stats = {}) {
  const learned = Object.values(stats.kanjiStats || {}).filter((card) => card?.status !== 'new').length;
  return {
    totalExp: Math.max(0, Number(stats.totalExp) || 0),
    learned,
    streak: Math.max(0, Number(stats.streak) || 0),
    sessions: Math.max(0, Number(stats.sessionCount) || 0),
  };
}

/**
 * ローカル・クラウド・最後に同期した版から、データを失わない次の操作を決定する。
 * 双方が変わった場合は自動上書きせず、必ず利用者へ選択を求める。
 */
export function decideSyncAction({ localHash, localIsEmpty, remote, meta, localOwnerId, userId }) {
  if (localOwnerId && userId && localOwnerId !== userId) {
    return { action: 'conflict', reason: 'account_switch' };
  }
  if (!remote) return { action: 'create_remote', reason: 'cloud_empty' };

  const remoteHash = remote.payload_hash;
  if (localHash === remoteHash) return { action: 'up_to_date', reason: 'same_content' };

  const lastSyncedHash = meta?.lastSyncedHash || null;
  if (!lastSyncedHash) {
    return localIsEmpty
      ? { action: 'pull_remote', reason: 'new_device' }
      : { action: 'conflict', reason: 'first_sync_has_both' };
  }

  const localChanged = localHash !== lastSyncedHash;
  const remoteChanged = remoteHash !== lastSyncedHash;
  if (localChanged && remoteChanged) return { action: 'conflict', reason: 'both_changed' };
  if (remoteChanged) return { action: 'pull_remote', reason: 'cloud_changed' };
  if (localChanged) return { action: 'push_local', reason: 'local_changed' };
  return { action: 'up_to_date', reason: 'revision_only' };
}

export function createSyncMeta(remote, syncedAt = new Date().toISOString()) {
  return {
    remoteRevision: Math.max(0, Number(remote?.revision) || 0),
    lastSyncedHash: typeof remote?.payload_hash === 'string' ? remote.payload_hash : '',
    lastSyncedAt: syncedAt,
  };
}
