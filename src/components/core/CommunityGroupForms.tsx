"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { GroupPreview } from "./CommunityView";

export function CreateGroupForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <label className="field">
        <span>Grup adı</span>
        <input
          name="name"
          minLength={2}
          maxLength={60}
          required
          autoFocus
          placeholder="Örn. Sabah Halkası"
        />
      </label>
      <label className="field">
        <span>
          Kısa açıklama <small>İsteğe bağlı</small>
        </span>
        <textarea
          name="description"
          maxLength={240}
          rows={3}
          placeholder="Bu grupta neyi birlikte sürdüreceksiniz?"
        />
      </label>
      <div className="dialog-security">
        <AppIcon name="lock" />
        <span>
          <strong>Kişisel kayıtların paylaşılmaz.</strong> Üyeler yalnızca
          adını, seviyeni, serini ve toplam XH’ını görür.
        </span>
      </div>
      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? "Oluşturuluyor…" : "Topluluğu oluştur"}
      </button>
    </form>
  );
}

export function JoinGroupForm({
  busy,
  preview,
  onCodeChange,
  onSubmit,
}: {
  busy: boolean;
  preview: GroupPreview | null;
  onCodeChange: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <label className="field code-field">
        <span>6 karakterli grup kodu</span>
        <input
          name="code"
          minLength={6}
          maxLength={6}
          pattern="[A-Za-z0-9]{6}"
          required
          autoFocus
          defaultValue={preview?.group_code ?? ""}
          onChange={onCodeChange}
          placeholder="A1B2C3"
          autoCapitalize="characters"
          autoComplete="off"
        />
      </label>
      {preview && (
        <article className="group-preview">
          <span>{preview.name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
          <div>
            <small>DAVET DOĞRULANDI</small>
            <strong>{preview.name}</strong>
            <p>
              {preview.description || "Birlikte istikrar için özel topluluk."}
            </p>
          </div>
          <b>{preview.member_count}/100 üye</b>
        </article>
      )}
      <div className="dialog-security">
        <AppIcon name="shield-check" />
        <span>
          <strong>Katılma işlemi kontrollüdür.</strong> Kod doğrulanmadan üyelik
          oluşturulmaz.
        </span>
      </div>
      <button className="primary-button" type="submit" disabled={busy}>
        {busy
          ? "Kontrol ediliyor…"
          : preview
            ? "Topluluğa güvenle katıl"
            : "Kodu doğrula"}
      </button>
    </form>
  );
}

