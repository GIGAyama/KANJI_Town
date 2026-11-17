import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { subscribeTownAnimation } from '../../systems/town-animation';
import { C, nearbyPointsOfInterest, villagerDepth } from '../../systems/town-map-view';

const TILE_W = 64;
const TILE_H = 32;
const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);

import { VILLAGER_BOX, villagerKind, villagerTop } from '../../data/villager-art';
import { VillagerFigure } from './VillagerArt';

const CULTIVATABLE_TERRAIN = new Set([
  't_roughland', 't_weed', 't_grassland', 't_forest_floor', 't_highland', 't_sand'
]);

const NO_MAP = {};
const NO_POINTS = [];
/** 町は雲の上の島なので、島の外（まだ見えていない土地）へは歩いて出ない */
const keepOnIsland = (value, exploredRadius) => Math.min(C + exploredRadius + 0.3, Math.max(C - exploredRadius - 0.3, value));

// 歩くときの動き（左右に小さく ゆれながら、とことこ はねる。約 0.63 秒で 2 歩）と、喜んで跳ねる動き（6px）。
// どちらも Web Animations で描き、ブラウザの合成だけで動かす（毎フレーム描き直さない）。
// ゆれの中心は足もと（BODY_ORIGIN）。名札も体といっしょに ゆれる
const BOB_FRAMES = [
  { transform: 'translateY(0px) rotate(-4deg)', easing: 'ease-out' },
  { transform: 'translateY(-2.5px) rotate(0deg)', easing: 'ease-in' },
  { transform: 'translateY(0px) rotate(4deg)', easing: 'ease-out' },
  { transform: 'translateY(-2.5px) rotate(0deg)', easing: 'ease-in' },
  { transform: 'translateY(0px) rotate(-4deg)' },
];
const JUMP_FRAMES = [
  { transform: 'translateY(0px)', easing: 'ease-out' },
  { transform: 'translateY(-6px)', easing: 'ease-in' },
  { transform: 'translateY(0px)' },
];
const MOTION_PERIOD_MS = 628;
/** 1 回の transition で運ぶ最大のマス数（重なり順をこの間隔で更新する） */
const LEG_CELLS = 3;

// 感情ふきだし。出るときは下からぽんと、消えるときは小さくなって消える
const BUBBLE_IN = [
  { transform: 'translateY(10px) scale(0)', opacity: 0 },
  { transform: 'translateY(0px) scale(1)', opacity: 1 },
];
const BUBBLE_OUT = [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(0)', opacity: 0 },
];
// ふきだしの中の しるし（絵文字は端末で形が変わるので、絵で描く）
const EMOTION_ICON = {
  heart: <path d="M6 10.4C2.6 7.9 1.1 6.2 1.1 4.3c0-1.5 1.1-2.5 2.4-2.5 1 0 1.9.5 2.5 1.5.6-1 1.5-1.5 2.5-1.5 1.3 0 2.4 1 2.4 2.5 0 1.9-1.5 3.6-4.9 6.1z" fill="#f0483e" stroke="#2b211c" strokeWidth="0.9" strokeLinejoin="round" />,
  note: <path d="M4.7 8.9a1.7 1.4 0 1 1-1-1.3V2.7l5.4-1.3v6.2a1.7 1.4 0 1 1-1-1.3V3.4L4.7 4.2z" fill="#3f86d8" stroke="#2b211c" strokeWidth="0.8" strokeLinejoin="round" />,
  exclamation: <path d="M6 1.9v4.9M6 9.7v.2" fill="none" stroke="#ee7b22" strokeWidth="2.2" strokeLinecap="round" />,
  sleep: <path d="M2.2 5.6h3.6L2.2 10h3.6M7 1.8h2.8L7 5h2.8" fill="none" stroke="#5f73c9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
};
const BUBBLE_SIZE = 18;

/** 気持ちの ふきだし。名札の上に出す（bottom は 足もとの地面からの高さ） */
const EmotionBubble = ({ emotion, bottom }) => {
  const [shown, setShown] = useState(emotion);
  const ref = useRef(null);
  const visible = Boolean(shown);

  useEffect(() => {
    if (emotion) { setShown(emotion); return undefined; }
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') { setShown(null); return undefined; }
    const out = el.animate(BUBBLE_OUT, { duration: 200, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = () => setShown(null);
    return () => out.cancel();
  }, [emotion]);

  useEffect(() => {
    const el = ref.current;
    if (!visible || !el || typeof el.animate !== 'function') return;
    el.animate(BUBBLE_IN, { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  }, [visible]);

  if (!shown) return null;
  // まん中に置くのに transform は使わない（出入りの動きが transform を書きかえるため）
  return (
    <div ref={ref} aria-hidden="true"
      style={{
        position: 'absolute', left: '50%', marginLeft: -BUBBLE_SIZE / 2, bottom, width: BUBBLE_SIZE, height: BUBBLE_SIZE,
        boxSizing: 'border-box', borderRadius: '50%', background: '#fffdf5', border: '1.5px solid #2b211c',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 100%',
      }}>
      <svg width="12" height="12" viewBox="0 0 12 12">{EMOTION_ICON[shown]}</svg>
    </div>
  );
};

// 住民の絵の枠（よこ 40・たて 48）。足もとの地面は、枠の下から GROUND_GAP だけ上にある
const vW = VILLAGER_BOX.width;
const vH = VILLAGER_BOX.height;
const GROUND_GAP = VILLAGER_BOX.y + VILLAGER_BOX.height;
/** 歩くときに ゆれる中心（足もとの地面） */
const BODY_ORIGIN = `50% ${vH - GROUND_GAP}px`;
/** 名札の高さ（とがり 2.4 + ふだ 13.2）と、ふきだしとの すきま */
const TAG_HEIGHT = 15.6;

/**
 * 住民 1 人。
 * ⚠️ 位置を毎フレーム React で書き換えないこと。町マップは要素が多く、画面のどこかが
 *    1 か所変わるだけでブラウザが全体の合成をやり直す（重い町では 1 回 20ms 前後）。
 *    歩き出すときに行き先と所要時間だけを渡し、移動は CSS の transition（transform）に任せる。
 */
const VillagerDot = React.memo(({ villager, mapData = NO_MAP, pointsOfInterest = NO_POINTS, exploredRadius = 3 }) => {
  const shouldReduceMotion = useReducedMotionConfig();
  // === ステートマシンの状態 ===
  // 座標は初期値として村民のデータ上の座標を利用。歩いている間は「行き先」を持つ
  const [gridPos, setGridPos] = useState({ x: villager.x, y: villager.y });
  const [moveSeconds, setMoveSeconds] = useState(0); // いまの移動にかける秒数（transition の長さ）
  const [aiState, setAiState] = useState('IDLE'); // 'IDLE' | 'MOVING' | 'INTERACTING'
  const [emotion, setEmotion] = useState(null); // 'heart' | 'note' | 'exclamation' | 'sleep' | null
  const [facesRight, setFacesRight] = useState(false); // 進行方向による翻転
  const bodyRef = useRef(null);

  // 重なり防止のための微細な個体別オフセット (一度決めたらずれないようにRefで保持)
  const visualOffset = useRef({
    x: (Math.random() - 0.5) * 12,
    y: (Math.random() - 0.5) * 8
  }).current;

  // 状態管理用のRef
  const stateRef = useRef({
    currentState: 'IDLE',
    gridX: villager.x,
    gridY: villager.y,
    targetX: villager.x,
    targetY: villager.y,
    legX: villager.x, // 表示に渡している区間の終わり
    legY: villager.y,
    interactTargetId: null, // 向かっている建物の種類（building / nature など）
    timer: 0, // 状態遷移用の汎用タイマー
    baseSpeed: 0.02 + (villager.id.length % 3) * 0.005, // 個体別の歩行速度
  });

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    let emotionTimerId = null;

    /**
     * 次の区間（最大 LEG_CELLS マス）の行き先を表示に渡す。重なり順（z-index）は区間の
     * 終わりで決まるので、長い道のりは区切って、建物の前後の入れ替わりを保つ
     */
    const showNextLeg = (s) => {
      const dx = s.targetX - s.gridX;
      const dy = s.targetY - s.gridY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const leg = Math.min(dist, LEG_CELLS);
      s.legX = dist > 0 ? s.gridX + (dx / dist) * leg : s.targetX;
      s.legY = dist > 0 ? s.gridY + (dy / dist) * leg : s.targetY;
      setMoveSeconds(leg / (s.baseSpeed * 60));
      setGridPos({ x: s.legX, y: s.legY });
    };

    /** 行き先を決めて歩き出す（React の更新は、区間の切り替えと到着のときだけ） */
    const startMove = (s) => {
      const dx = s.targetX - s.gridX;
      s.currentState = 'MOVING';
      setAiState('MOVING');
      if (Math.abs(dx) > 0.01) setFacesRight(dx > 0); // 振り向き設定
      showNextLeg(s);
    };

    const unsubscribe = subscribeTownAnimation((_time, dt) => {
      const s = stateRef.current;

      s.timer -= dt;

      if (s.currentState === 'IDLE') {
        // --- 待機状態 ---
        if (s.timer <= 0) {
          // 次の行動を決定
          // マップ上の興味深い施設（家、店、自然など）を現在地周辺（半径6マス）から探す
          // 候補（建物のある座標）は地図が変わったときに町マップ側で 1 回だけ作ってある。
          // 水路などの侵入不可オブジェクトも、シンプルに「目標タイルの上」を通れる前提（表示上は被るだけ）とする
          const candidates = nearbyPointsOfInterest(pointsOfInterest, s.gridX, s.gridY, 6);

          if (candidates.length > 0 && Math.random() > 0.3) {
            // 建物を発見
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            s.targetX = target.x;
            s.targetY = target.y;
            s.interactTargetId = target.type;
            startMove(s);
            // 行動決定のリアクション
            if(Math.random() > 0.7) {
              setEmotion('exclamation');
              if (emotionTimerId) clearTimeout(emotionTimerId);
              emotionTimerId = setTimeout(() => setEmotion(null), 1500);
            }
          } else {
            // ランダムに少しだけ散歩
            s.targetX = keepOnIsland(s.gridX + (Math.random() * 4 - 2), exploredRadius);
            s.targetY = keepOnIsland(s.gridY + (Math.random() * 4 - 2), exploredRadius);
            s.interactTargetId = null;
            startMove(s);
          }
        }
      } else if (s.currentState === 'MOVING') {
        // --- 移動状態（位置は内部でだけ進め、表示は transition に任せる） ---
        const dx = s.targetX - s.gridX;
        const dy = s.targetY - s.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
          // 到着
          s.gridX = s.targetX;
          s.gridY = s.targetY;

          if (s.interactTargetId) {
            // インタラクト開始
            s.currentState = 'INTERACTING';
            setAiState('INTERACTING');
            s.timer = 3 + Math.random() * 2; // 3〜5秒インタラクト

            // 対象オブジェクトに応じたリアクション
            const tType = s.interactTargetId;
            if (tType === 'building' || tType === 'mega') setEmotion('heart');
            else if (tType === 'nature') setEmotion('note');
            else setEmotion('sleep');

          } else {
            // 単なる散歩の終わり
            s.currentState = 'IDLE';
            setAiState('IDLE');
            s.timer = 1 + Math.random() * 3; // 1〜4秒待機
            setEmotion(null);
          }
        } else {
          // 移動させる（フレームレート非依存の移動量）
          const moveStep = Math.min(dist, s.baseSpeed * 60 * dt);
          s.gridX += (dx / dist) * moveStep;
          s.gridY += (dy / dist) * moveStep;
          // いまの区間の終わりまで来たら、次の区間を表示に渡す
          const legRemaining = Math.hypot(s.legX - s.gridX, s.legY - s.gridY);
          const legIsLast = Math.hypot(s.targetX - s.legX, s.targetY - s.legY) < 0.1;
          if (!legIsLast && legRemaining < 0.05) showNextLeg(s);
        }
      } else if (s.currentState === 'INTERACTING') {
        // --- インタラクト状態 ---
        if (s.timer <= 0) {
          s.currentState = 'IDLE';
          setAiState('IDLE');
          s.timer = 2 + Math.random() * 3; // 休憩
          setEmotion(null);
          s.interactTargetId = null;
        }
      }

    });

    return () => {
      unsubscribe();
      if (emotionTimerId) clearTimeout(emotionTimerId);
    };
  }, [pointsOfInterest, shouldReduceMotion, villager.id.length, exploredRadius]);

  // 移動中のボビング（上下の揺れ）／インタラクト中のジャンプ
  const motionKind = shouldReduceMotion ? null
    : aiState === 'MOVING' ? 'bob'
      : (aiState === 'INTERACTING' && emotion === 'heart') ? 'jump' : null;
  useEffect(() => {
    const el = bodyRef.current;
    if (!motionKind || !el || typeof el.animate !== 'function') return undefined;
    const animation = el.animate(motionKind === 'bob' ? BOB_FRAMES : JUMP_FRAMES, {
      duration: MOTION_PERIOD_MS,
      iterations: Infinity,
    });
    return () => animation.cancel();
  }, [motionKind]);

  // CSS描画用位置計算（歩いている間は行き先の位置。そこまでは transition が運ぶ）
  const screenX = toIsoX(gridPos.x, gridPos.y) + visualOffset.x - vW / 2;
  const screenY = toIsoY(gridPos.x, gridPos.y) + visualOffset.y - vH + GROUND_GAP;

  // 現在地のタイルIDを取得し、未開拓（草木）か判定する
  const currentTileId = mapData[`${Math.round(gridPos.x)},${Math.round(gridPos.y)}`];
  const offIsland = Math.max(Math.abs(Math.round(gridPos.x) - C), Math.abs(Math.round(gridPos.y) - C)) > exploredRadius;
  const isHidden = offIsland || CULTIVATABLE_TERRAIN.has(currentTileId);

  return (
    <div className={`pointer-events-none flex flex-col items-center justify-end ${isHidden ? 'opacity-0' : 'opacity-100'}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: vW,
        height: vH,
        zIndex: villagerDepth(gridPos.x, gridPos.y),
        isolation: 'isolate',
        transform: `translate(${screenX}px, ${screenY}px)`,
        transition: `transform ${moveSeconds.toFixed(2)}s linear, opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'transform',
      }}>
      {/* 体・名札・ふきだしを ひとまとめにして、歩くときに上下に ゆらす */}
      <div ref={bodyRef} style={{ position: 'relative', width: vW, height: vH, transformOrigin: BODY_ORIGIN }}>
        <VillagerFigure occupation={villager.occupation} id={villager.id} char={villager.kanjiChar} facesRight={facesRight} />
        <EmotionBubble emotion={emotion} bottom={GROUND_GAP + villagerTop(villagerKind(villager.occupation)) + 3 + TAG_HEIGHT} />
      </div>
    </div>
  );
});

export default VillagerDot;
