// 絵の中の「半透明」の書き方を、ブラウザが軽く描ける形に そろえる — マイ漢字タウン
//
// SVG の図形に opacity を書くと、ブラウザ（Chromium）は その図形 1 つを「別の合成の単位」として
// 扱う（いちど別の場所に描いてから、うすめて重ねる決まりのため）。建物 1 つに 半透明の図形が
// 20〜90 個あり、町には建物が何十も並ぶので、町を ずらすたびの「合成の準備」が その数だけ重くなる。
//   建物 600 の町を ずらす 1 コマの「合成の準備」（CPU を 4 倍おそくして）: 183ms → 145ms
//
// ぬりだけの図形の opacity は fill-opacity と、線だけの図形の opacity は stroke-opacity と、
// 見た目が まったく同じになる。こちらは「うすい色で ぬる」だけなので、合成の単位は増えない。
// ぬりと線の両方を持つ図形は、重なる所の色が変わってしまうので opacity のまま残す。
//
// 絵を描くときは、これまでどおり opacity と書いてよい。絵を渡す所（buildingArt・
// natureArtMarkup・houseArtMarkup）が、ここを通して書きかえる。

const SHAPE_WITH_OPACITY = /<(path|circle|ellipse)\b([^>]*?)\sopacity="([^"]*)"([^>]*)>/g;

/**
 * 図形ごとの opacity を、fill-opacity か stroke-opacity に書きかえる。
 * @param {string} markup SVG の文字列（path・circle・ellipse の属性は "…" で囲んであること）
 * @returns {string}
 */
export function flattenOpacity(markup) {
  return markup.replace(SHAPE_WITH_OPACITY, (all, tag, before, value, after) => {
    const attrs = before + after;
    const fill = /\sfill="([^"]*)"/.exec(attrs);
    const filled = !fill || fill[1] !== 'none'; // fill を書かない図形は、黒で ぬられる
    const stroked = /\sstroke="(?!none")/.test(attrs);
    if (filled === stroked) return all;
    return `<${tag}${before} ${filled ? 'fill' : 'stroke'}-opacity="${value}"${after}>`;
  });
}
