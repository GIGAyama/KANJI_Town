import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLocalJaVoice, toSpeechText, toKunSpeech } from '../src/utils/tts.js';

test('端末内蔵の日本語音声だけを選ぶ', () => {
  const remoteJa = { lang: 'ja-JP', localService: false, name: 'Remote JA' };
  const localEn = { lang: 'en-US', localService: true, name: 'Local EN' };
  const localJa = { lang: 'ja-JP', localService: true, name: 'Local JA' };
  const localJaDefault = { lang: 'ja-JP', localService: true, default: true, name: 'Default JA' };

  assert.equal(pickLocalJaVoice([remoteJa, localEn]), null);
  assert.equal(pickLocalJaVoice([remoteJa, localJa]), localJa);
  assert.equal(pickLocalJaVoice([localJa, localJaDefault]), localJaDefault);
  assert.equal(pickLocalJaVoice(null), null);
  assert.equal(pickLocalJaVoice([]), null);
});

test('例文からふりがなを除いて読み上げテキストを作る', () => {
  assert.equal(
    toSpeechText('一（ひと）人で 一りん車（いちりんしゃ）に 乗る。'),
    '一人で 一りん車に 乗る。',
  );
  assert.equal(toSpeechText('ふりがなの ない ぶん。'), 'ふりがなの ない ぶん。');
  assert.equal(toSpeechText(undefined), '');
});

test('訓読みの送り仮名マーカーを除く', () => {
  assert.equal(toKunSpeech('ひと-'), 'ひと');
  assert.equal(toKunSpeech('あ(げる)'), 'あげる');
  assert.equal(toKunSpeech('ほろ(びる)'), 'ほろびる');
  assert.equal(toKunSpeech(null), '');
});
