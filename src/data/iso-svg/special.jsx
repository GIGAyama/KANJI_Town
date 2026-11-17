import React from 'react';

// おばけ（ボスバトルに出る）の絵。町のものの絵は buildings-art.js・props-art.js、住民の絵は data/villager-art.js にある。

export const SvgGhostBoss = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><g transform="translate(50, 100) scale(2.5)" filter="url(#glow-effect)"><path d="M-30,20 Q0,-40 30,20 Q15,10 0,20 Q-15,10 -30,20 Z" fill="#9333ea" fillOpacity="0.8"/><circle cx="-10" cy="0" r="5" fill="#f8fafc"/><circle cx="10" cy="0" r="5" fill="#f8fafc"/></g></svg>);
