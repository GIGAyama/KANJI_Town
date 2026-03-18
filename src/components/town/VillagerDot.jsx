import React, { useState, useEffect, useRef } from 'react';
import { getOccupation } from '../../data/residents';

const TILE_W = 64;
const TILE_H = 32;
const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);

import { IsoAvatar } from '../../data/iso-avatar';

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

const VillagerDot = React.memo(({ villager, mapData = {}, tileW, tileH, offset, zoom = 1 }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const tRef = useRef(Math.random() * Math.PI * 2);

  const occ = getOccupation(villager.occupation);
  const Avatar = getAvatarComponent(villager.occupation);

  useEffect(() => {
    const speed = 0.006 + (villager.id.length % 3) * 0.002;
    const range = 8;
    const animate = () => {
      tRef.current += speed;
      // グリッド座標からアイソメトリックスクリーン座標へ
      const baseIsoX = toIsoX(villager.x, villager.y);
      const baseIsoY = toIsoY(villager.x, villager.y);
      setPos({
        x: baseIsoX + Math.sin(tRef.current) * range,
        y: baseIsoY + Math.cos(tRef.current * 0.7) * range - 10,
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [villager.x, villager.y]);

  const screenX = pos.x * zoom + offset.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const screenY = pos.y * zoom + offset.y;

  // 現在地のタイルIDを取得し、未開拓（草木）か判定する
  // base32座標系を使用 (x, y) = villager.x, villager.y
  const currentTileId = mapData[`${Math.round(villager.x)},${Math.round(villager.y)}`];
  const isHidden = CULTIVATABLE_TERRAIN.has(currentTileId) || currentTileId === 't_water';

  return (
    <div className={`absolute pointer-events-none z-30 flex flex-col items-center justify-end transition-opacity duration-500 ${isHidden ? 'opacity-0' : 'opacity-100'}`}
      style={{ left: screenX, top: screenY, transform: 'translate(-50%,-100%)', width: 64, height: 80 }}>
      {/* 頭上の漢字プレーンテキスト（縁取り付きで視認性確保） */}
      <div className="text-[12px] font-black leading-none mb-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] z-10"
        style={{ color: '#fff', textShadow: '0 0 4px #e11d48, 0 0 2px #e11d48, 0 0 1px #e11d48' }}>
        {villager.kanjiChar}
      </div>
      
      {/* 3Dアイソメトリックアバター */}
      <div className="w-16 h-16 origin-bottom transform translate-y-2">
        <Avatar />
      </div>
    </div>
  );
});

export default VillagerDot;
