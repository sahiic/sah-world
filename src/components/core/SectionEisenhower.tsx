"use client";
import { useJourneyStore } from "@/store/useJourneyStore";
import type { EisenhowerState } from "@/types";
import ContextLinks from "./SectionContextLinks";

export default function Matrix({
  reward,
  onNavigate,
}: {
  reward: (a: number, l: string, s: string, id: string) => void;
  onNavigate: (view: string) => void;
}) {
  const store = useJourneyStore();
  const quadrants: Array<[keyof EisenhowerState, string, string]> = [
    ["q1", "Acil + Önemli", "Şimdi yap"],
    ["q2", "Önemli + Acil değil", "Planla"],
    ["q3", "Acil + Önemli değil", "Sadeleştir"],
    ["q4", "Acil değil + Önemli değil", "Ele"],
  ];
  const add = (
    event: React.FormEvent<HTMLFormElement>,
    q: keyof EisenhowerState,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("task")).trim();
    if (!text) return;
    store.addTask(q, {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
    });
    form.reset();
  };
  return (
    <>
      <div className="matrix-grid">
        {quadrants.map(([q, title, hint], i) => (
          <section className={`surface-card quadrant q${i + 1}`} key={q}>
            <div className="card-heading">
              <div>
                <span className="eyebrow">{hint}</span>
                <h2>{title}</h2>
              </div>
              <span className="quiet-chip">{store.eisenhower[q].length}</span>
            </div>
            <form onSubmit={(e) => add(e, q)} className="inline-form">
              <input name="task" placeholder="Yeni görev..." />
              <button type="submit">+</button>
            </form>
            <div className="task-list">
              {store.eisenhower[q].map((task) => (
                <label key={task.id}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => {
                      store.toggleTask(q, task.id);
                      if (!task.done)
                        reward(25, "Görev tamamlandı", "matrix", task.id);
                    }}
                  />
                  <span>{task.text}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
      <ContextLinks section="matrix" onNavigate={onNavigate} />
    </>
  );
}
