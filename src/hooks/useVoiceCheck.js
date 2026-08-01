import { useCallback, useEffect, useRef, useState } from 'react';
import { READING } from '../constants/gameConfig.js';
import {
  createVoiceCheck,
  advanceVoiceCheck,
  shouldShowGentlePrompt,
} from '../utils/voice-activity.js';
import { markStudyActivity } from '../systems/studySession.js';

const isMicSupported = () =>
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof window !== 'undefined' &&
  Boolean(window.AudioContext || window.webkitAudioContext);

/**
 * 音読チャレンジのマイク処理。
 *
 * マイクの音声はその場でRMS(音量)に変換して発声判定に使うだけで、
 * 録音・保存・送信は一切しない。start() はユーザー操作(ボタン押下)から
 * 呼ぶこと(突然の許可ダイアログを避け、AudioContext の自動再生制限も満たす)。
 *
 * SE合成用の audioCtrl とは独立した AudioContext を使う。audioCtrl.ctx は
 * init() まで存在せず dispose() で閉じられるため、共有するとチェック中に
 * 解析ノードが死ぬ恐れがある。こちらは start/teardown で厳密に開閉する。
 */
export function useVoiceCheck({ enabled = true, resetKey } = {}) {
  const [status, setStatus] = useState(() => (isMicSupported() ? 'idle' : 'unsupported'));
  const [progress, setProgress] = useState(0);
  const [level, setLevel] = useState(0);
  const [showGentlePrompt, setShowGentlePrompt] = useState(false);
  const pipelineRef = useRef(null);
  const stateRef = useRef(null);
  const tokenRef = useRef(0);

  /** マイク・AudioContext・タイマーを完全に解放する(タブレットの録音中表示を確実に消す) */
  const teardown = useCallback(() => {
    tokenRef.current += 1;
    const pipeline = pipelineRef.current;
    pipelineRef.current = null;
    stateRef.current = null;
    if (!pipeline) return;
    clearInterval(pipeline.timer);
    try { pipeline.source.disconnect(); } catch { /* no-op */ }
    try { pipeline.stream.getTracks().forEach((track) => track.stop()); } catch { /* no-op */ }
    pipeline.ctx.close().catch(() => {});
  }, []);

  /** チャレンジを中断して最初の状態に戻す */
  const stop = useCallback(() => {
    teardown();
    setStatus(isMicSupported() ? 'idle' : 'unsupported');
    setProgress(0);
    setLevel(0);
    setShowGentlePrompt(false);
  }, [teardown]);

  const start = useCallback(async () => {
    if (!enabled || pipelineRef.current) return;
    if (!isMicSupported()) {
      setStatus('unsupported');
      return;
    }
    const token = tokenRef.current;
    setStatus('requesting');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (tokenRef.current !== token) return;
      // NotAllowedError はユーザー拒否と管理ポリシーによるブロックの両方を含む
      setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
      return;
    }
    if (tokenRef.current !== token) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);

      stateRef.current = createVoiceCheck(performance.now());
      setStatus('calibrating');
      setProgress(0);
      setLevel(0);
      setShowGentlePrompt(false);

      const timer = setInterval(() => {
        const current = stateRef.current;
        if (!current) return;
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);
        const time = performance.now();
        const next = advanceVoiceCheck(current, rms, time);
        stateRef.current = next;
        setLevel(next.level);
        setProgress(next.progress);
        setShowGentlePrompt(shouldShowGentlePrompt(next, time));
        if (next.phase === 'listening' && current.phase === 'calibrating') setStatus('listening');
        // 発声中は「操作なし」と見なされないよう学習セッションへ活動を通知する
        if (next.lastVoicedAt === time) markStudyActivity();
        if (next.done) {
          teardown();
          setStatus('passed');
          setProgress(1);
        }
      }, READING.SAMPLE_INTERVAL_MS);

      pipelineRef.current = { stream, ctx, source, analyser, timer };
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      if (tokenRef.current === token) setStatus('error');
    }
  }, [enabled, teardown]);

  // 漢字が変わったら次のチャレンジのために最初の状態へ戻す(アンマウント時も解放)
  useEffect(() => {
    setStatus(isMicSupported() ? 'idle' : 'unsupported');
    setProgress(0);
    setLevel(0);
    setShowGentlePrompt(false);
    return teardown;
  }, [resetKey, teardown]);

  // タブが隠れたらチェックを中断してマイクを解放する
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && pipelineRef.current) stop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [stop]);

  return { status, progress, level, showGentlePrompt, start, stop };
}
