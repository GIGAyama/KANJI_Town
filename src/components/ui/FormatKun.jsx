const R = ({ c, r }) => <ruby>{c}<rt>{r}</rt></ruby>;
const FormatKun = ({ text }) => {
  if (!text) return null; const match = text.match(/^(.*?)\((.*?)\)$/);
  if (match) return <>{match[1]}<span className="text-rose-500">{match[2]}</span></>;
  return <>{text}</>;
};

export { R, FormatKun };
