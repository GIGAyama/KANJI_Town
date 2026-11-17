import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, FileText, History, NotebookPen, Pencil, QrCode, Trash2, X } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModalDialog from '../ui/ModalDialog';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { describeShareEntry, readShareLog, removeShareLog, shareEntryUrl, shareLogKey } from '../../systems/share-log';
import { formatMonthDay } from '../../systems/homework-status';
import ShareLinkPanel from './ShareLinkPanel';

// 配ったものの控え（先生向け）。配ったリンクを、配ったときの中身のまま もう一度 出せる（URL・QR・Classroom）。
// 控えは 先生の端末の中だけにある（stats.shareLog。systems/share-log.js）。サーバーへは送らない。

const KANJI_BY_ID = new Map(KANJI_DATA.map((kanji) => [kanji.id, kanji]));
const charsOf = (ids, limit = 14) => `${ids.slice(0, limit).map((id) => KANJI_BY_ID.get(id)?.char || '').join('')}${ids.length > limit ? '…' : ''}`;
/** 配った日（端末の日付）。「11/17」 */
const dayOf = (at) => { const d = new Date(at); return at > 0 && !Number.isNaN(d.getTime()) ? `${d.getMonth() + 1}/${d.getDate()}` : ''; };

/** 宿題の決まりを 1 行にする */
const HomeworkText = ({ homework, kanjiCount }) => (
  <span>
    しめきり {formatMonthDay(homework.due)}・{homework.mode === 'test'
      ? <>テスト {homework.count ? `${homework.count}もん` : `ぜんぶ（${kanjiCount}もん）`}・{homework.pass}%で できた</>
      : <>れんしゅう</>}
  </span>
);

const KIND = {
  drill: { label: 'ドリル', icon: FileText, tone: 'bg-[var(--secondary)] text-[var(--panel)]' },
  homework: { label: 'しゅくだい', icon: NotebookPen, tone: 'bg-[var(--primary)] text-[var(--panel)]' },
  range: { label: 'ならった はんい', icon: CalendarDays, tone: 'bg-[var(--accent)] text-[var(--text)]' },
};
const kindOf = (info) => (info.kind === 'range' ? KIND.range : info.homework ? KIND.homework : KIND.drill);

/**
 * @param {{ stats: object, setStats: Function, setView: Function, onClose: () => void }} props
 */
const ShareLogDialog = ({ stats, setStats, setView, onClose }) => {
  const log = useMemo(() => readShareLog(stats.shareLog).map((entry) => ({ entry, info: describeShareEntry(entry), key: shareLogKey(entry) })), [stats.shareLog]);
  const [openKey, setOpenKey] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'remove:<key>' | 'draft'
  const open = log.find((item) => item.key === openKey) || null;

  const remove = (key) => {
    audioCtrl.playSE('click');
    setStats((prev) => {
      const next = { ...prev, shareLog: removeShareLog(prev.shareLog, key) };
      StorageAPI.saveStats(next);
      return next;
    });
    setConfirm(null);
    if (openKey === key) setOpenKey(null);
  };
  // 配った範囲を 下書きに もどして、直してから 配りなおす（いまの下書きは おきかわる）
  const restoreDraft = (info) => {
    audioCtrl.playSE('click');
    setStats((prev) => {
      const next = { ...prev, rangeDraft: { name: info.name, stages: info.stages.map((stage) => ({ from: stage.from, kanjis: [...stage.kanjis] })) } };
      StorageAPI.saveStats(next);
      return next;
    });
    onClose();
    setView('rangeEditor');
  };

  const shareUrl = open ? shareEntryUrl(open.entry, `${window.location.origin}${window.location.pathname}`) : null;

  return (
    <ModalDialog labelId="share-log-title" onEscape={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-stretch justify-center p-2 md:p-6 bg-black/40" data-testid="share-log">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--bg)] border-[4px] border-[var(--text)] rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 p-3 border-b-[3px] border-[var(--text)] bg-[var(--panel)]">
          {open && (
            <button type="button" onClick={() => { audioCtrl.playSE('click'); setOpenKey(null); setConfirm(null); }} aria-label="控えの一覧に戻る" className="min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-[var(--text)]"><ArrowLeft size={24} /></button>
          )}
          <h3 id="share-log-title" className="flex-1 min-w-0 font-black text-[var(--text)] flex items-center gap-2">
            <History size={20} aria-hidden="true" className="shrink-0" />
            <span>{F('配', 'くば')}ったものの{F('控', 'ひか')}え（{F('先生', 'せんせい')}{F('向', 'む')}け）</span>
          </h3>
          <button type="button" onClick={onClose} aria-label="とじる" data-autofocus className="min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center text-[var(--text)]"><X size={24} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
          {!open && (
            <>
              <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed">
                リンク・QR・Classroom・4けたの すうじで {F('配', 'くば')}ったものが、{F('新', 'あたら')}しい じゅんに 20{F('件', 'けん')}まで のこります。
                この{F('端末', 'たんまつ')}の{F('中', 'なか')}だけに あり、サーバーには{F('送', 'おく')}りません。
              </p>
              {log.length === 0 && (
                <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-6 text-center" data-testid="share-log-empty">
                  <p className="font-bold text-[var(--text)]"><span>まだ {F('配', 'くば')}ったものが ありません</span></p>
                  <p className="text-sm text-[var(--text-muted)] mt-1"><span>ドリルの「リンク」「{F('送', 'おく')}る」や、「ならった{F('範囲', 'はんい')}を{F('配', 'くば')}る」で {F('配', 'くば')}ると、ここに のこります。</span></p>
                </div>
              )}
              <ul className="flex flex-col gap-2">
                {log.map(({ entry, info, key }) => {
                  const kind = kindOf(info);
                  const Icon = kind.icon;
                  return (
                    <li key={key} className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-3 flex flex-col gap-2" data-testid="share-log-item" data-kind={info.kind === 'range' ? 'range' : info.homework ? 'homework' : 'drill'}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${kind.tone}`}><Icon size={14} aria-hidden="true" /><span>{kind.label}</span></span>
                        <span className="text-xs font-bold text-[var(--text-muted)]">{dayOf(entry.at)} に {F('配', 'くば')}った{entry.via === 'number' ? '（4けたの すうじ）' : ''}</span>
                      </div>
                      <div className="font-black text-[var(--text)] text-lg leading-snug [overflow-wrap:anywhere]">{info.name}</div>
                      <div className="text-sm font-bold text-[var(--text)]">
                        {info.kind === 'range'
                          ? <span>{info.stages.length}だん・{info.kanjiCount}{F('字', 'じ')}（{formatMonthDay(info.stages[0].from)}から）</span>
                          : <span>{info.kanjis.length}{F('字', 'じ')}：<span style={{ fontFamily: "'Klee One', serif" }}>{charsOf(info.kanjis)}</span></span>}
                      </div>
                      {info.homework && <div className="text-xs font-bold text-[var(--text-muted)]"><HomeworkText homework={info.homework} kanjiCount={info.kanjis.length} /></div>}
                      {confirm === `remove:${key}` ? (
                        <div className="flex gap-2">
                          <MotionButton variant="secondary" onClick={() => setConfirm(null)} className="flex-1 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">やめる</MotionButton>
                          <MotionButton variant="danger" onClick={() => remove(key)} className="flex-1 min-h-[48px] text-sm">{F('控', 'ひか')}えから {F('消', 'け')}す</MotionButton>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <MotionButton variant="primary" onClick={() => setOpenKey(key)} className="flex-1 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]" data-testid="share-log-open"><QrCode size={18} /> リンク・QRを もういちど {F('出', 'だ')}す</MotionButton>
                          <button type="button" onClick={() => { audioCtrl.playSE('click'); setConfirm(`remove:${key}`); }} aria-label={`「${info.name}」を 控えから消す`} className="shrink-0 min-w-[48px] min-h-[48px] rounded-xl border-2 border-rose-300 text-rose-600 flex items-center justify-center hover:bg-[var(--bg)]"><Trash2 size={18} /></button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {open && (
            <>
              <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 flex flex-col gap-1" data-testid="share-log-detail">
                <div className="text-xs font-bold text-[var(--text-muted)]">{dayOf(open.entry.at)} に {F('配', 'くば')}ったときの {F('中身', 'なかみ')}（そのあとに {F('直', 'なお')}した{F('分', 'ぶん')}は {F('入', 'はい')}っていません）</div>
                <div className="font-black text-[var(--text)] text-lg [overflow-wrap:anywhere]">{open.info.name}</div>
                {open.info.kind === 'range' ? (
                  <ol className="flex flex-col gap-1">
                    {open.info.stages.map((stage, i) => (
                      <li key={i} className="text-sm text-[var(--text)]">
                        <span className="font-black">{i + 1}だんめ {formatMonthDay(stage.from)}から</span>：<span style={{ fontFamily: "'Klee One', serif" }}>{charsOf(stage.kanjis, 300)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <>
                    <div className="text-sm text-[var(--text)]">{open.info.kanjis.length}{F('字', 'じ')}：<span className="text-lg font-black" style={{ fontFamily: "'Klee One', serif" }}>{charsOf(open.info.kanjis, 300)}</span></div>
                    {open.info.homework && <div className="text-sm font-bold text-[var(--text)]"><HomeworkText homework={open.info.homework} kanjiCount={open.info.kanjis.length} /></div>}
                  </>
                )}
              </div>
              <ShareLinkPanel
                shareUrl={shareUrl}
                title={open.info.kind === 'range' ? `ならった範囲：${open.info.name}` : open.info.homework ? `しゅくだい ${formatMonthDay(open.info.homework.due)}まで：${open.info.name}` : open.info.name}
                label={open.info.kind === 'range' ? '範囲のURL' : open.info.homework ? '宿題のURL' : 'ドリルのURL'}
                inputId="share-log-url"
              />
              {open.info.kind === 'range' && (confirm === 'draft' ? (
                <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-3 flex flex-col gap-2">
                  <p className="text-sm font-bold text-[var(--text)]"><span>いまの {F('下書', 'したが')}きは {F('消', 'き')}えて、この{F('範囲', 'はんい')}に おきかわります。よいですか？</span></p>
                  <div className="flex gap-2">
                    <MotionButton variant="secondary" onClick={() => setConfirm(null)} className="flex-1 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">やめる</MotionButton>
                    <MotionButton variant="primary" onClick={() => restoreDraft(open.info)} className="flex-1 min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]" data-testid="share-log-restore-yes">おきかえて {F('直', 'なお')}す</MotionButton>
                  </div>
                </div>
              ) : (
                <MotionButton variant="secondary" onClick={() => { audioCtrl.playSE('click'); setConfirm('draft'); }} className="w-full min-h-[48px] text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]" data-testid="share-log-restore">
                  <Pencil size={16} /> この{F('範囲', 'はんい')}を {F('直', 'なお')}して {F('配', 'くば')}りなおす
                </MotionButton>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </ModalDialog>
  );
};

export default ShareLogDialog;
