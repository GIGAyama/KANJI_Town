/** <ruby>漢字<rt>ふりがな</rt></ruby> を返すショートハンド */
const R = ({ c, r }) => <ruby>{c}<rt>{r}</rt></ruby>;

/** インラインふりがな関数: F("漢字","かんじ") → <ruby>漢字<rt>かんじ</rt></ruby> */
const F = (base, reading) => <ruby>{base}<rt>{reading}</rt></ruby>;

const FormatKun = ({ text }) => {
  if (!text) return null; const match = text.match(/^(.*?)\((.*?)\)$/);
  if (match) return <>{match[1]}<span className="text-rose-500">{match[2]}</span></>;
  return <>{text}</>;
};

/** 「漢字（ふりがな）」形式のテキストを <ruby> タグに変換して表示 */
const RubyText = ({ text }) => {
  if (!text) return null;
  const parts = [];
  const re = /([^\s（）]+?)（([^）]+)）/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<ruby key={m.index}>{m[1]}<rt>{m[2]}</rt></ruby>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};

export { R, F, FormatKun, RubyText };
