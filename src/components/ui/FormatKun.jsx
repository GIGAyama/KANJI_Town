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
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      for (const ch of plain) {
        parts.push(<ruby key={key++}>{ch}<rt></rt></ruby>);
      }
    }
    parts.push(<ruby key={key++}>{m[1]}<rt>{m[2]}</rt></ruby>);
    last = re.lastIndex;
  }
  if (last < text.length) {
    const plain = text.slice(last);
    for (const ch of plain) {
      parts.push(<ruby key={key++}>{ch}<rt></rt></ruby>);
    }
  }
  return <>{parts}</>;
};

/** 例文を ruby 表示し、対象漢字を ◯ に置換する（ベースライン統一） */
const SurvivalRubyText = ({ text, targetChar }) => {
  if (!text) return null;
  const parts = [];
  const re = /([^\s（）]+?)（([^）]+)）/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    // ルビ外のテキスト（空 rt で高さを揃える）
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      for (const ch of plain) {
        if (ch === targetChar) {
          parts.push(<ruby key={key++} className="survival-blank">{'◯'}<rt></rt></ruby>);
        } else {
          parts.push(<ruby key={key++}>{ch}<rt></rt></ruby>);
        }
      }
    }
    // ルビ付きセグメント：対象漢字を ◯ に
    const base = m[1];
    const reading = m[2];
    const replaced = base.includes(targetChar)
      ? base.replaceAll(targetChar, '◯')
      : base;
    parts.push(
      <ruby key={key++} className={base.includes(targetChar) ? 'survival-blank' : ''}>
        {replaced}<rt>{reading}</rt>
      </ruby>
    );
    last = re.lastIndex;
  }
  // 末尾の残りテキスト
  if (last < text.length) {
    const plain = text.slice(last);
    for (const ch of plain) {
      if (ch === targetChar) {
        parts.push(<ruby key={key++} className="survival-blank">{'◯'}<rt></rt></ruby>);
      } else {
        parts.push(<ruby key={key++}>{ch}<rt></rt></ruby>);
      }
    }
  }
  return <>{parts}</>;
};

export { R, F, FormatKun, RubyText, SurvivalRubyText };
