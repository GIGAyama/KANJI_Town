import { useLazyModule } from './useLazyModule';

/**
 * 「4けたの数字で送る」で使う PeerJS（端末どうしの直接通信）。
 *
 * ライブラリは npm の依存（peerjs 1.5.4）を動的 import する。以前は jsDelivr（1.5.4）と
 * unpkg（1.5.2）から <script> で読んでいて、予備の版が違ううえ SRI も無かった。
 *
 * ⚠️ 接続先は外部のまま残る。数字で相手を見つけるには仲介のサーバーが要るため、
 *    PeerJS が無料で公開しているサーバーを使っている。どこへつなぐかを
 *    ライブラリの既定値に任せず、ここに書き出しておく（CSP・許可リスト・
 *    プライバシーポリシーと突き合わせられるように）。値は peerjs 1.5.4 の既定と同じ。
 *    - 0.peerjs.com（https / wss）… 数字（ID）で相手を見つける仲介
 *    - stun.l.google.com:19302 … 自分の端末の外向きの住所を調べる
 *    - eu-0 / us-0.turn.peerjs.com:3478 … 直接つながらないときの中継（海外）
 *    ここを変えたら index.html の CSP（connect-src）・quality.config.json・
 *    privacy.html・README の「制限とクォータ」も直すこと。
 */
export const PEER_SIGNALING_HOST = '0.peerjs.com';

export const PEER_OPTIONS = Object.freeze({
  host: PEER_SIGNALING_HOST,
  port: 443,
  path: '/',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
        // PeerJS が公開している共用の値（秘密ではない）
        username: 'peerjs',
        credential: 'peerjsp',
      },
    ],
    sdpSemantics: 'unified-plan',
  },
});

/** 公開サーバーの ID の名前空間は全利用者で共有なので、アプリ固有の接頭辞を付ける */
export const PEER_ID_PREFIX = 'kanji-town-';

const importPeer = () => import('peerjs').then((m) => m.Peer ?? m.default?.Peer ?? m.default);

/**
 * @returns {{ Peer: Function|null, isLoaded: boolean, loadError: boolean, offline: boolean }}
 */
export const usePeerJS = () => {
  const { lib, isLoaded, loadError, offline } = useLazyModule('peerjs', importPeer, { requiresNetwork: true });
  return { Peer: lib, isLoaded, loadError, offline };
};

/**
 * PeerJS のエラーの種類を、画面に出す案内の種類にまとめる。
 * - id-taken    : 数字がほかの人に使われていた（作り直せばよい）
 * - not-found   : その数字の相手がいない（打ちまちがい・相手が画面を閉じた）
 * - unsupported : この端末のブラウザでは使えない
 * - blocked     : 仲介のサーバーに届かない（校内フィルタ・圏外・サーバーの不調）
 * @param {{ type?: string }} err
 * @returns {'id-taken'|'not-found'|'unsupported'|'blocked'}
 */
export function classifyPeerError(err) {
  const type = err?.type;
  if (type === 'unavailable-id') return 'id-taken';
  if (type === 'peer-unavailable') return 'not-found';
  if (type === 'browser-incompatible') return 'unsupported';
  return 'blocked';
}

