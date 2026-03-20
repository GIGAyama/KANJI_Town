import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOccupation } from '../../data/residents';

const TILE_W = 64;
const TILE_H = 32;
const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);

import { IsoAvatar } from '../../data/iso-avatar';
import { TOWN_ITEMS } from '../../data/town-items';

// 職業IDから対応するAvatarコンポーネントを取得
const getAvatarComponent = (occupationId) => {
  switch (occupationId) {
    case 'farmer': return IsoAvatar.Farmer;
    case 'merchant': return IsoAvatar.Merchant;
    case 'craftsman': return IsoAvatar.Craftsman;
    case 'blacksmith': return IsoAvatar.Blacksmith;
    case 'scholar': return IsoAvatar.Scholar;
    case 'legendary': return IsoAvatar.Legendary;
    default: return IsoAvatar.Farmer;
  }
};

const CULTIVATABLE_TERRAIN = new Set([
  't_roughland', 't_weed', 't_grassland', 't_forest_floor', 't_highland', 't_sand'
]);

// 距離計算ヘルパー
const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const VillagerDot = React.memo(({ villager, mapData = {}, tileW, tileH, offset, zoom = 1, containerWidth }) => {
  // === ステートマシンの状態 ===
  // 座標は初期値として村民のデータ上の座標を利用
  const [gridPos, setGridPos] = useState({ x: villager.x, y: villager.y });
  const [aiState, setAiState] = useState('IDLE'); // 'IDLE' | 'MOVING' | 'INTERACTING'
  const [emotion, setEmotion] = useState(null); // 'heart' | 'note' | 'exclamation' | 'sleep' | null
  const [facesRight, setFacesRight] = useState(false); // 進行方向による翻転
  
  // 重なり防止のための微細な個体別オフセット (一度決めたらずれないようにRefで保持)
  const visualOffset = useRef({
    x: (Math.random() - 0.5) * 12,
    y: (Math.random() - 0.5) * 8
  }).current;
  
  // 状態管理やアニメーションフレーム用のRef
  const stateRef = useRef({
    currentState: 'IDLE',
    gridX: villager.x,
    gridY: villager.y,
    targetX: villager.x,
    targetY: villager.y,
    interactTargetId: null, // 到達したタイルのアイテムID
    timer: 0, // 状態遷移用の汎用タイマー
    baseSpeed: 0.02 + (villager.id.length % 3) * 0.005, // 個体別の歩行速度
  });

  const frameRef = useRef(null);
  const occ = getOccupation(villager.occupation);
  const Avatar = getAvatarComponent(villager.occupation);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // デルタタイム（最大0.1秒）
      lastTime = time;
      const s = stateRef.current;

      s.timer -= dt;

      if (s.currentState === 'IDLE') {
        // --- 待機状態 ---
        if (s.timer <= 0) {
          // 次の行動を決定
          // マップ上の興味深い施設（家、店、自然など）を現在地周辺（半径6マス）から探す
          const searchRadius = 6;
          const candidates = [];
          
          for (const [key, itemId] of Object.entries(mapData)) {
            const [ix, iy] = key.split(',').map(Number);
            const dist = distance(s.gridX, s.gridY, ix, iy);
            if (dist > 0.5 && dist <= searchRadius) {
              const itemDef = TOWN_ITEMS.find(i => i.id === itemId);
              if (itemDef && (itemDef.type === 'building' || itemDef.type === 'mega' || itemDef.type === 'rare' || itemDef.type === 'nature')) {
                // 水路などの侵入不可オブジェクトは少し手前を目的地にする等の工夫が可能だが、
                // 今回はシンプルに「目標タイルの上」を通れる前提（表示上は被るだけ）とする
                candidates.push({ x: ix, y: iy, item: itemDef });
              }
            }
          }

          if (candidates.length > 0 && Math.random() > 0.3) {
            // 建物を発見
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            s.targetX = target.x;
            s.targetY = target.y;
            s.interactTargetId = target.item;
            s.currentState = 'MOVING';
            setAiState('MOVING');
            // 行動決定のリアクション
            if(Math.random() > 0.7) {
              setEmotion('exclamation');
              setTimeout(() => setEmotion(null), 1500);
            }
          } else {
            // ランダムに少しだけ散歩
            s.targetX = s.gridX + (Math.random() * 4 - 2);
            s.targetY = s.gridY + (Math.random() * 4 - 2);
            s.interactTargetId = null;
            s.currentState = 'MOVING';
            setAiState('MOVING');
          }
        }
      } else if (s.currentState === 'MOVING') {
        // --- 移動状態 ---
        const dx = s.targetX - s.gridX;
        const dy = s.targetY - s.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 振り向き設定
        if (Math.abs(dx) > 0.01) {
          setFacesRight(dx > 0);
        }

        if (dist < 0.1) {
          // 到着
          s.gridX = s.targetX;
          s.gridY = s.targetY;
          setGridPos({ x: s.gridX, y: s.gridY });
          
          if (s.interactTargetId) {
            // インタラクト開始
            s.currentState = 'INTERACTING';
            setAiState('INTERACTING');
            s.timer = 3 + Math.random() * 2; // 3〜5秒インタラクト
            
            // 対象オブジェクトに応じたリアクション
            const tType = s.interactTargetId.type;
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
          // 移動させる
          const moveStep = s.baseSpeed * 60 * dt; // フレームレート非依存の移動量
          const actualH = (dx / dist) * moveStep;
          const actualV = (dy / dist) * moveStep;
          s.gridX += actualH;
          s.gridY += actualV;
          
          // 頻繁なステート更新によるReactの再レンダリングコストを下げるため、
          // gridPosの更新は適度に行うか、直接アニメーションフレームで描画位置を計算する
          setGridPos({ x: s.gridX, y: s.gridY });
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

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [mapData, villager.id.length]);

  // CSS描画用位置計算
  const baseIsoX = toIsoX(gridPos.x, gridPos.y);
  const baseIsoY = toIsoY(gridPos.x, gridPos.y);

  // 移動中のボビング（上下の揺れ）
  const bobbing = aiState === 'MOVING' ? Math.sin(Date.now() / 100) * 3 : 0;
  // インタラクト中のジャンプ
  const jumping = (aiState === 'INTERACTING' && emotion === 'heart') ? Math.abs(Math.sin(Date.now() / 200)) * -6 : 0;

  const screenX = baseIsoX * zoom + offset.x + visualOffset.x * zoom + (containerWidth ? containerWidth / 2 : (typeof window !== 'undefined' ? window.innerWidth / 2 : 400));
  const screenY = (baseIsoY + bobbing + jumping) * zoom + offset.y + visualOffset.y * zoom;

  // 現在地のタイルIDを取得し、未開拓（草木）か判定する
  const currentTileId = mapData[`${Math.round(gridPos.x)},${Math.round(gridPos.y)}`];
  const isHidden = CULTIVATABLE_TERRAIN.has(currentTileId);

  // Z-Indexはアイソメトリックの深さに依存させる (x + y)
  const zIndex = Math.round(gridPos.x + gridPos.y);

  return (
    <div className={`absolute pointer-events-none flex flex-col items-center justify-end transition-opacity duration-500 ${isHidden ? 'opacity-0' : 'opacity-100'}`}
      style={{ left: screenX, top: screenY, transform: 'translate(-50%,-100%)', width: 40, height: 48, zIndex }}>
      
      {/* 感情ふきだし (AIステート起因) */}
      <AnimatePresence>
        {emotion && (
          <motion.div 
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-4 bg-white/90 rounded-full px-1.5 py-0.5 shadow-md shadow-black/20 text-xs border border-slate-200 z-20"
          >
            {emotion === 'heart' && '❤️'}
            {emotion === 'note' && '🎵'}
            {emotion === 'exclamation' && '❕'}
            {emotion === 'sleep' && '💤'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3Dアイソメトリックアバター + 頭上の漢字 */}
      <div className="relative w-10 h-10 transition-transform duration-200">
        {/* 頭上の漢字（アバターに密着させる） */}
        <div className="absolute top-[2px] left-1/2 -translate-x-1/2 text-[10px] font-black leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] z-10 w-full text-center"
          style={{ color: '#fff', textShadow: '0 0 4px #e11d48, 0 0 2px #e11d48, 0 0 1px #e11d48' }}>
          {villager.kanjiChar}
        </div>
        
        {/* アバター本体 */}
        <div 
          className="w-full h-full origin-bottom transform"
          style={{ transform: `scaleX(${facesRight ? -1 : 1})` }}
        >
          <Avatar />
        </div>
      </div>
    </div>
  );
});

export default VillagerDot;
