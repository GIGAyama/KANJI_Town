export const Analyzer = {
  analyzeEnding: (points) => {
    if (!points || points.length < 3) return { type: 'とめ', code: 'tome' };
    const len = points.length; const pEnd = points[len - 1]; const pMid = points[Math.max(0, Math.floor(len * 0.85))]; const pBeforeMid = points[Math.max(0, Math.floor(len * 0.70))];
    const mainVec = { x: pMid.x - pBeforeMid.x, y: pMid.y - pBeforeMid.y }; const endVec = { x: pEnd.x - pMid.x, y: pEnd.y - pMid.y };
    let angleDiff = 0; const dotProduct = (mainVec.x * endVec.x + mainVec.y * endVec.y); const magMain = Math.sqrt(mainVec.x**2 + mainVec.y**2); const magEnd = Math.sqrt(endVec.x**2 + endVec.y**2);
    if (magMain > 0 && magEnd > 0.045) { const cosTheta = Math.max(-1, Math.min(1, dotProduct / (magMain * magEnd))); angleDiff = Math.acos(cosTheta) * (180 / Math.PI); }
    const calcEnd = Math.max(1, len - 1); const calcStart = Math.max(0, len - 8); let totalDist = 0; let totalTime = points[calcEnd].time - points[calcStart].time;
    for (let i = calcStart + 1; i <= calcEnd; i++) { const dx = points[i].x - points[i-1].x; const dy = points[i].y - points[i-1].y; totalDist += Math.sqrt(dx*dx + dy*dy); }
    const velocity = totalTime > 0 ? totalDist / totalTime : 0;
    if (angleDiff > 35 && magEnd > 0.045) return { type: 'はね', code: 'hane' };
    if (velocity > 0.0025) return { type: 'はらい', code: 'harai' }; return { type: 'とめ', code: 'tome' };
  },
  isIntersecting: (p1, p2, p3, p4) => {
    const ta = (p3.x - p4.x) * (p1.y - p3.y) + (p3.y - p4.y) * (p3.x - p1.x); const tb = (p3.x - p4.x) * (p2.y - p3.y) + (p3.y - p4.y) * (p3.x - p2.x);
    const tc = (p1.x - p2.x) * (p3.y - p1.y) + (p1.y - p2.y) * (p1.x - p3.x); const td = (p1.x - p2.x) * (p4.y - p1.y) + (p1.y - p2.y) * (p1.x - p4.x); return tc * td < 0 && ta * tb < 0;
  },
  checkCross: (stroke1, stroke2) => {
    if (!stroke1 || !stroke2 || stroke1.length < 2 || stroke2.length < 2) return false;
    for (let i = 0; i < stroke1.length - 1; i++) for (let j = 0; j < stroke2.length - 1; j++) if (Analyzer.isIntersecting(stroke1[i], stroke1[i+1], stroke2[j], stroke2[j+1])) return true;
    return false;
  }
};
