import { useEffect, useState } from 'react';
import { fetchKanjiVgPaths } from '../../systems/kanjiVg';

/** KanjiVG の座標系（なぞり書き・書き順アニメと同じ） */
const VIEWBOX = 109;

/**
 * 学習中の漢字を表示するコンポーネント
 *
 * 音読・テスト・フラッシュカードなどの表示を、なぞり書きや書き順で使う
 * KanjiVG の字形に統一する。Webフォント（Klee One）と KanjiVG では
 * 字形が違うため、同じ漢字なのにモードごとに形が変わって見えてしまう。
 *
 * paths を渡した場合は自分で取得しない（すでに読み込み済みのデータを使う）。
 * 渡さない場合は char から取得する（メモリ/IndexedDB キャッシュが効く）。
 * 取得できないとき（オフラインなど）だけ Webフォントにフォールバックする。
 *
 * @param {object} props
 * @param {string} props.char - 漢字1文字
 * @param {string[]} [props.paths] - 読み込み済みの画パス（渡すと自前取得しない）
 * @param {boolean} [props.loading] - paths を渡すとき、その読み込み中かどうか
 * @param {string} [props.color] - 字の色
 * @param {number} [props.strokeWidth] - 線の太さ（viewBox 109 基準）
 */
const KanjiGlyph = ({
  char,
  paths: providedPaths,
  loading: providedLoading = false,
  color = 'var(--text)',
  strokeWidth = 6,
  className = 'w-full h-full',
  style,
}) => {
  const isProvided = Array.isArray(providedPaths);
  const [fetchedPaths, setFetchedPaths] = useState(null);
  const [selfLoading, setSelfLoading] = useState(!isProvided);

  useEffect(() => {
    if (isProvided) return undefined;
    let alive = true;
    const abortCtrl = new AbortController();
    setSelfLoading(true);
    fetchKanjiVgPaths(char, { signal: abortCtrl.signal })
      .then(p => { if (alive) { setFetchedPaths(p); setSelfLoading(false); } })
      // 取れなければフォント表示にフォールバックする
      .catch(() => { if (alive) { setFetchedPaths([]); setSelfLoading(false); } });
    return () => { alive = false; abortCtrl.abort(); };
  }, [char, isProvided]);

  const paths = isProvided ? providedPaths : (fetchedPaths ?? []);
  const loading = isProvided ? providedLoading : selfLoading;
  const hasPaths = paths.length > 0;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={className}
      style={style}
      role="img"
      aria-label={char}
    >
      {hasPaths ? (
        paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        ))
      ) : (
        // 読み込み中は字形が入れ替わって見えないよう、薄いガイドとして出す
        <text
          x={VIEWBOX / 2}
          y={VIEWBOX / 2 + 3}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={VIEWBOX * 0.82}
          fontWeight="900"
          fill={color}
          fontFamily="'Klee One', serif"
          opacity={loading ? 0.15 : 1}
        >
          {char}
        </text>
      )}
    </svg>
  );
};

export default KanjiGlyph;
