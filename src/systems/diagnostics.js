const DIAGNOSTIC_STORAGE_KEY = 'kanji_town_diagnostics_v1';
const MAX_DIAGNOSTIC_EVENTS = 20;
const MAX_MESSAGE_LENGTH = 240;
const MAX_DETAIL_LENGTH = 600;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?\b/g;
const SUPABASE_KEY_PATTERN = /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+\b/gi;
const SENSITIVE_QUERY_PATTERN = /([?&#](?:access_token|refresh_token|token|code|email|password|key|apikey)=)[^&#\s]+/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~-]+/gi;

export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'development';
export const BUILD_COMMIT = typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : 'local';

function getDefaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function safeJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeCode(value, fallback = 'unknown') {
  const normalized = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || fallback;
}

function normalizeDiagnosticEvent(event) {
  return {
    id: sanitizeDiagnosticText(event?.id, 48),
    time: sanitizeDiagnosticText(event?.time, 32),
    severity: ['info', 'warning', 'error'].includes(event?.severity) ? event.severity : 'error',
    source: normalizeCode(event?.source, 'app'),
    code: normalizeCode(event?.code),
    message: sanitizeDiagnosticText(event?.message),
    detail: sanitizeDiagnosticText(event?.detail, MAX_DETAIL_LENGTH),
  };
}

export function sanitizeDiagnosticText(value, maxLength = MAX_MESSAGE_LENGTH) {
  const text = String(value ?? '')
    .replace(EMAIL_PATTERN, '[email]')
    .replace(UUID_PATTERN, '[id]')
    .replace(JWT_PATTERN, '[token]')
    .replace(SUPABASE_KEY_PATTERN, '[key]')
    .replace(BEARER_PATTERN, 'Bearer [token]')
    .replace(SENSITIVE_QUERY_PATTERN, '$1[redacted]')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function getDiagnosticEvents(storage = getDefaultStorage()) {
  if (!storage) return [];
  try {
    return safeJsonArray(storage.getItem(DIAGNOSTIC_STORAGE_KEY))
      .slice(-MAX_DIAGNOSTIC_EVENTS)
      .map(normalizeDiagnosticEvent);
  } catch {
    return [];
  }
}

export function recordDiagnosticEvent(event, options = {}) {
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const safeNow = Number.isNaN(now.getTime()) ? new Date() : now;
  const entry = {
    id: `D-${safeNow.getTime().toString(36).toUpperCase()}`,
    time: safeNow.toISOString(),
    severity: ['info', 'warning', 'error'].includes(event?.severity) ? event.severity : 'error',
    source: normalizeCode(event?.source, 'app'),
    code: normalizeCode(event?.code),
    message: sanitizeDiagnosticText(event?.message),
    detail: sanitizeDiagnosticText(event?.detail, MAX_DETAIL_LENGTH),
  };

  if (!storage) return entry;
  try {
    const events = getDiagnosticEvents(storage);
    events.push(entry);
    storage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(events.slice(-MAX_DIAGNOSTIC_EVENTS)));
  } catch {
    // 診断記録が原因でアプリ本体の処理を止めない。
  }
  return entry;
}

export function clearDiagnosticEvents(storage = getDefaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(DIAGNOSTIC_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function recordAppError(error, context = {}) {
  const detail = [error?.stack, context.detail]
    .filter(Boolean)
    .flatMap((value) => String(value).split('\n').slice(0, 4))
    .join(' ');
  return recordDiagnosticEvent({
    severity: 'error',
    source: context.source || 'app',
    code: context.code || error?.name || 'unexpected-error',
    message: error?.message || context.message || 'Unexpected application error',
    detail,
  }, context.options);
}

export function installGlobalDiagnostics(target = globalThis.window) {
  if (!target?.addEventListener) return () => {};
  try {
    // 旧版が保存した未加工ログは新しい診断へ混ぜずに破棄する。
    target.localStorage?.removeItem('kanji_town_errors');
  } catch {}
  const handleError = (event) => recordAppError(event?.error || new Error(event?.message || 'Window error'), {
    source: 'window',
    code: 'uncaught-error',
  });
  const handleRejection = (event) => {
    const reason = event?.reason;
    recordAppError(reason instanceof Error ? reason : new Error(String(reason || 'Unhandled rejection')), {
      source: 'promise',
      code: 'unhandled-rejection',
    });
  };
  target.addEventListener('error', handleError);
  target.addEventListener('unhandledrejection', handleRejection);
  return () => {
    target.removeEventListener('error', handleError);
    target.removeEventListener('unhandledrejection', handleRejection);
  };
}

function getStorageStatus(storage) {
  if (!storage) return { available: false, bytes: 0 };
  const probeKey = 'kanji_town_diagnostic_probe';
  try {
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    const payload = storage.getItem('kanji_town_v7') || '';
    return { available: true, bytes: new TextEncoder().encode(payload).byteLength };
  } catch {
    return { available: false, bytes: 0 };
  }
}

export function getRuntimeSnapshot(options = {}) {
  const navigatorValue = options.navigatorValue ?? globalThis.navigator;
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage;
  const matchMedia = options.matchMedia ?? globalThis.matchMedia;
  const cloudSync = options.cloudSync || {};
  const serviceWorker = navigatorValue?.serviceWorker;
  let standalone = false;
  try {
    standalone = Boolean(matchMedia?.('(display-mode: standalone)')?.matches || navigatorValue?.standalone);
  } catch {}

  return {
    online: navigatorValue?.onLine !== false,
    standalone,
    storage: getStorageStatus(storage),
    serviceWorker: {
      supported: Boolean(serviceWorker),
      active: Boolean(serviceWorker?.controller),
    },
    cloud: {
      configured: Boolean(cloudSync.isConfigured),
      signedIn: Boolean(cloudSync.user),
      status: normalizeCode(cloudSync.status, 'unavailable'),
      lastSyncedAt: cloudSync.lastSyncedAt || null,
    },
  };
}

export async function fetchDeploymentMetadata(options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const baseUrl = options.baseUrl ?? globalThis.document?.baseURI;
  if (!fetchImpl || !baseUrl) return { status: 'unavailable', release: null };
  try {
    const url = new URL('release.json', baseUrl);
    url.searchParams.set('check', Date.now().toString(36));
    const response = await fetchImpl(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!response.ok) return { status: 'error', release: null };
    const release = await response.json();
    if (typeof release?.version !== 'string' || typeof release?.commit !== 'string') {
      return { status: 'error', release: null };
    }
    return {
      status: release.commit === BUILD_COMMIT || BUILD_COMMIT === 'local' ? 'current' : 'update-available',
      release: {
        version: sanitizeDiagnosticText(release.version, 24),
        commit: sanitizeDiagnosticText(release.commit, 48),
        builtAt: sanitizeDiagnosticText(release.builtAt, 32),
      },
    };
  } catch {
    return { status: 'unavailable', release: null };
  }
}

export function createSupportReport(options = {}) {
  const generatedAt = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const runtime = options.runtime || getRuntimeSnapshot({ cloudSync: options.cloudSync });
  const release = options.deployment?.release;
  return {
    reportVersion: 1,
    generatedAt: (Number.isNaN(generatedAt.getTime()) ? new Date() : generatedAt).toISOString(),
    app: {
      version: APP_VERSION,
      commit: BUILD_COMMIT,
      deployedRelease: release ? {
        version: sanitizeDiagnosticText(release.version, 24),
        commit: sanitizeDiagnosticText(release.commit, 48),
        builtAt: sanitizeDiagnosticText(release.builtAt, 32),
      } : null,
      deploymentStatus: normalizeCode(options.deployment?.status, 'unchecked'),
    },
    runtime: {
      online: Boolean(runtime.online),
      standalone: Boolean(runtime.standalone),
      storage: {
        available: Boolean(runtime.storage?.available),
        bytes: Math.max(0, Math.floor(Number(runtime.storage?.bytes) || 0)),
      },
      serviceWorker: {
        supported: Boolean(runtime.serviceWorker?.supported),
        active: Boolean(runtime.serviceWorker?.active),
      },
      cloud: {
        configured: Boolean(runtime.cloud?.configured),
        signedIn: Boolean(runtime.cloud?.signedIn),
        status: normalizeCode(runtime.cloud?.status, 'unavailable'),
        lastSyncedAt: sanitizeDiagnosticText(runtime.cloud?.lastSyncedAt, 32) || null,
      },
    },
    diagnostics: (options.diagnostics || getDiagnosticEvents())
      .slice(-MAX_DIAGNOSTIC_EVENTS)
      .map(normalizeDiagnosticEvent),
    privacy: {
      learningDataIncluded: false,
      accountDataIncluded: false,
      credentialsIncluded: false,
    },
  };
}

export { DIAGNOSTIC_STORAGE_KEY, MAX_DIAGNOSTIC_EVENTS };
