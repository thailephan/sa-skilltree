"use client";

import { useEffect, useMemo, useState } from "react";
import type { SkillNode } from "@/lib/content";
import type { UIStrings } from "@/lib/i18n";
import type { QuizState, QueueEntry } from "@/lib/useQuiz";

export default function QuizPanel({
  open,
  onClose,
  nodes,
  cleared,
  ui,
  quiz,
}: {
  open: boolean;
  onClose: () => void;
  nodes: SkillNode[];
  cleared: Set<string>;
  ui: UIStrings;
  quiz: QuizState;
}) {
  const t = ui.quiz;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const s = quiz.stats(nodes, cleared);

  // Xây hàng đợi (đóng băng) mỗi lần mở panel.
  useEffect(() => {
    if (open) {
      setQueue(quiz.buildQueue(nodes, cleared));
      setIdx(0);
      setRevealed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const answer = (correct: boolean) => {
    const cur = queue[idx];
    if (!cur) return;
    quiz.grade(cur.nodeId, cur.qIdx, correct);
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  const hasStudied = s.total > 0;
  const cur = queue[idx];
  const node = cur ? byId.get(cur.nodeId) : null;
  const q = node && cur ? node.questions[cur.qIdx] : null;

  return (
    <>
      <div className={`overlay${open ? " open" : ""}`} onClick={onClose} />
      <div className={`quiz-modal${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        {open && (
          <>
            <div className="quiz-head">
              <div>
                <div className="code">QUIZ</div>
                <h2>{t.title}</h2>
              </div>
              <button className="d-close" aria-label={t.close} onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="quiz-stats">
              <div className="qs">
                <span className="qs-v gold">{s.due}</span>
                <span className="qs-k">{t.due}</span>
              </div>
              <div className="qs">
                <span className="qs-v mint">{s.mastered}</span>
                <span className="qs-k">{t.mastered}</span>
              </div>
              <div className="qs">
                <span className="qs-v rose">{s.weak}</span>
                <span className="qs-k">{t.weak}</span>
              </div>
            </div>

            <div className="quiz-body">
              {!hasStudied ? (
                <p className="quiz-msg">{t.noCleared}</p>
              ) : !cur || !q || !node ? (
                <div className="quiz-done">
                  <p className="quiz-msg">{t.empty}</p>
                  <p className="quiz-hint">{t.emptyHint}</p>
                </div>
              ) : (
                <div className="quiz-card">
                  <div className="quiz-meta">
                    <span className="quiz-badge">{node.id}</span>
                    <span className="quiz-prog">{t.progress(idx + 1, queue.length)}</span>
                  </div>
                  <p className="quiz-q">{q.q}</p>
                  {!revealed ? (
                    <button className="reveal" onClick={() => setRevealed(true)}>
                      {t.reveal} ▾
                    </button>
                  ) : (
                    <>
                      <div className="ans" dangerouslySetInnerHTML={{ __html: q.a }} />
                      <div className="quiz-actions">
                        <button className="grade wrong" onClick={() => answer(false)}>
                          ✕ {t.wrong}
                        </button>
                        <button className="grade correct" onClick={() => answer(true)}>
                          ✓ {t.correct}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
