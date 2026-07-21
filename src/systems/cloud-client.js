import { CLOUD_SAVE_VERSION } from './cloud-sync.js';

const CLOUD_TABLE = 'kanji_town_saves';
let clientPromise = null;

const readEnvironment = () => {
  const environment = import.meta.env || {};
  return {
    url: String(environment.VITE_SUPABASE_URL || '').trim(),
    anonKey: String(environment.VITE_SUPABASE_ANON_KEY || '').trim(),
  };
};

export function getCloudConfiguration() {
  const config = readEnvironment();
  let validUrl = false;
  try {
    validUrl = new URL(config.url).protocol === 'https:';
  } catch {}
  return {
    ...config,
    isConfigured: validUrl && config.anonKey.length >= 20,
  };
}

export async function getCloudClient() {
  const config = getCloudConfiguration();
  if (!config.isConfigured) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(
      config.url,
      config.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      },
    ));
  }
  return clientPromise;
}

function throwIfError(error, fallbackMessage) {
  if (!error) return;
  const cloudError = new Error(error.message || fallbackMessage);
  cloudError.code = error.code || error.status || 'cloud_error';
  throw cloudError;
}

const SAVE_COLUMNS = 'payload,payload_hash,revision,schema_version,report_payload,updated_at';

export async function fetchCloudSave(client, userId) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .select(SAVE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  throwIfError(error, 'クラウドデータを読み込めませんでした');
  return data || null;
}

export async function createCloudSave(client, userId, payload, payloadHash, reportPayload = {}) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .insert({
      user_id: userId,
      payload,
      payload_hash: payloadHash,
      revision: 1,
      schema_version: CLOUD_SAVE_VERSION,
      report_payload: reportPayload,
    })
    .select(SAVE_COLUMNS)
    .single();
  throwIfError(error, 'クラウドデータを作成できませんでした');
  return data;
}

/** revision一致時だけ更新する楽観ロック。data=nullは他端末との競合を表す。 */
export async function updateCloudSave(client, userId, expectedRevision, payload, payloadHash, reportPayload = {}) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .update({
      payload,
      payload_hash: payloadHash,
      revision: expectedRevision + 1,
      schema_version: CLOUD_SAVE_VERSION,
      report_payload: reportPayload,
    })
    .eq('user_id', userId)
    .eq('revision', expectedRevision)
    .select(SAVE_COLUMNS)
    .maybeSingle();
  throwIfError(error, 'クラウドデータを更新できませんでした');
  return data || null;
}

const LINK_COLUMNS = 'id,learner_id,viewer_id,learner_label,viewer_label,viewer_role,created_at';

export async function listLearningLinks(client) {
  const { data, error } = await client
    .from('kanji_town_learning_links')
    .select(LINK_COLUMNS)
    .order('created_at', { ascending: false });
  throwIfError(error, '見守り共有を読み込めませんでした');
  return data || [];
}

export async function createLearningShareInvite(client, { tokenHash, learnerLabel, viewerRole }) {
  const { data, error } = await client
    .rpc('create_kanji_town_share_invite', {
      p_token_hash: tokenHash,
      p_learner_label: learnerLabel,
      p_viewer_role: viewerRole,
    })
    .single();
  throwIfError(error, '招待コードを作成できませんでした');
  return data;
}

export async function claimLearningShareInvite(client, tokenHash, viewerLabel) {
  const { data, error } = await client.rpc('claim_kanji_town_share_invite', {
    p_token_hash: tokenHash,
    p_viewer_label: viewerLabel,
  });
  throwIfError(error, '招待コードを確認できませんでした');
  return data;
}

export async function deleteLearningShareInvite(client, inviteId) {
  const { data, error } = await client
    .from('kanji_town_share_invites')
    .delete()
    .eq('id', inviteId)
    .select('id')
    .maybeSingle();
  throwIfError(error, '招待コードを取り消せませんでした');
  return Boolean(data);
}

export async function fetchLinkedLearningReports(client) {
  const { data, error } = await client.rpc('get_kanji_town_linked_reports');
  throwIfError(error, '見守りレポートを読み込めませんでした');
  return data || [];
}

export async function deleteLearningLink(client, linkId) {
  const { data, error } = await client
    .from('kanji_town_learning_links')
    .delete()
    .eq('id', linkId)
    .select('id')
    .maybeSingle();
  throwIfError(error, '見守り共有を解除できませんでした');
  return Boolean(data);
}

export function getAuthRedirectUrl() {
  return new URL(import.meta.env?.BASE_URL || '/', window.location.origin).toString();
}
