// 実績定義 — マイ漢字タウン（大規模拡張: 6年間遊べるボリューム）
// type: streak | perfect | master | craft | building | population | session | grade | coins | exp | login_days | review_total
// name / desc は RubyText 用「漢字（ふりがな）」形式

export const ACHIEVEMENTS = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  カテゴリ: 学習（がくしゅう）📚
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── マスター系（13段階） ─────────────────
  { id: 'master_1',    type: 'master', target: 1,    name: 'はじめの一歩（いっぽ）',                                     desc: '漢字（かんじ）を1文字（もじ）マスターする',                                 reward: 200,   rewardExp: 100,   rewardItem: null,       category: 'study' },
  { id: 'master_5',    type: 'master', target: 5,    name: '五（いつ）つの星（ほし）',                                   desc: '漢字（かんじ）を5文字（もじ）マスターする',                                 reward: 500,   rewardExp: 250,   rewardItem: null,       category: 'study' },
  { id: 'master_10',   type: 'master', target: 10,   name: '十（じゅう）の力（ちから）',                                 desc: '漢字（かんじ）を10文字（もじ）マスターする',                                reward: 1000,  rewardExp: 500,   rewardItem: null,       category: 'study' },
  { id: 'master_25',   type: 'master', target: 25,   name: '学（まな）びの芽生（めば）え',                               desc: '漢字（かんじ）を25文字（もじ）マスターする',                                reward: 2000,  rewardExp: 1000,  rewardItem: null,       category: 'study' },
  { id: 'master_50',   type: 'master', target: 50,   name: '漢字（かんじ）の達人（たつじん）',                           desc: '漢字（かんじ）を50文字（もじ）マスターする',                                reward: 3000,  rewardExp: 1500,  rewardItem: 't_dragon', category: 'study' },
  { id: 'master_100',  type: 'master', target: 100,  name: '百（ひゃく）の知識（ちしき）',                               desc: '漢字（かんじ）を100文字（もじ）マスターする',                               reward: 5000,  rewardExp: 3000,  rewardItem: 't_temple', category: 'study' },
  { id: 'master_150',  type: 'master', target: 150,  name: '知識（ちしき）の泉（いずみ）',                               desc: '漢字（かんじ）を150文字（もじ）マスターする',                               reward: 6000,  rewardExp: 4000,  rewardItem: null,       category: 'study' },
  { id: 'master_200',  type: 'master', target: 200,  name: '二百字（にひゃくじ）の壁（かべ）を越（こ）えて',             desc: '漢字（かんじ）を200文字（もじ）マスターする',                               reward: 8000,  rewardExp: 5000,  rewardItem: null,       category: 'study' },
  { id: 'master_300',  type: 'master', target: 300,  name: '三百字（さんびゃくじ）の高（たか）み',                       desc: '漢字（かんじ）を300文字（もじ）マスターする',                               reward: 10000, rewardExp: 7000,  rewardItem: null,       category: 'study' },
  { id: 'master_400',  type: 'master', target: 400,  name: '四百字（よんひゃくじ）の境地（きょうち）',                   desc: '漢字（かんじ）を400文字（もじ）マスターする',                               reward: 12000, rewardExp: 8000,  rewardItem: null,       category: 'study' },
  { id: 'master_500',  type: 'master', target: 500,  name: '漢字博士（かんじはかせ）',                                   desc: '漢字（かんじ）を500文字（もじ）マスターする',                               reward: 15000, rewardExp: 10000, rewardItem: 't_castle', category: 'study' },
  { id: 'master_750',  type: 'master', target: 750,  name: '漢字仙人（かんじせんにん）',                                 desc: '漢字（かんじ）を750文字（もじ）マスターする',                               reward: 25000, rewardExp: 20000, rewardItem: null,       category: 'study' },
  { id: 'master_1026', type: 'master', target: 1026, name: '全漢字制覇（ぜんかんじせいは）',                             desc: '1026字（じ）すべてをマスターする',                                          reward: 50000, rewardExp: 50000, rewardItem: null,       category: 'study' },

  // ── Perfect系（8段階） ───────────────────
  { id: 'perfect_10',   type: 'perfect', target: 10,   name: '美文字（びもじ）のはじまり',                               desc: 'なぞり書（が）きでPerfectを10回（かい）出（だ）す',                          reward: 300,   rewardExp: 150,   rewardItem: null,       category: 'study' },
  { id: 'perfect_25',   type: 'perfect', target: 25,   name: '丁寧（ていねい）な筆使（ふでづか）い',                     desc: 'なぞり書（が）きでPerfectを25回（かい）出（だ）す',                          reward: 600,   rewardExp: 300,   rewardItem: null,       category: 'study' },
  { id: 'perfect_50',   type: 'perfect', target: 50,   name: '美文字（びもじ）の才能（さいのう）',                       desc: 'なぞり書（が）きでPerfectを50回（かい）出（だ）す',                          reward: 1000,  rewardExp: 500,   rewardItem: 't_sakura', category: 'study' },
  { id: 'perfect_100',  type: 'perfect', target: 100,  name: '書道（しょどう）の達人（たつじん）',                       desc: 'なぞり書（が）きでPerfectを100回（かい）出（だ）す',                         reward: 2000,  rewardExp: 1000,  rewardItem: null,       category: 'study' },
  { id: 'perfect_200',  type: 'perfect', target: 200,  name: '筆（ふで）の求道者（きゅうどうしゃ）',                     desc: 'なぞり書（が）きでPerfectを200回（かい）出（だ）す',                         reward: 3500,  rewardExp: 2000,  rewardItem: null,       category: 'study' },
  { id: 'perfect_300',  type: 'perfect', target: 300,  name: '筆（ふで）の神（かみ）',                                   desc: 'なぞり書（が）きでPerfectを300回（かい）出（だ）す',                         reward: 5000,  rewardExp: 3000,  rewardItem: null,       category: 'study' },
  { id: 'perfect_500',  type: 'perfect', target: 500,  name: '書聖（しょせい）',                                         desc: 'なぞり書（が）きでPerfectを500回（かい）出（だ）す',                         reward: 10000, rewardExp: 5000,  rewardItem: null,       category: 'study' },
  { id: 'perfect_1000', type: 'perfect', target: 1000, name: '千（せん）の美文字（びもじ）',                             desc: 'なぞり書（が）きでPerfectを1000回（かい）出（だ）す',                        reward: 20000, rewardExp: 10000, rewardItem: null,       category: 'study' },

  // ── 復習回数系（6段階） ──────────────────
  { id: 'review_100',   type: 'review_total', target: 100,   name: '復習（ふくしゅう）のはじまり',                       desc: '合計（ごうけい）100回（かい）漢字（かんじ）を復習（ふくしゅう）する',        reward: 300,   rewardExp: 200,   rewardItem: null, category: 'study' },
  { id: 'review_500',   type: 'review_total', target: 500,   name: 'くり返（かえ）しの力（ちから）',                     desc: '合計（ごうけい）500回（かい）漢字（かんじ）を復習（ふくしゅう）する',        reward: 1000,  rewardExp: 500,   rewardItem: null, category: 'study' },
  { id: 'review_1000',  type: 'review_total', target: 1000,  name: '千回（せんかい）の特訓（とっくん）',                 desc: '合計（ごうけい）1,000回（かい）漢字（かんじ）を復習（ふくしゅう）する',      reward: 3000,  rewardExp: 1500,  rewardItem: null, category: 'study' },
  { id: 'review_3000',  type: 'review_total', target: 3000,  name: '努力（どりょく）の結晶（けっしょう）',               desc: '合計（ごうけい）3,000回（かい）漢字（かんじ）を復習（ふくしゅう）する',      reward: 5000,  rewardExp: 3000,  rewardItem: null, category: 'study' },
  { id: 'review_5000',  type: 'review_total', target: 5000,  name: '五千回（ごせんかい）の道（みち）',                   desc: '合計（ごうけい）5,000回（かい）漢字（かんじ）を復習（ふくしゅう）する',      reward: 8000,  rewardExp: 5000,  rewardItem: null, category: 'study' },
  { id: 'review_10000', type: 'review_total', target: 10000, name: '一万回（いちまんかい）の鍛錬（たんれん）',           desc: '合計（ごうけい）10,000回（かい）漢字（かんじ）を復習（ふくしゅう）する',     reward: 15000, rewardExp: 10000, rewardItem: null, category: 'study' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  カテゴリ: 学年制覇（がくねんせいは）🎓
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── 各学年の半分達成 ─────────────────────
  { id: 'grade1_half', type: 'grade', target: 40,  gradeNum: 1, name: '一年生（いちねんせい）の中間（ちゅうかん）',   desc: '小学（しょうがく）1年（ねん）の漢字（かんじ）を40字（じ）マスター',          reward: 800,  rewardExp: 400,   rewardItem: null, category: 'grade' },
  { id: 'grade2_half', type: 'grade', target: 80,  gradeNum: 2, name: '二年生（にねんせい）の中間（ちゅうかん）',     desc: '小学（しょうがく）2年（ねん）の漢字（かんじ）を80字（じ）マスター',          reward: 1200, rewardExp: 800,   rewardItem: null, category: 'grade' },
  { id: 'grade3_half', type: 'grade', target: 100, gradeNum: 3, name: '三年生（さんねんせい）の中間（ちゅうかん）',   desc: '小学（しょうがく）3年（ねん）の漢字（かんじ）を100字（じ）マスター',         reward: 1500, rewardExp: 1200,  rewardItem: null, category: 'grade' },
  { id: 'grade4_half', type: 'grade', target: 99,  gradeNum: 4, name: '四年生（よねんせい）の中間（ちゅうかん）',     desc: '小学（しょうがく）4年（ねん）の漢字（かんじ）を99字（じ）マスター',          reward: 2000, rewardExp: 2000,  rewardItem: null, category: 'grade' },
  { id: 'grade5_half', type: 'grade', target: 99,  gradeNum: 5, name: '五年生（ごねんせい）の中間（ちゅうかん）',     desc: '小学（しょうがく）5年（ねん）の漢字（かんじ）を99字（じ）マスター',          reward: 2500, rewardExp: 3000,  rewardItem: null, category: 'grade' },
  { id: 'grade6_half', type: 'grade', target: 96,  gradeNum: 6, name: '六年生（ろくねんせい）の中間（ちゅうかん）',   desc: '小学（しょうがく）6年（ねん）の漢字（かんじ）を96字（じ）マスター',          reward: 3000, rewardExp: 4000,  rewardItem: null, category: 'grade' },

  // ── 各学年の完全制覇 ─────────────────────
  { id: 'grade1_all', type: 'grade', target: 80,  gradeNum: 1, name: '一年生（いちねんせい）マスター',               desc: '小学（しょうがく）1年（ねん）の漢字（かんじ）80字（じ）をすべてマスター',    reward: 2000,  rewardExp: 1000,  rewardItem: null, category: 'grade' },
  { id: 'grade2_all', type: 'grade', target: 160, gradeNum: 2, name: '二年生（にねんせい）マスター',                 desc: '小学（しょうがく）2年（ねん）の漢字（かんじ）160字（じ）をすべてマスター',   reward: 3000,  rewardExp: 2000,  rewardItem: null, category: 'grade' },
  { id: 'grade3_all', type: 'grade', target: 200, gradeNum: 3, name: '三年生（さんねんせい）マスター',               desc: '小学（しょうがく）3年（ねん）の漢字（かんじ）200字（じ）をすべてマスター',   reward: 4000,  rewardExp: 3000,  rewardItem: null, category: 'grade' },
  { id: 'grade4_all', type: 'grade', target: 197, gradeNum: 4, name: '四年生（よねんせい）マスター',                 desc: '小学（しょうがく）4年（ねん）の漢字（かんじ）197字（じ）をすべてマスター',   reward: 5000,  rewardExp: 5000,  rewardItem: null, category: 'grade' },
  { id: 'grade5_all', type: 'grade', target: 197, gradeNum: 5, name: '五年生（ごねんせい）マスター',                 desc: '小学（しょうがく）5年（ねん）の漢字（かんじ）197字（じ）をすべてマスター',   reward: 6000,  rewardExp: 8000,  rewardItem: null, category: 'grade' },
  { id: 'grade6_all', type: 'grade', target: 192, gradeNum: 6, name: '六年生（ろくねんせい）マスター',               desc: '小学（しょうがく）6年（ねん）の漢字（かんじ）192字（じ）をすべてマスター',   reward: 7000,  rewardExp: 10000, rewardItem: null, category: 'grade' },

  // ── 全学年制覇 ───────────────────────────
  { id: 'all_grades', type: 'master', target: 1026, name: '小学校（しょうがっこう）の漢字王（かんじおう）', desc: '小学校（しょうがっこう）6年間（ねんかん）の漢字（かんじ）をすべてマスター', reward: 100000, rewardExp: 100000, rewardItem: null, category: 'grade' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  カテゴリ: まちづくり 🏘️
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── クラフト系（7段階） ──────────────────
  { id: 'craft_1',   type: 'craft', target: 1,   name: 'はじめてのクラフト',                                             desc: 'アイテムを1回（かい）クラフトする',                                          reward: 200,   rewardExp: 100,  rewardItem: null, category: 'town' },
  { id: 'craft_5',   type: 'craft', target: 5,   name: 'クラフト見習（みなら）い',                                       desc: 'アイテムを5回（かい）クラフトする',                                          reward: 500,   rewardExp: 250,  rewardItem: null, category: 'town' },
  { id: 'craft_10',  type: 'craft', target: 10,  name: '見習（みなら）い職人（しょくにん）',                             desc: 'アイテムを10回（かい）クラフトする',                                         reward: 1000,  rewardExp: 500,  rewardItem: null, category: 'town' },
  { id: 'craft_25',  type: 'craft', target: 25,  name: '一人前（いちにんまえ）の職人（しょくにん）',                     desc: 'アイテムを25回（かい）クラフトする',                                         reward: 2000,  rewardExp: 1000, rewardItem: null, category: 'town' },
  { id: 'craft_50',  type: 'craft', target: 50,  name: '匠（たくみ）の技（わざ）',                                       desc: 'アイテムを50回（かい）クラフトする',                                         reward: 3000,  rewardExp: 1500, rewardItem: null, category: 'town' },
  { id: 'craft_100', type: 'craft', target: 100, name: '伝説（でんせつ）の職人（しょくにん）',                           desc: 'アイテムを100回（かい）クラフトする',                                        reward: 6000,  rewardExp: 3000, rewardItem: null, category: 'town' },
  { id: 'craft_200', type: 'craft', target: 200, name: '神（かみ）の手（て）を持（も）つ者（もの）',                     desc: 'アイテムを200回（かい）クラフトする',                                        reward: 12000, rewardExp: 6000, rewardItem: null, category: 'town' },

  // ── 建物系（7段階） ──────────────────────
  { id: 'building_1',   type: 'building', target: 1,   name: '最初（さいしょ）の建物（たてもの）',                       desc: '建物（たてもの）を1つ配置（はいち）する',                                    reward: 100,   rewardExp: 50,   rewardItem: null, category: 'town' },
  { id: 'building_5',   type: 'building', target: 5,   name: '町（まち）の第一歩（だいいっぽ）',                         desc: '建物（たてもの）を5つ配置（はいち）する',                                    reward: 500,   rewardExp: 250,  rewardItem: null, category: 'town' },
  { id: 'building_10',  type: 'building', target: 10,  name: '小（ちい）さな町並（まちな）み',                           desc: '建物（たてもの）を10個（こ）配置（はいち）する',                              reward: 1000,  rewardExp: 500,  rewardItem: null, category: 'town' },
  { id: 'building_25',  type: 'building', target: 25,  name: '発展（はってん）する町（まち）',                           desc: '建物（たてもの）を25個（こ）配置（はいち）する',                              reward: 2000,  rewardExp: 1000, rewardItem: null, category: 'town' },
  { id: 'building_50',  type: 'building', target: 50,  name: '大都市（だいとし）の建築家（けんちくか）',                 desc: '建物（たてもの）を50個（こ）配置（はいち）する',                              reward: 5000,  rewardExp: 2500, rewardItem: null, category: 'town' },
  { id: 'building_100', type: 'building', target: 100, name: '天下（てんか）の城下町（じょうかまち）',                   desc: '建物（たてもの）を100個（こ）配置（はいち）する',                             reward: 10000, rewardExp: 5000, rewardItem: null, category: 'town' },
  { id: 'building_200', type: 'building', target: 200, name: '夢（ゆめ）の大都市（だいとし）',                           desc: '建物（たてもの）を200個（こ）配置（はいち）する',                             reward: 20000, rewardExp: 10000, rewardItem: null, category: 'town' },

  // ── 人口系（7段階） ──────────────────────
  { id: 'pop_1',   type: 'population', target: 1,   name: '最初（さいしょ）の住民（じゅうみん）',                       desc: '人口（じんこう）を1人（にん）にする',                                        reward: 100,   rewardExp: 50,   rewardItem: null, category: 'town' },
  { id: 'pop_5',   type: 'population', target: 5,   name: 'はじめての村（むら）',                                       desc: '人口（じんこう）を5人（にん）にする',                                        reward: 500,   rewardExp: 250,  rewardItem: null, category: 'town' },
  { id: 'pop_10',  type: 'population', target: 10,  name: '活気（かっき）のある村（むら）',                             desc: '人口（じんこう）を10人（にん）にする',                                       reward: 1000,  rewardExp: 500,  rewardItem: null, category: 'town' },
  { id: 'pop_25',  type: 'population', target: 25,  name: 'にぎわう町（まち）',                                         desc: '人口（じんこう）を25人（にん）にする',                                       reward: 2000,  rewardExp: 1000, rewardItem: null, category: 'town' },
  { id: 'pop_50',  type: 'population', target: 50,  name: '繁栄（はんえい）の都（みやこ）',                             desc: '人口（じんこう）を50人（にん）にする',                                       reward: 5000,  rewardExp: 2500, rewardItem: null, category: 'town' },
  { id: 'pop_100', type: 'population', target: 100, name: '百人（ひゃくにん）の楽園（らくえん）',                       desc: '人口（じんこう）を100人（にん）にする',                                      reward: 10000, rewardExp: 5000, rewardItem: null, category: 'town' },
  { id: 'pop_200', type: 'population', target: 200, name: '千客万来（せんきゃくばんらい）の町（まち）',                 desc: '人口（じんこう）を200人（にん）にする',                                      reward: 20000, rewardExp: 10000, rewardItem: null, category: 'town' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  カテゴリ: 毎日のがんばり 🔥
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── ストリーク系（8段階） ────────────────
  { id: 'login_3',   type: 'streak', target: 3,   name: '三日坊主（さんにちぼうず）からの卒業（そつぎょう）',           desc: '3日（にち）連続（れんぞく）で修行（しゅぎょう）する',                        reward: 500,   rewardExp: 200,   rewardItem: null,      category: 'daily' },
  { id: 'login_7',   type: 'streak', target: 7,   name: '修行（しゅぎょう）の鬼（おに）',                               desc: '7日（にち）連続（れんぞく）で修行（しゅぎょう）する',                        reward: 1500,  rewardExp: 500,   rewardItem: null,      category: 'daily' },
  { id: 'login_14',  type: 'streak', target: 14,  name: '鉄（てつ）の意志（いし）',                                     desc: '14日（にち）連続（れんぞく）で修行（しゅぎょう）する',                       reward: 3000,  rewardExp: 1000,  rewardItem: 't_pine',  category: 'daily' },
  { id: 'login_30',  type: 'streak', target: 30,  name: '漢字（かんじ）の修行僧（しゅぎょうそう）',                     desc: '30日（にち）連続（れんぞく）で修行（しゅぎょう）する',                       reward: 5000,  rewardExp: 2000,  rewardItem: 't_torii', category: 'daily' },
  { id: 'login_60',  type: 'streak', target: 60,  name: '継続（けいぞく）は力（ちから）なり',                           desc: '60日（にち）連続（れんぞく）で修行（しゅぎょう）する',                       reward: 8000,  rewardExp: 4000,  rewardItem: null,      category: 'daily' },
  { id: 'login_100', type: 'streak', target: 100, name: '百日（ひゃくにち）の修行者（しゅぎょうしゃ）',                 desc: '100日（にち）連続（れんぞく）で修行（しゅぎょう）する',                      reward: 15000, rewardExp: 8000,  rewardItem: null,      category: 'daily' },
  { id: 'login_200', type: 'streak', target: 200, name: '不屈（ふくつ）の精神（せいしん）',                             desc: '200日（にち）連続（れんぞく）で修行（しゅぎょう）する',                      reward: 25000, rewardExp: 15000, rewardItem: null,      category: 'daily' },
  { id: 'login_365', type: 'streak', target: 365, name: '一年（いちねん）皆勤賞（かいきんしょう）',                     desc: '365日（にち）連続（れんぞく）で修行（しゅぎょう）する',                      reward: 50000, rewardExp: 30000, rewardItem: null,      category: 'daily' },

  // ── セッション系（7段階） ────────────────
  { id: 'session_total_10',   type: 'session', target: 10,   name: 'がんばり屋（や）さん',                               desc: '合計（ごうけい）10回（かい）セッションをする',                               reward: 500,   rewardExp: 250,   rewardItem: null, category: 'daily' },
  { id: 'session_total_25',   type: 'session', target: 25,   name: '習慣（しゅうかん）づくり',                           desc: '合計（ごうけい）25回（かい）セッションをする',                               reward: 1000,  rewardExp: 500,   rewardItem: null, category: 'daily' },
  { id: 'session_total_50',   type: 'session', target: 50,   name: '努力（どりょく）の人（ひと）',                       desc: '合計（ごうけい）50回（かい）セッションをする',                               reward: 2000,  rewardExp: 1000,  rewardItem: null, category: 'daily' },
  { id: 'session_total_100',  type: 'session', target: 100,  name: '修行（しゅぎょう）の鉄人（てつじん）',               desc: '合計（ごうけい）100回（かい）セッションをする',                              reward: 5000,  rewardExp: 3000,  rewardItem: null, category: 'daily' },
  { id: 'session_total_200',  type: 'session', target: 200,  name: '学（まな）びの求道者（きゅうどうしゃ）',             desc: '合計（ごうけい）200回（かい）セッションをする',                              reward: 8000,  rewardExp: 5000,  rewardItem: null, category: 'daily' },
  { id: 'session_total_500',  type: 'session', target: 500,  name: '千里（せんり）の道（みち）の歩（あゆ）み',           desc: '合計（ごうけい）500回（かい）セッションをする',                              reward: 15000, rewardExp: 8000,  rewardItem: null, category: 'daily' },
  { id: 'session_total_1000', type: 'session', target: 1000, name: '千回（せんかい）の修行者（しゅぎょうしゃ）',         desc: '合計（ごうけい）1,000回（かい）セッションをする',                            reward: 30000, rewardExp: 15000, rewardItem: null, category: 'daily' },

  // ── 通算ログイン日数系（6段階） ──────────
  { id: 'login_days_7',    type: 'login_days', target: 7,    name: '一週間（いっしゅうかん）の学（まな）び',             desc: '合計（ごうけい）7日間（にちかん）ログインする',                              reward: 300,   rewardExp: 150,   rewardItem: null, category: 'daily' },
  { id: 'login_days_30',   type: 'login_days', target: 30,   name: 'ひと月（つき）の歩（あゆ）み',                       desc: '合計（ごうけい）30日間（にちかん）ログインする',                             reward: 1500,  rewardExp: 800,   rewardItem: null, category: 'daily' },
  { id: 'login_days_100',  type: 'login_days', target: 100,  name: '百日（ひゃくにち）の記録（きろく）',                 desc: '合計（ごうけい）100日間（にちかん）ログインする',                            reward: 5000,  rewardExp: 3000,  rewardItem: null, category: 'daily' },
  { id: 'login_days_365',  type: 'login_days', target: 365,  name: '一年間（いちねんかん）の足跡（あしあと）',           desc: '合計（ごうけい）365日間（にちかん）ログインする',                            reward: 15000, rewardExp: 10000, rewardItem: null, category: 'daily' },
  { id: 'login_days_730',  type: 'login_days', target: 730,  name: '二年間（にねんかん）の軌跡（きせき）',               desc: '合計（ごうけい）730日間（にちかん）ログインする',                            reward: 30000, rewardExp: 20000, rewardItem: null, category: 'daily' },
  { id: 'login_days_1095', type: 'login_days', target: 1095, name: '三年間（さんねんかん）の大冒険（だいぼうけん）',     desc: '合計（ごうけい）1,095日間（にちかん）ログインする',                          reward: 50000, rewardExp: 30000, rewardItem: null, category: 'daily' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  カテゴリ: 成長の記録（せいちょうのきろく）⭐
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── コイン系（5段階） ────────────────────
  { id: 'coins_1000',   type: 'coins', target: 1000,   name: 'お小遣（こづか）い貯金（ちょきん）',                       desc: 'コインを1,000枚（まい）ためる',                                              reward: 0,     rewardExp: 300,   rewardItem: null, category: 'growth' },
  { id: 'coins_5000',   type: 'coins', target: 5000,   name: 'しっかり貯金（ちょきん）',                                 desc: 'コインを5,000枚（まい）ためる',                                              reward: 0,     rewardExp: 800,   rewardItem: null, category: 'growth' },
  { id: 'coins_10000',  type: 'coins', target: 10000,  name: '町（まち）の資産家（しさんか）',                           desc: 'コインを10,000枚（まい）ためる',                                             reward: 0,     rewardExp: 1500,  rewardItem: null, category: 'growth' },
  { id: 'coins_50000',  type: 'coins', target: 50000,  name: '黄金（おうごん）の蔵（くら）',                             desc: 'コインを50,000枚（まい）ためる',                                             reward: 0,     rewardExp: 5000,  rewardItem: null, category: 'growth' },
  { id: 'coins_100000', type: 'coins', target: 100000, name: '大金持（おおがねも）ち',                                   desc: 'コインを100,000枚（まい）ためる',                                            reward: 0,     rewardExp: 10000, rewardItem: null, category: 'growth' },

  // ── EXP系（5段階） ──────────────────────
  { id: 'exp_1000',   type: 'exp', target: 1000,   name: '成長（せいちょう）の芽生（めば）え',                           desc: 'EXPを合計（ごうけい）1,000ためる',                                            reward: 500,   rewardExp: 0, rewardItem: null, category: 'growth' },
  { id: 'exp_5000',   type: 'exp', target: 5000,   name: '着実（ちゃくじつ）な成長（せいちょう）',                       desc: 'EXPを合計（ごうけい）5,000ためる',                                            reward: 1500,  rewardExp: 0, rewardItem: null, category: 'growth' },
  { id: 'exp_10000',  type: 'exp', target: 10000,  name: '経験（けいけん）豊（ゆた）かな学者（がくしゃ）',               desc: 'EXPを合計（ごうけい）10,000ためる',                                           reward: 3000,  rewardExp: 0, rewardItem: null, category: 'growth' },
  { id: 'exp_50000',  type: 'exp', target: 50000,  name: '知識（ちしき）の大樹（たいじゅ）',                             desc: 'EXPを合計（ごうけい）50,000ためる',                                           reward: 8000,  rewardExp: 0, rewardItem: null, category: 'growth' },
  { id: 'exp_100000', type: 'exp', target: 100000, name: '経験値（けいけんち）の王（おう）',                             desc: 'EXPを合計（ごうけい）100,000ためる',                                          reward: 15000, rewardExp: 0, rewardItem: null, category: 'growth' },
];

// カテゴリ定義
export const ACHIEVEMENT_CATEGORIES = {
  study:  { name: '学習（がくしゅう）',                      emoji: '📚', order: 0 },
  grade:  { name: '学年制覇（がくねんせいは）',              emoji: '🎓', order: 1 },
  town:   { name: 'まちづくり',                               emoji: '🏘️', order: 2 },
  daily:  { name: '毎日（まいにち）のがんばり',              emoji: '🔥', order: 3 },
  growth: { name: '成長（せいちょう）の記録（きろく）',      emoji: '⭐', order: 4 },
};
