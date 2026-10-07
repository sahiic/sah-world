// Keep the latest in-memory snapshot if disk storage is denied/full. Otherwise
// the runtime's cross-tab read could restore an older clock over an unsaved one.
let pending: { key: string; value: string } | null = null;
let warning = "";
const listeners = new Set<() => void>();
function report(value: string) {
  if (warning === value) return;
  warning = value;
  listeners.forEach((listener) => listener());
}
export const focusStorageStatus = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  snapshot: () => warning,
};
export const focusStorage = {
  getItem(key: string) {
    if (pending?.key === key) return pending.value;
    try {
      return localStorage.getItem(key);
    } catch {
      report(
        "Tarayıcı depolaması açılamadı. Oturum bu sekmede sürer; sayfayı kapatmadan depolama iznini kontrol et.",
      );
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      pending = null;
      report("");
    } catch {
      pending = { key, value };
      report(
        "Değişiklikler bu sekmede tutuluyor, cihazına kaydedilemiyor. Depolama alanını veya tarayıcı iznini kontrol et; sayfayı kapatma.",
      );
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
      pending = null;
      report("");
    } catch {
      report("Cihazdaki odak kaydı kaldırılamadı.");
    }
  },
};
