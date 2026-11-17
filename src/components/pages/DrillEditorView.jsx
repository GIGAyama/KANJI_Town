import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { DRILL_NAME_MAX_LENGTH } from '../../systems/drill-share';
import { KanjiFinderControls, KanjiFinderResults, useKanjiFinder } from '../ui/KanjiFinder';

const KANJI_BY_ID = new Map(KANJI_DATA.map(k => [k.id, k]));

const DrillEditorView = ({ setView, stats, setStats }) => {
  const [drillName, setDrillName] = useState('');
  const [selectedKanjis, setSelectedKanjis] = useState([]);
  // はじめは じぶんの学年の字を出す（前は 1026 字ぜんぶを出していた）。「すべて」は 1 回おせば出る
  const finder = useKanjiFinder({ initialGrade: stats.targetGrade || 0, selectedIds: selectedKanjis });

  const toggleKanji = (id) => { setSelectedKanjis(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]); audioCtrl.playSE('click'); };
  const addKanjis = (ids) => setSelectedKanjis(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
  const removeKanjis = (ids) => setSelectedKanjis(prev => prev.filter(id => !ids.includes(id)));

  const handleSave = () => {
    if (!drillName.trim() || selectedKanjis.length === 0) { audioCtrl.playSE('stamp_bad'); return; }
    const newDrill = { name: drillName.trim(), kanjis: selectedKanjis, createdAt: Date.now() };
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), newDrill] };
    setStats(newStats); StorageAPI.saveStatsImmediate(newStats); audioCtrl.playSE('success'); setView('myDrills');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-shrink-0 flex items-center gap-3">
        <button onClick={() => setView('myDrills')} aria-label="マイドリルに戻る" className="text-[var(--text-muted)] hover:text-[var(--text)] p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)]"><span>ドリルを{F("作","つく")}る</span></h2>
      </div>
      {/* 名前の欄は 字の一覧と いっしょに流れる。さがす・しぼりこむ の欄だけ 上に のこる（スマホで 一覧を広く使うため） */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
        <div className="flex flex-col gap-2 pb-2">
          {/* ドリル名はアプリで唯一の自由記述欄で、共有リンク・学習ログ・記録ハブへそのまま流れる。
              文字数を共有できる長さに抑え、名前や出席番号を書かないよう添え書きする（Zero-PII） */}
          <input value={drillName} onChange={e => setDrillName(e.target.value)} maxLength={DRILL_NAME_MAX_LENGTH} aria-label="ドリルの名前" aria-describedby="drill-name-note" placeholder="ドリルの名前を入力（れい：3年 1学期）" className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 py-3 font-bold text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-lg" />
          <p id="drill-name-note" className="text-xs font-bold text-[var(--text-muted)]">
            {F("名前","なまえ")}や{F("出席番号","しゅっせきばんごう")}は {F("書","か")}かないでね（リンクで{F("配","くば")}ると みんなに{F("見","み")}えます）。{DRILL_NAME_MAX_LENGTH}{F("字","じ")}まで。
          </p>
          <div className="sticky top-0 z-10 bg-[var(--bg)] py-1.5">
            <KanjiFinderControls finder={finder} idPrefix="drill-finder" selectedCount={selectedKanjis.length} />
          </div>
          <KanjiFinderResults finder={finder} selectedIds={selectedKanjis} onToggle={toggleKanji} onAddMany={addKanjis} onRemoveMany={removeKanjis} />
        </div>
      </div>
      {/* えらんだ数と「保存する」は 1 行に ならべる（字の一覧を 広く使うため。前は 2 段で 116px 使っていた） */}
      <div className="flex-shrink-0 flex items-stretch gap-2">
        <div className="flex-1 min-w-0 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <span className="font-bold text-[var(--text)] flex-shrink-0">{selectedKanjis.length}{F("文字","もじ")} {F("選択中","せんたくちゅう")}</span>
          {/* えらんだ字の はじめの 6 字（入らない分は … で切る。ぜんぶは 上の「えらんだ字」で見られる） */}
          {selectedKanjis.length > 0 && <span className="min-w-0 truncate text-xl font-black text-[var(--text)]" data-testid="drill-selected-preview">{selectedKanjis.slice(0, 6).map(id => KANJI_BY_ID.get(id)?.char || '').join(' ')}{selectedKanjis.length > 6 ? ' …' : ''}</span>}
        </div>
        <MotionButton variant="primary" onClick={handleSave} disabled={!drillName.trim() || selectedKanjis.length === 0} className="shrink-0 px-5 min-h-[56px] text-lg font-black whitespace-nowrap border-[4px] border-[var(--text)] shadow-[0_5px_0_#9f1239]">{F("保存","ほぞん")}する</MotionButton>
      </div>
    </div>
  );
};

export default DrillEditorView;
