/**
 * ボスバトル・サバイバルの出題の並びを作る。
 *
 * 学習済みの字が少ないと、同じ字を何度も出すことになる。そのとき同じ字が
 * 2問続くと、子どもには「同じ問題がもう一度出た」ように見えるうえ、
 * 書き順データも変わらないため画面の作り直しが起きにくい（前の問題の線が
 * 残る不具合の引き金になっていた）。並べられる限り、となり合わせにしない。
 */

/** Fisher–Yates で並べかえた新しい配列を返す（元の配列は変えない） */
export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const pickAvoiding = (items, avoid, random) => {
  const candidates = items.filter(item => !avoid.includes(item));
  const pool = candidates.length > 0 ? candidates : items;
  return pool[Math.floor(random() * pool.length)];
};

/**
 * items を先頭にそのまま並べ、足りない分を items から選んで length 問にする。
 * 直前の問題と同じ字は、ほかに選べる字がある限り選ばない。
 * 最後の問題は、周回したときに先頭とも並ぶので先頭の字も避ける。
 */
export function fillQueue(items, length, random = Math.random) {
  const queue = [...items];
  if (queue.length === 0) return queue;
  while (queue.length < length) {
    const avoid = [queue[queue.length - 1]];
    if (queue.length === length - 1) avoid.push(queue[0]);
    queue.push(pickAvoiding(items, avoid, random));
  }
  return queue;
}

/**
 * 出しおわった並びのうしろに、items を並べかえた1周ぶんを足す。
 * つなぎ目で同じ字が続かないようにする。
 */
export function appendRound(queue, items, random = Math.random) {
  const round = shuffled(items, random);
  const last = queue[queue.length - 1];
  if (round.length > 1 && round[0] === last) {
    const swapAt = round.findIndex(item => item !== last);
    if (swapAt > 0) [round[0], round[swapAt]] = [round[swapAt], round[0]];
  }
  return [...queue, ...round];
}

/** 隣り合う同じ要素の数（周回する出題なら末尾と先頭も数える）。テストと検証用 */
export function countAdjacentRepeats(queue, { wrap = false } = {}) {
  let count = 0;
  for (let i = 1; i < queue.length; i++) if (queue[i] === queue[i - 1]) count++;
  if (wrap && queue.length > 1 && queue[0] === queue[queue.length - 1]) count++;
  return count;
}
