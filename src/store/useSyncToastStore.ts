import { create } from 'zustand';

interface SyncToastEntry {
  id: number;
  context: string;
  code: string;
  ts: number;
}

interface SyncToastState {
  errors: SyncToastEntry[];
  push: (context: string, code: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useSyncToastStore = create<SyncToastState>((set) => ({
  errors: [],
  push: (context, code) => {
    const id = nextId++;
    set((state) => ({ errors: [...state.errors, { id, context, code, ts: Date.now() }] }));
    setTimeout(() => set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })), 6000);
  },
  dismiss: (id) => set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })),
}));
