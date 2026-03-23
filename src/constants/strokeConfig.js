// ストローク判定の共有閾値
// WriteMode（書き中）と strokeGrader（採点時）で同一の定数を使用する
export const STROKE_THRESHOLDS = {
  START_POINT: 0.20,   // 始点の許容距離（正規化座標）
  END_POINT: 0.25,     // 終点の許容距離（正規化座標）
  CROSS_DISTANCE: 0.3, // 書き順マッチングの許容距離
  /** 交差と見なす最小セグメント交差数（これ未満はドット単位の接触として無視） */
  CROSS_COUNT_MIN: 3,
};
