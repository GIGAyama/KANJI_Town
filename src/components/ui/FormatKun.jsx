import { createContext, useContext } from 'react';
import { DEFAULT_FURIGANA_MODE, shouldShowRuby } from '../../utils/furigana';

/**
 * ふりがなの出し方（設定の「ふりがな」）。App が stats.settings と学年から与える。
 * { mode: 'all'|'aboveGrade'|'none', grade: 1〜6, gradeLookup: Map<字, 学年>|null }
 */
const FuriganaContext = createContext({ mode: DEFAULT_FURIGANA_MODE, grade: 1, gradeLookup: null });

/**
 * 設定に合わせてふりがなを付ける。出さないときは字だけを返す。
 * keepBaseline は、例文のように 1 字ずつ空の <rt> で高さをそろえている文の中で使う。
 */
const Ruby = ({ base, reading, always = false, keepBaseline = false, className }) => {
  const furigana = useContext(FuriganaContext);
  if (always || shouldShowRuby(base, furigana)) {
    return <ruby className={className}>{base}<rt>{reading}</rt></ruby>;
  }
  return keepBaseline ? <ruby className={className}>{base}<rt></rt></ruby> : <>{base}</>;
};

/** <ruby>漢字<rt>ふりがな</rt></ruby> を返すショートハンド（設定に従う） */
const R = ({ c, r }) => <Ruby base={c} reading={r} />;

/** インラインふりがな関数: F("漢字","かんじ") → <ruby>漢字<rt>かんじ</rt></ruby>（設定に従う） */
const F = (base, reading) => <Ruby base={base} reading={reading} />;

const FormatKun = ({ text }) => {
  if (!text) return null; const match = text.match(/^(.*?)\((.*?)\)$/);
  if (match) return <>{match[1]}<span className="text-rose-500">{match[2]}</span></>;
  return <>{text}</>;
};

/**
 * 「漢字（ふりがな）」形式のテキストを <ruby> タグに変換して表示。
 * always: 設定にかかわらずふりがなを出す（音読の例文のように、読みそのものを学ぶ所）
 */
const RubyText = ({ text, always = false }) => {
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
    parts.push(<Ruby key={key++} base={m[1]} reading={m[2]} always={always} keepBaseline />);
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

/**
 * 例文を ruby 表示し、対象漢字を ◯ に置換する（ベースライン統一）。
 * ◯ の上のふりがなは問題そのもの（何を書くかの手がかり）なので、設定にかかわらず出す。
 * ほかのことばのふりがなは設定に従う。
 */
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
    const isTarget = base.includes(targetChar);
    const replaced = isTarget ? base.replaceAll(targetChar, '◯') : base;
    parts.push(
      isTarget
        ? <ruby key={key++} className="survival-blank">{replaced}<rt>{reading}</rt></ruby>
        : <Ruby key={key++} base={replaced} reading={reading} keepBaseline />
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

export { R, F, Ruby, FuriganaContext, FormatKun, RubyText, SurvivalRubyText };
