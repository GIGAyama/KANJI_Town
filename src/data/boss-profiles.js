// ボスの名前と せりふ — マイ漢字タウン
// React に依存しない（components/training/boss/ が使い、test/ から確かめる）。
//
// ⚠️ ここの文は、ひらがな・カタカナだけで書く（1 年生が 1 人で読める。ふりがなを付けなくてよい）。
//    漢字を入れると test/boss-battle.test.js が落ちる。
// せりふは わるものらしく、でも 子どもを ばかにしない（まちがいを わらわない。負けたときは また おいでと言う）。

export const BOSS_PROFILES = Object.freeze({
  ghost: Object.freeze({
    name: 'けしけしおばけ',
    place: 'よるの がっこう',
    intro: 'おぼえた じを、けしゴムで けしちゃうぞ〜',
    attack: 'けしゴム アタック',
    guard: 'ひらり！ あたらないよ〜',
    rage: 'むむむ… おこったぞ〜！',
    lose: 'まいった〜。じは かえすよ…',
    cheer: 'おしかったね。また おいで〜',
    color: '#a78bfa',
  }),
  octopus: Object.freeze({
    name: 'スミダコだいおう',
    place: 'すみの うみ',
    intro: 'わがはいの すみで、じを まっくろに してやろう',
    attack: 'すみ でっぽう',
    guard: 'ぬるり！ すべったのう',
    rage: 'ゆるさんぞ〜！',
    lose: 'みごとじゃ… まいった',
    cheer: 'なかなか やるのう。また くるがよい',
    color: '#fb7185',
  }),
  oni: Object.freeze({
    name: 'バツバツおに',
    place: 'おにの やま',
    intro: 'どんな じにも バツを つけてやる！',
    attack: 'バツバツ こんぼう',
    guard: 'ガキン！ はねかえしたぞ',
    rage: 'ほんきを だすぞ！',
    lose: 'ま、まるだ… おまえの かちだ',
    cheer: 'いい しょうぶだった。また こい！',
    color: '#fb923c',
  }),
  dragon: Object.freeze({
    name: 'まっくろりゅうおう',
    place: 'あらしの しろ',
    intro: 'わしの ほのおで、じを すべて わすれさせてやろう',
    attack: 'まっくろ ブレス',
    guard: 'その ていどでは とどかぬ',
    rage: 'わしを おこらせたな…！',
    lose: 'みごと… おぬしこそ かんじの おうじゃ',
    cheer: 'よく たたかった。うでを みがいて また こい',
    color: '#818cf8',
  }),
});

export const bossProfile = (id) => (Object.hasOwn(BOSS_PROFILES, id) ? BOSS_PROFILES[id] : BOSS_PROFILES.ghost);
