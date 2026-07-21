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

const SAVE_COLUMNS = 'payload,payload_hash,revision,schema_version,updated_at';

export async function fetchCloudSave(client, userId) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .select(SAVE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  throwIfError(error, 'クラウドデータを読み込めませんでした');
  return data || null;
}

export async function createCloudSave(client, userId, payload, payloadHash) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .insert({
      user_id: userId,
      payload,
      payload_hash: payloadHash,
      revision: 1,
      schema_version: CLOUD_SAVE_VERSION,
    })
    .select(SAVE_COLUMNS)
    .single();
  throwIfError(error, 'クラウドデータを作成できませんでした');
  return data;
}

/** revision一致時だけ更新する楽観ロック。data=nullは他端末との競合を表す。 */
export async function updateCloudSave(client, userId, expectedRevision, payload, payloadHash) {
  const { data, error } = await client
    .from(CLOUD_TABLE)
    .update({
      payload,
      payload_hash: payloadHash,
      revision: expectedRevision + 1,
      schema_version: CLOUD_SAVE_VERSION,
    })
    .eq('user_id', userId)
    .eq('revision', expectedRevision)
    .select(SAVE_COLUMNS)
    .maybeSingle();
  throwIfError(error, 'クラウドデータを更新できませんでした');
  return data || null;
}

export function getAuthRedirectUrl() {
  return new URL(import.meta.env?.BASE_URL || '/', window.location.origin).toString();
}
