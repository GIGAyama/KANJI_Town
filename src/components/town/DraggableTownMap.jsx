import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CloudRain, Snowflake, ZoomIn, ZoomOut, Users } from 'lucide-react';
import { TOWN_ITEM_MAP } from '../../data/town-items';
import VillagerCanvas from './VillagerCanvas';
import WeatherOverlay from './WeatherOverlay';
import TerrainLayer from './TerrainLayer';
import { WildProp, WILD_PROP_BOX, mountWildProps, wildPropFor } from './WildProps';
import { audioCtrl } from '../../systems/audio';
import { buildGroundModel, isGroundItem, turnedToFit } from '../../systems/town-ground';
import { itemFit } from '../../data/town-item-fit';
import { nightLightOf } from '../../systems/town-night-light';
import { townArtFor, useTownArtReady } from '../../data/town-art';
import {
  TILE_W, TILE_H, GRID_SIZE, C, toIsoX, toIsoY, fromIso,
  computeViewRange, isExplored, clampZoom, zoomAround, fitTownView,
} from '../../systems/town-map-view';

export { GRID_SIZE, C };

// 開拓可能な地形
const CULTIVATABLE_TERRAIN = new Set(['t_roughland', 't_grassland', 't_forest_floor', 't_sand', 't_highland']);

/** mapData が無いときに毎回新しい {} を作ると、全マスの計算が毎回やり直しになる */
const EMPTY_MAP = Object.freeze({});

// 野生の木や岩の絵のおおもとを、文書に 1 回だけ置く
mountWildProps();

// ── 空 ──
// 町は、雲の上に浮かぶ島として描く。まわりは空で、時間帯で色が変わる。
// ⚠️ 夕方と夜は、下の「時間帯レイヤー」が空ごと色をかぶせる。ここの色は かぶせる前の色。
const SKY = {
  day: 'linear-gradient(180deg, #7ecbfb 0%, #a9defc 48%, #dcf2ff 100%)',
  evening: 'linear-gradient(180deg, #8fb4f2 0%, #ffc59a 58%, #ffe3b5 100%)',
  night: 'linear-gradient(180deg, #2a3d86 0%, #4d5fae 62%, #7a86c8 100%)',
  danger: 'linear-gradient(180deg, #0b1220 0%, #1e293b 70%, #334155 100%)',
};
const CLOUD_TINT = {
  day: ['#ffffff', '#d5ebfb'],
  evening: ['#fff4e6', '#ffd2ae'],
  night: ['#c9d3f2', '#8f9ed6'],
  danger: ['#475569', '#334155'],
};
/**
 * 空に浮かぶ雲（位置は枠に対する %）。
 * ⚠️ 動かさない。雲を CSS のアニメーションで流すと、何も変わらないあいだも毎フレーム
 *    画面の合成が走り、雲に重なる町のレイヤーまで合成しなおす（重い町で、ずらす操作が
 *    目に見えて遅くなった）。町マップでは、止まっているあいだは 1 フレームも描かない。
 */
const SKY_CLOUDS = [
  { left: '4%', top: '9%', width: '19%' },
  { left: '58%', top: '5%', width: '13%' },
  { left: '78%', top: '26%', width: '22%' },
  { left: '-4%', top: '62%', width: '24%' },
  { left: '66%', top: '78%', width: '17%' },
];

// 雲の大きさは枠の幅に合わせる（スマホの小さな枠で、雲が町より大きくならないように）
const SkyCloud = memo(({ cloud, tint }) => (
  <svg viewBox="0 0 120 54" aria-hidden="true"
    className="absolute pointer-events-none"
    style={{ left: cloud.left, top: cloud.top, width: cloud.width, minWidth: 56, maxWidth: 230, height: 'auto' }}>
    <path d="M18 50a14 14 0 0 1 2-27.8A20 20 0 0 1 58 14a17 17 0 0 1 30 6 15 15 0 0 1 12 30Z" fill={tint[1]} />
    <path d="M20 44a11 11 0 0 1 3-21.5A18 18 0 0 1 57 17a15 15 0 0 1 27 6 12 12 0 0 1 10 21Z" fill={tint[0]} />
  </svg>
));

/**
 * 絵を置く箱。絵の「足もとのまん中」を、置いたマス（大きな建物なら足もと全体）のまん中に合わせる。
 * 絵ごとの足もとの位置と大きさは data/town-item-fit.js の表にある。
 * @param {boolean} mirrored 左右を うら返して置くか（表の flip と、seed による向きがえを合わせたもの）
 */
function artBox(item, x, y, mirrored, lift = 0) {
  const fit = itemFit(item);
  const w = item.size?.w || 1;
  const h = item.size?.h || 1;
  const width = 100 * fit.s;
  const height = 200 * fit.s;
  return {
    position: 'absolute',
    left: toIsoX(x + w / 2, y + h / 2) - (mirrored ? -fit.ax : fit.ax) * fit.s - width / 2,
    top: toIsoY(x + w / 2, y + h / 2) - fit.ay * fit.s - height - lift,
    width,
    height,
  };
}

const POP_IN = { scale: 0.3, y: -60, opacity: 0 };
const POP_TRANSITION = { type: 'spring', stiffness: 600, damping: 12, mass: 0.8 };

/** 絵 1 枚（置いたときだけ「ぽん」と出る）。絵の束がまだ読めていなければ何も描かない */
const TownArt = ({ item, itemId, x, y, seed, mirrored, lift, zIndex, fresh }) => {
  const Art = townArtFor(item);
  if (!Art) return null;
  return (
    <div style={{ ...artBox(item, x, y, mirrored, lift), zIndex }} className="select-none pointer-events-none">
      <AnimatePresence mode="popLayout">
        <motion.div key={itemId} initial={fresh ? POP_IN : false} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0 }}
          transition={POP_TRANSITION} className="absolute inset-0"
          style={{ transformOrigin: '50% 100%' }}>
          <div className="w-full h-full" style={mirrored ? { transform: 'scaleX(-1)' } : undefined}>
            <Art seed={seed} place />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── 1 マス分の立っているもの（建物・木・上乗せ） ──
// 地面は TerrainLayer が描くので、ここは「立っているもの」があるマスだけを作る。
// 値の props だけを受け取って memo する。ドラッグで表示範囲が変わっても、
// 地図が変わらないマスは描き直さない。
// artReady は、絵の束が読めたときに描き直すためだけに受け取る（中では使わない）
// turn・topTurn は、となりの水路・道の向きに そろえて うら返すか（橋・車など。systems/town-ground.js の turnedToFit）
const TownCell = memo(({ x, y, baseItemId, topItemId, wildProp, hasGhost, fresh, freshTop, turn, topTurn, artReady }) => { // eslint-disable-line no-unused-vars
  const depth = Math.floor((x + y) * 100);
  const item = baseItemId ? TOWN_ITEM_MAP.get(baseItemId) || null : null;
  const topItem = topItemId ? TOWN_ITEM_MAP.get(topItemId) || null : null;

  // (x * 13 + y * 7) のようなシンプルなハッシュで決定論的なシードを得る（家の色・木の種類・向きに使う）
  const seedVal = (x * 13 + y * 7) % 100;
  const isoX = toIsoX(x, y);
  const isoY = toIsoY(x, y);
  const standZIndex = depth + 140; // 立体物は、同じマスの地面・平面より手前
  // 大きな建物は、いちばん手前のマスの奥行きに合わせる（１マスの建物(+140)と基準をそろえる）
  const itemZIndex = item?.size ? depth + (item.size.w + item.size.h - 2) * 100 + 140 : standZIndex;
  // 向きがえ: 橋は水路の向きで決まる（turn）。ほかは seed で決まり、1 マスのものだけ（大きな建物は、足もとの形が変わってしまう）
  const turned = turn ?? Boolean(item?.hasVariants && !item.size && seedVal % 2 === 0);

  return (
    <>
      {/* 野生の木・岩（ひらいていない土地） */}
      {wildProp && (
        <div style={{ position: 'absolute', left: isoX + WILD_PROP_BOX.x, top: isoY + TILE_H / 2 + WILD_PROP_BOX.y, zIndex: standZIndex }}
          className="select-none pointer-events-none">
          <WildProp name={wildProp} />
        </div>
      )}

      {/* 建物・木などの立体物 */}
      {item && (
        <TownArt item={item} itemId={baseItemId} x={x} y={y} seed={seedVal}
          mirrored={itemFit(item).flip !== turned} lift={0} zIndex={itemZIndex} fresh={fresh} />
      )}

      {/* 上乗せ（道の上の車・ベンチなど）。平らなものの厚み（2px）だけ持ち上げる */}
      {topItem && (
        <TownArt item={topItem} itemId={topItemId} x={x} y={y} seed={seedVal}
          mirrored={itemFit(topItem).flip !== Boolean(topTurn)} lift={2} zIndex={standZIndex + 1} fresh={freshTop} />
      )}

      {/* ゴースト（復習がたまっているとき） */}
      {hasGhost && (
        <div style={{ position: 'absolute', left: isoX - TILE_W / 2, width: TILE_W, top: isoY - 30, height: 40, zIndex: standZIndex + 5 }}
          className="pointer-events-none select-none flex justify-center">
          <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl leading-none drop-shadow-lg">👻</motion.div>
        </div>
      )}
    </>
  );
});

// ── 夜のあかり ──
// 夜は町ぜんたいに暗い色を 1 枚かぶせる（下の「時間帯レイヤー」）。その上に、建物の窓や
// 街灯のあかりを、ぼんやりした丸として重ねる。どのアイテムが どこで光るかは systems/town-night-light.js が決める。
//
// あかりは 1 枚の SVG の中の だ円にする。1 つずつ div で置くと、ブラウザは div ごとに別の かたまりとして
// 合成を考え、はなれた あかりを 1 枚に まとめない（建物 600 の町の夜で、合成レイヤーが 40 枚あまり ふえていた）。
const NIGHT_GLOW_ID = 'town-night-glow';

const NightLight = memo(({ x, y, w, h, light }) => (
  <ellipse
    cx={toIsoX(x + (light.cu ?? w / 2), y + (light.cv ?? h / 2)) + light.dx}
    cy={toIsoY(x + (light.cu ?? w / 2), y + (light.cv ?? h / 2)) - light.lift}
    rx={light.width / 2} ry={light.height / 2} fill={`url(#${NIGHT_GLOW_ID})`} />
));

// ── マスの上に出す目じるし（押しているマス・置ける範囲） ──
const HINT_TONES = {
  plain: { fill: 'rgba(255,255,255,0.22)', stroke: 'rgba(255,255,255,0.9)' },
  good: { fill: 'rgba(52,211,153,0.38)', stroke: 'rgba(5,150,105,0.95)' },
  bad: { fill: 'rgba(248,113,113,0.42)', stroke: 'rgba(220,38,38,0.95)' },
  cost: { fill: 'rgba(251,191,36,0.4)', stroke: 'rgba(217,119,6,0.95)' },
};

const CellHighlight = memo(({ x, y, w = 1, h = 1, tone = 'plain', label }) => {
  const color = HINT_TONES[tone] || HINT_TONES.plain;
  const half = TILE_W / 2;
  const quarter = TILE_H / 2;
  const width = (w + h) * half;
  const height = (w + h) * quarter;
  return (
    <div style={{
      position: 'absolute', left: toIsoX(x, y + h), top: toIsoY(x, y), width, height,
      pointerEvents: 'none', zIndex: 99999,
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <polygon points={`${h * half},0 ${width},${w * quarter} ${w * half},${height} 0,${h * quarter}`}
          fill={color.fill} stroke={color.stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      {label && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-md"
          style={{ backgroundColor: color.stroke }}>{label}</div>
      )}
    </div>
  );
});

// ── マスの上の演出（開拓の土けむり・置いたときの きらめき・消したときの けむり） ──
// 以前は画面のまん中に絵文字を飛ばしていたので、どのマスで何が起きたのかが分からなかった。
const EFFECT_STYLES = {
  dust: { colors: ['#d9bb83', '#ead2a0', '#f4e2bd'], count: 6, spread: 26, size: 11 },
  place: { colors: ['#fff3a0', '#ffffff', '#ffd24a'], count: 6, spread: 30, size: 7 },
  poof: { colors: ['#ffffff', '#e2e8f0', '#cbd5e1'], count: 5, spread: 22, size: 12 },
};

const CellEffect = ({ effect }) => {
  const style = EFFECT_STYLES[effect.kind] || EFFECT_STYLES.dust;
  const w = effect.w || 1;
  const h = effect.h || 1;
  return (
    <div style={{ position: 'absolute', left: toIsoX(effect.x + w / 2, effect.y + h / 2), top: toIsoY(effect.x + w / 2, effect.y + h / 2), zIndex: 99998, pointerEvents: 'none' }}>
      {Array.from({ length: style.count }, (_, i) => {
        const angle = (i / style.count) * Math.PI * 2 + 0.4;
        const reach = style.spread * (0.7 + (i % 3) * 0.2) * Math.max(1, (w + h) / 2.4);
        return (
          <motion.span key={i} aria-hidden="true"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0.95 }}
            animate={{ x: Math.cos(angle) * reach, y: Math.sin(angle) * reach * 0.5 - 10, scale: 1.25, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.02 }}
            style={{
              position: 'absolute', left: -style.size / 2, top: -style.size / 2, width: style.size, height: style.size,
              borderRadius: '50%', backgroundColor: style.colors[i % style.colors.length],
            }} />
        );
      })}
      {effect.label && (
        <motion.div initial={{ y: -6, opacity: 1, scale: 0.8 }} animate={{ y: -44, opacity: 0, scale: 1.1 }} transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white shadow-md">
          {effect.label}
        </motion.div>
      )}
    </div>
  );
};

// ── メインコンポーネント ──
const NO_VILLAGERS = Object.freeze([]);
const INITIAL_VIEW = Object.freeze({ x: 0, y: 0, zoom: 1 });
const ZOOM_STEP = 1.25;

/**
 * @param {object} props
 * @param {(x: number, y: number) => ({ w?: number, h?: number, tone?: string, label?: string } | null)} [props.getCellHint]
 *   押している（マウスなら指している）マスに出す目じるしを返す。まちづくりの画面が、置ける範囲や開拓の費用を出すのに使う。
 *   x・y を返すと、その位置から目じるしを描く（大きな建物の、左上のマスから）
 * @param {{ id: number, x: number, y: number, w?: number, h?: number, kind: 'dust'|'place'|'poof', label?: string } | null} [props.effect]
 *   マスの上で 1 回だけ出す演出。id を変えると出しなおす
 */
const DraggableTownMap = memo(({ mapData, isDanger, isEditing, onCellTap, reviewCount, villagers = NO_VILLAGERS, exploredRadius = 3, getCellHint, effect = null }) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 }); // 初期値を0に設定
  // 位置と拡大率は 1 つにまとめて持つ（拡大率を変えるときは、位置もいっしょに動かすため）
  const [view, setView] = useState(INITIAL_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [initialFitDone, setInitialFitDone] = useState(false); // 初回フィットフラグ
  const [timeOfDay, setTimeOfDay] = useState('day'); // 'day' | 'evening' | 'night'
  const [currentWeather, setCurrentWeather] = useState('clear'); // 'clear' | 'rain' | 'snow' | 'sakura'
  const [hoveredCell, setHoveredCell] = useState(null);
  // ドラッグ中だけ町のレイヤーを合成レイヤーにし、ずらすたびに町全体を描き直さない。
  // ずっと付けておくと、拡大率を変えたときに描き直されず絵がぼやけるため、離したら外す
  const [panning, setPanning] = useState(false);
  const [residentDisplayMode, setResidentDisplayMode] = useState(() => {
    try {
      return localStorage.getItem('kanji_town_resident_mode') || 'limited';
    } catch (e) {
      return 'limited';
    }
  }); // 'all' | 'limited' | 'none'
  // 建物の絵の束（読めるまでは地面だけを描く）
  const artReady = useTownArtReady();
  const onCellTapRef = useRef(onCellTap);
  const isDragging = useRef(false);
  const suppressClick = useRef(false);
  // 押している指（ポインター）の位置。2 本あれば つまんで拡大縮小する
  const pointers = useRef(new Map());
  // いまの操作のはじまり（ずらす: 位置と指の位置 / つまむ: 位置・拡大率・指のあいだの長さ）
  const gesture = useRef(null);
  // 位置の書きかえは 1 フレームに 1 回だけ反映する
  const pendingView = useRef(null);
  const moveFrame = useRef(0);
  useEffect(() => () => { if (moveFrame.current) cancelAnimationFrame(moveFrame.current); }, []);

  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  // 時間帯と天候の監視
  useEffect(() => {
    const updateTime = () => {
      const h = new Date().getHours();
      if (h >= 6 && h < 16) setTimeOfDay('day');
      else if (h >= 16 && h < 19) setTimeOfDay('evening');
      else setTimeOfDay('night');

      // 日付に依存した天候の決定（基本は晴れ、季節ごとにレア天候）
      const now = new Date();
      const month = now.getMonth() + 1;
      const dateStr = `${now.getFullYear()}-${month}-${now.getDate()}`;

      // 簡易的なシード乱数生成（その日は一日中同じ天候になる）
      let seed = 0;
      for (let i = 0; i < dateStr.length; i++) {
        seed += dateStr.charCodeAt(i) * (i + 1);
      }
      const rand = (seed * 9301 + 49297) % 233280 / 233280; // 0.0 ~ 1.0

      let weather = 'clear';
      if (month >= 3 && month <= 5) {
        // 春 (3〜5月): 桜(15%)、雨(10%)
        if (rand < 0.15) weather = 'sakura';
        else if (rand < 0.25) weather = 'rain';
      } else if (month === 6 || month === 7) {
        // 梅雨・夏 (6〜7月): 雨(20%)
        if (rand < 0.20) weather = 'rain';
      } else if (month === 12 || month === 1 || month === 2) {
        // 冬 (12〜2月): 雪(20%)
        if (rand < 0.20) weather = 'snow';
      } else {
        // その他: 雨(10%)
        if (rand < 0.10) weather = 'rain';
      }
      setCurrentWeather(weather);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000); // 1分ごとに日付や時間帯のロールオーバーを判定
    return () => clearInterval(timer);
  }, []);

  // コンテナサイズ監視（向き・サイズが大きく変わったら再フィット）
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize(prev => {
          // 縦横比が大きく変わったら（画面回転など）再フィットを発火
          if (prev.w > 0 && prev.h > 0) {
            const prevRatio = prev.w / prev.h;
            const newRatio = width / height;
            const ratioChanged = Math.abs(prevRatio - newRatio) / prevRatio > 0.2;
            const sizeChanged = Math.abs(prev.w - width) / prev.w > 0.3 || Math.abs(prev.h - height) / prev.h > 0.3;
            if (ratioChanged || sizeChanged) {
              setInitialFitDone(false);
            }
          }
          return { w: width, h: height };
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 初回マウント時：マップ範囲に合わせて自動ズーム・センタリング
  useEffect(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || initialFitDone) return;
    const fit = fitTownView({ width: containerSize.w, height: containerSize.h, exploredRadius, isEditing });
    setView({ x: fit.offsetX, y: fit.offsetY, zoom: fit.zoom });
    setInitialFitDone(true);
  }, [containerSize, exploredRadius, initialFitDone, isEditing]);

  const safeMapData = mapData || EMPTY_MAP;

  /** 位置と拡大率の書きかえを、次のフレームにまとめる */
  const scheduleView = useCallback((next) => {
    pendingView.current = next;
    if (moveFrame.current) return;
    moveFrame.current = requestAnimationFrame(() => {
      moveFrame.current = 0;
      const target = pendingView.current;
      pendingView.current = null;
      if (target) setView(target);
    });
  }, []);
  /** いまの位置（まだ反映していない書きかえがあれば、そちら） */
  const latestView = () => pendingView.current || viewRef.current;

  /** 画面の座標 → マス目 */
  const cellAt = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    const v = latestView();
    // CSS transform: translate(x, y) scale(zoom)、left: 50%
    const grid = fromIso((clientX - rect.left - rect.width / 2 - v.x) / v.zoom, (clientY - rect.top - v.y) / v.zoom);
    return grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE ? grid : null;
  };
  const showHover = (clientX, clientY) => {
    const grid = cellAt(clientX, clientY);
    // 同じマスの上で動いただけなら描き直さない
    setHoveredCell(prev => (grid && prev && prev.x === grid.x && prev.y === grid.y ? prev : grid));
  };

  // ── ドラッグ（ずらす）・ピンチ（つまんで拡大縮小） ──
  const startPan = (clientX, clientY) => {
    const v = latestView();
    gesture.current = { type: 'pan', startX: clientX, startY: clientY, view: v };
  };
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      isDragging.current = false;
      startPan(e.clientX, e.clientY);
      if (isEditing) showHover(e.clientX, e.clientY);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        type: 'pinch',
        view: latestView(),
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
      };
      isDragging.current = true; // 2 本指は、離してもタップにしない
      setPanning(true);
      setHoveredCell(null);
    }
  };
  const handlePointerMove = (e) => {
    const point = pointers.current.get(e.pointerId);
    if (!point) {
      // ボタンを押していないマウス: 指しているマスに目じるしを出す（まちづくりのときだけ）
      if (isEditing && e.pointerType === 'mouse') showHover(e.clientX, e.clientY);
      return;
    }
    point.x = e.clientX;
    point.y = e.clientY;
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = containerRef.current.getBoundingClientRect();
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const nextZoom = clampZoom(g.view.zoom * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / g.dist);
      // つまみはじめた 2 本指のまん中を基点に拡大率を変え、指が動いた分だけ ずらす
      const z = zoomAround({ offsetX: g.view.x, offsetY: g.view.y, zoom: g.view.zoom }, nextZoom, g.midX - rect.left, g.midY - rect.top, rect.width);
      scheduleView({ x: z.offsetX + (midX - g.midX), y: z.offsetY + (midY - g.midY), zoom: nextZoom });
      return;
    }
    if (g.type !== 'pan') return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!isDragging.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isDragging.current = true;
      setPanning(true);
      setHoveredCell(null);
    }
    if (isDragging.current) scheduleView({ x: g.view.x + dx, y: g.view.y + dy, zoom: g.view.zoom });
  };
  const endPointer = (e, canTap) => {
    if (!pointers.current.delete(e.pointerId)) return;
    if (pointers.current.size > 0) {
      // つまんでいた 2 本のうち 1 本が離れた: 残った指で ずらしつづける
      const [rest] = [...pointers.current.values()];
      startPan(rest.x, rest.y);
      return;
    }
    gesture.current = null;
    if (canTap && !isDragging.current && onCellTapRef.current && containerRef.current) {
      const grid = cellAt(e.clientX, e.clientY);
      if (grid) onCellTapRef.current(grid.x, grid.y);
    }
    // ずらし終わりの click は「タップ」ではない。ホームでは外側の「まちづくりへ」に
    // 届かないよう、このあとの click を 1 回だけ止める（マウス・タッチパッドで起きる）
    if (isDragging.current) suppressClick.current = true;
    setPanning(false);
    if (e.pointerType !== 'mouse') setHoveredCell(null);
  };
  const handlePointerUp = (e) => endPointer(e, true);
  const handlePointerCancel = (e) => endPointer(e, false);
  const handlePointerLeave = (e) => {
    endPointer(e, false);
    setHoveredCell(null);
  };
  const handleClickCapture = useCallback((e) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // ── ズーム ──
  // 画面のまん中を基点にする（以前は拡大率だけを変えていたので、大きくするたびに町が
  // 画面の下へ流れて見えなくなっていた）
  const zoomBy = (factor, anchorX, anchorY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = latestView();
    const nextZoom = clampZoom(v.zoom * factor);
    if (nextZoom === v.zoom) return;
    const z = zoomAround({ offsetX: v.x, offsetY: v.y, zoom: v.zoom }, nextZoom,
      anchorX ?? rect.width / 2, anchorY ?? rect.height / 2, rect.width);
    pendingView.current = null;
    setView({ x: z.offsetX, y: z.offsetY, zoom: nextZoom });
  };
  const handleZoomIn = () => zoomBy(ZOOM_STEP);
  const handleZoomOut = () => zoomBy(1 / ZOOM_STEP);

  // ホイール・タッチパッドのピンチ（Ctrl+ホイールとして届く）での拡大縮小。
  // ホームでは、ふつうのホイールはページのスクロールに残す（町の上で画面が止まらないように）
  const zoomByRef = useRef(zoomBy);
  zoomByRef.current = zoomBy;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!isEditing && !e.ctrlKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const amount = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomByRef.current(Math.exp(-amount * (e.ctrlKey ? 0.012 : 0.0016)), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isEditing]);

  // ── 住民表示モード切り替え ──
  const toggleResidentMode = () => {
    const modes = ['all', 'limited', 'none'];
    const next = modes[(modes.indexOf(residentDisplayMode) + 1) % modes.length];
    setResidentDisplayMode(next);
    try {
      localStorage.setItem('kanji_town_resident_mode', next);
    } catch (e) {}
    if (typeof audioCtrl !== 'undefined') audioCtrl.playSE('click');
  };

  // 表示する住民の選別
  const visibleVillagers = useMemo(() => {
    if (residentDisplayMode === 'none') return [];
    if (residentDisplayMode === 'all') return villagers;

    // 'limited' モード: 最大10人（住民リストの先頭から）
    return villagers.slice(0, 10);
  }, [villagers, residentDisplayMode]);

  // ── ビューポートカリング ──
  // 範囲は整数 4 つ。ドラッグ中でも境目をまたぐまでは同じなので、全マスを作り直さない
  const range = computeViewRange({ offsetX: view.x, offsetY: view.y, zoom: view.zoom, width: containerSize.w, height: containerSize.h });
  const viewRange = useMemo(() => range, [range.startX, range.startY, range.endX, range.endY]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 地面（地形・道・水・がけ・影）の表。地図が変わったときだけ作る ──
  const groundModel = useMemo(() => buildGroundModel(safeMapData, TOWN_ITEM_MAP, exploredRadius), [safeMapData, exploredRadius]);

  // ── メガ建築の、左上以外のマス（描かない） ──
  const megaSubCells = useMemo(() => {
    const subCells = new Set();
    for (const [key, itemId] of Object.entries(safeMapData)) {
      if (!itemId || typeof itemId !== 'string') continue;
      if (key.includes(':top')) continue;
      const item = TOWN_ITEM_MAP.get(itemId);
      if (item && item.size) {
        const [ax, ay] = key.split(',').map(Number);
        for (let dy = 0; dy < item.size.h; dy++) {
          for (let dx = 0; dx < item.size.w; dx++) {
            if (dx === 0 && dy === 0) continue;
            subCells.add(`${ax + dx},${ay + dy}`);
          }
        }
      }
    }
    return subCells;
  }, [safeMapData]);

  // 住民の行き先の候補は、地図が変わったときだけ作る

  // ── ゴースト（レビュー未完了時の演出） ──
  const ghosts = useMemo(() => {
    if (!isDanger || isEditing) return [];
    const exploredKeys = Object.keys(safeMapData).filter(k => {
      const [x, y] = k.split(',').map(Number);
      return Math.max(Math.abs(x - C), Math.abs(y - C)) <= exploredRadius;
    });
    if (exploredKeys.length === 0) return [{ x: C, y: C }];
    const seed = (reviewCount || 0) * 7919;
    const seededRand = (i) => { let x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    return Array.from({ length: Math.min(reviewCount || 0, 8) }, (_, i) => {
      const k = exploredKeys[Math.floor(seededRand(i) * exploredKeys.length)];
      const [x, y] = k.split(',').map(Number); return { x, y };
    });
  }, [isDanger, isEditing, reviewCount, exploredRadius, safeMapData]);
  const ghostKeys = useMemo(() => new Set(ghosts.map(g => `${g.x},${g.y}`)), [ghosts]);

  // ── セル描画 ──
  // 立っているもの（建物・木・上乗せ・野生の木や岩）があるマスだけを作る。
  // 奥から手前の順に並べる（重なりは z-index で決まるが、同じ高さのときは並び順で決まる）
  // 「ぽん」と出すのは、表示したあとに置いたものだけ。開いたときや、ずらして画面に
  // 入ったマスは出さない（前の地図とくらべて、変わったマスだけに印をつける）
  const previousMap = useRef(null);
  const cells = useMemo(() => {
    const { startX, startY, endX, endY } = viewRange;
    const before = previousMap.current;
    const changed = before !== null && before !== safeMapData;
    const cellList = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const key = `${x},${y}`;
        if (megaSubCells.has(key) || !isExplored(x, y, exploredRadius)) continue;
        const baseId = safeMapData[key];
        const topId = safeMapData[`${key}:top`];
        const item = baseId ? TOWN_ITEM_MAP.get(baseId) : null;
        const isTerrain = item?.type === 'terrain';
        // 地形と平らなもの（道・水など）は地面レイヤーが描く。ざっそうだけは立っているものとして描く
        const stands = item && (baseId === 't_weed' || (!isTerrain && !isGroundItem(baseId)));
        const wildProp = isTerrain ? wildPropFor(baseId, x, y) : null;
        const hasGhost = ghostKeys.has(key);
        if (!stands && !wildProp && !topId && !hasGhost) continue;
        cellList.push({
          x, y, key, baseId: stands ? baseId : undefined, topId, wildProp, hasGhost,
          turn: stands ? turnedToFit(safeMapData, x, y, baseId) : undefined,
          topTurn: topId ? turnedToFit(safeMapData, x, y, topId) : undefined,
        });
      }
    }
    cellList.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    return cellList.map(({ x, y, key, baseId, topId, wildProp, hasGhost, turn, topTurn }) => (
      <TownCell key={key} x={x} y={y}
        baseItemId={baseId} topItemId={topId} wildProp={wildProp} hasGhost={hasGhost} artReady={artReady}
        turn={turn} topTurn={topTurn}
        fresh={changed && before[key] !== safeMapData[key]}
        freshTop={changed && before[`${key}:top`] !== topId} />
    ));
  }, [safeMapData, ghostKeys, exploredRadius, viewRange, megaSubCells, artReady]);
  useEffect(() => { previousMap.current = safeMapData; }, [safeMapData]);

  const isDark = Boolean(isDanger && !isEditing);
  const mood = isDark ? 'danger' : timeOfDay;
  const isNight = timeOfDay === 'night' && !isDark;
  // 夜のあかり（夜でなければ何も作らない）
  const nightLights = useMemo(() => {
    if (!isNight) return null;
    const { startX, startY, endX, endY } = viewRange;
    const lights = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const key = `${x},${y}`;
        if (megaSubCells.has(key) || !isExplored(x, y, exploredRadius)) continue;
        for (const id of [safeMapData[key], safeMapData[`${key}:top`]]) {
          const item = id ? TOWN_ITEM_MAP.get(id) : null;
          const light = nightLightOf(id, item);
          if (light) lights.push(<NightLight key={`${key}-${id}`} x={x} y={y} w={item.size?.w || 1} h={item.size?.h || 1} light={light} />);
        }
      }
    }
    return lights;
  }, [isNight, safeMapData, viewRange, megaSubCells, exploredRadius]);
  const hint = hoveredCell && isEditing ? (getCellHint ? getCellHint(hoveredCell.x, hoveredCell.y) : null) : null;

  return (
      <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onClickCapture={handleClickCapture}
      onPointerDownCapture={() => { suppressClick.current = false; }}
      onPointerLeave={handlePointerLeave}
      className={`w-full h-full rounded-[16px] overflow-hidden border-[3px] border-[var(--text)] shadow-inner relative touch-none select-none ${isEditing ? 'cursor-pointer' : ''}`}
      style={{ opacity: initialFitDone ? 1 : 0, backgroundImage: SKY[mood], overflow: 'clip' }}>
      {/* --- 空の雲（町のうしろ） --- */}
      {SKY_CLOUDS.map((cloud) => <SkyCloud key={cloud.left} cloud={cloud} tint={CLOUD_TINT[mood]} />)}

      {/* --- 時間帯レイヤー（オーバーレイ） --- */}
      {/* 昼間は描画しない: 透明でもmix-blend-modeがあるとマップ全体の
          オフスクリーン合成が常時走り、タブレットGPUの白飛びの一因になる */}
      {timeOfDay !== 'day' && !isDark && (
        <div
          className="absolute inset-0 z-20 pointer-events-none transition-colors duration-[3000ms]"
          style={{
            backgroundColor: timeOfDay === 'evening' ? 'rgba(234, 88, 12, 0.2)' : 'rgba(15, 23, 42, 0.45)',
            mixBlendMode: timeOfDay === 'evening' ? 'overlay' : 'multiply'
          }}
        />
      )}
      {/* 復習がたまっているとき: 町ぜんたいを暗くする（マスごとに暗くしない。重ねる色 1 枚ですむ） */}
      {isDark && <div className="absolute inset-0 z-20 pointer-events-none" style={{ backgroundColor: 'rgba(11, 18, 32, 0.34)' }} />}
      {/* --------------------------------- */}

      {/* 建物の絵を読んでいるあいだ（島と空は先に見せる） */}
      {!artReady && (
        <div role="status" className="absolute left-1/2 top-3 z-40 -translate-x-1/2 rounded-full border-[2px] border-[var(--text)] bg-[var(--panel)] px-3 py-1 text-xs font-black text-[var(--text)] shadow-sm pointer-events-none whitespace-nowrap">
          たてものを よみこみ中…
        </div>
      )}

      {/* 天候アイコン。まちづくりでは右上に「保存」などのボタンが重なるので、その下へ下げる */}
      <AnimatePresence mode="wait">
        {!isDanger || isEditing ? (
          <motion.div
            key={`${currentWeather}-${timeOfDay === 'night' ? 'night' : 'day'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute right-4 z-40 pointer-events-none drop-shadow-md ${isEditing ? 'top-20' : 'top-4'}`}
          >
            {currentWeather === 'clear' && timeOfDay !== 'night' && <Sun size={50} className="text-amber-400" fill="currentColor" />}
            {currentWeather === 'clear' && timeOfDay === 'night' && <Moon size={46} className="text-yellow-200" fill="currentColor" />}
            {currentWeather === 'rain' && <CloudRain size={50} className="text-slate-400 animate-pulse" fill="currentColor" />}
            {currentWeather === 'snow' && <Snowflake size={50} className="text-sky-200 animate-[spin_4s_linear_infinite]" fill="currentColor" />}
            {currentWeather === 'sakura' && <span className="text-[40px] leading-none select-none drop-shadow-sm">🌸</span>}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* --- キャンバスパーティクル（天候）--- */}
      {!isDanger && <WeatherOverlay weather={currentWeather} />}
      {/* --------------------------------- */}

      {/* ズームボタン & 住民表示切り替え */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}>
        {isEditing && (
          <>
            <button onClick={handleZoomIn} aria-label="町を大きく見る" className="w-12 h-12 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomIn size={20} /></button>
            <button onClick={handleZoomOut} aria-label="町を小さく見る" className="w-12 h-12 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomOut size={20} /></button>
          </>
        )}
        {!isEditing && (
          <button
            onClick={toggleResidentMode}
            title={`住民表示: ${residentDisplayMode === 'all' ? '全員' : residentDisplayMode === 'limited' ? '10人' : '非表示'}`}
            aria-label={`住民の表示を切りかえる（いまは ${residentDisplayMode === 'all' ? '全員' : residentDisplayMode === 'limited' ? '10人' : '表示しない'}）`}
            className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex flex-col items-center justify-center shadow-md hover:scale-110 transition-transform relative group"
          >
            <Users size={18} className={residentDisplayMode === 'none' ? 'opacity-30' : 'opacity-100'} />
            <div className="absolute -bottom-1 -right-1 bg-[var(--primary)] text-[var(--panel)] text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[var(--text)]">
              {residentDisplayMode === 'all' ? '●' : residentDisplayMode === 'limited' ? '10' : '×'}
            </div>
            {/* Tooltip */}
            <div className="absolute right-full mr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[var(--text)] text-[var(--panel)] text-[10px] px-2 py-1 rounded-md">
              住民表示: {residentDisplayMode === 'all' ? '全員' : residentDisplayMode === 'limited' ? '10人' : '非表示'}
            </div>
          </button>
        )}
      </div>
      {/* アイソメトリックマップ。ずらす（外側）と拡大縮小（内側）を分けておき、ドラッグ中は
          外側だけを合成レイヤーにする（拡大縮小まで合成に回すと、絵が粗く描かれる） */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: `translate(${view.x}px, ${view.y}px)`,
        willChange: panning ? 'transform' : undefined,
      }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transform: `scale(${view.zoom})`,
        transformOrigin: '0 0',
        isolation: 'isolate',
      }}>
        <TerrainLayer model={groundModel} viewRange={viewRange} danger={isDark} grid={Boolean(isEditing)} />
        {cells}
        {/* 押している（指している）マスの目じるし */}
        {hoveredCell && isEditing && hint !== false && (
          <CellHighlight x={hint?.x ?? hoveredCell.x} y={hint?.y ?? hoveredCell.y} w={hint?.w || 1} h={hint?.h || 1} tone={hint?.tone} label={hint?.label} />
        )}
        {effect && <CellEffect key={effect.id} effect={effect} />}
      </div>
      </div>
      {/* 住民。町の上に重ねた 1 枚の canvas に描く（町の要素で描くと、1 歩ごとに町ぜんたいの計算が走る。
          VillagerCanvas.jsx の説明）。夜の色（z-20）は この上に かぶさる */}
      <VillagerCanvas villagers={visibleVillagers} mapData={safeMapData} exploredRadius={exploredRadius}
        view={view} width={containerSize.w} height={containerSize.h} />
      {/* 夜のあかり。暗い色をかぶせた上（z-20 より上）に、町と同じ位置・拡大率で重ねる */}
      {nightLights && nightLights.length > 0 && (
        <div className="pointer-events-none" style={{
          position: 'absolute', top: 0, left: '50%', zIndex: 21,
          transform: `translate(${view.x}px, ${view.y}px)`,
          willChange: panning ? 'transform' : undefined,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${view.zoom})`, transformOrigin: '0 0' }}>
            <svg aria-hidden="true" width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: 'visible' }}>
              <defs>
                {/* まん中が明るく、外へ うすくなる光（だ円の大きさに合わせて のびる） */}
                <radialGradient id={NIGHT_GLOW_ID}>
                  <stop offset="0" stopColor="#ffdd96" stopOpacity="0.62" />
                  <stop offset="0.55" stopColor="#ffcd69" stopOpacity="0.26" />
                  <stop offset="1" stopColor="#ffc350" stopOpacity="0" />
                </radialGradient>
              </defs>
              {nightLights}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

export { CULTIVATABLE_TERRAIN };
export default DraggableTownMap;
