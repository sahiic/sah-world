"use client";
import EmptyState from "@/components/ui/EmptyState";
import { useJourneyStore } from "@/store/useJourneyStore";
import type { SectionKey } from "./SectionView";
import SectionContextLinks from "./SectionContextLinks";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: "text" | "textarea" | "number";
  placeholder: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  const validation = {
    required,
    onInvalid: (
      event: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      event.currentTarget.setCustomValidity("Bu alanı tamamlaman gerekiyor."),
    onInput: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      event.currentTarget.setCustomValidity(""),
  };
  return (
    <label className="field">
      <span>{label}</span>
      {type === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={4}
          {...validation}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          {...validation}
        />
      )}
      <small className="field-error">Bu alanı tamamlaman gerekiyor.</small>
    </label>
  );
}

export default function EntrySection({
  section,
  onSubmit,
  onNavigate,
}: {
  section: Exclude<SectionKey, "matrix" | "mescidim">;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onNavigate: (view: string) => void;
}) {
  const store = useJourneyStore();
  const lists = {
    journal: store.journal,
    quran: store.quranNotes,
    hadis: store.hadisNotes,
    lessons: store.lessons,
    sukur: store.sukurList,
  };
  const items = lists[section];
  return (
    <div className="workspace-grid">
      <form className="surface-card entry-form" onSubmit={onSubmit}>
        <div className="card-heading">
          <div>
            <span className="eyebrow">YENİ KAYIT</span>
            <h2>Bugünden bir iz bırak</h2>
          </div>
        </div>
        {section === "journal" && (
          <>
            <div className="three-fields">
              <Field
                label="Ruh hali (1-5)"
                name="mood"
                type="number"
                min={1}
                max={5}
                placeholder="3"
              />
              <Field
                label="Enerji (1-10)"
                name="energy"
                type="number"
                min={1}
                max={10}
                placeholder="7"
              />
              <Field
                label="Stres (1-10)"
                name="stress"
                type="number"
                min={1}
                max={10}
                placeholder="3"
              />
            </div>
            <Field
              label="Bugün sende ne kaldı?"
              name="content"
              type="textarea"
              placeholder="Kendine dürüst ve şefkatli bir not..."
            />
          </>
        )}
        {section === "quran" && (
          <>
            <div className="two-fields">
              <Field label="Sure" name="sure" placeholder="Örn. İnşirah" />
              <Field
                label="Ayet"
                name="ayet"
                placeholder="Ayet numarası veya kısa referans"
              />
            </div>
            <Field
              label="Tefsir / not"
              name="tefsir"
              type="textarea"
              placeholder="Okuduğundan anladığın..."
            />
            <Field
              label="Hayata taşıyacağım ders"
              name="ders"
              type="textarea"
              placeholder="Bugün uygulayabileceğim küçük bir adım..."
            />
          </>
        )}
        {section === "hadis" && (
          <>
            <div className="two-fields">
              <Field label="Kaynak" name="kaynak" placeholder="Örn. Buhârî" />
              <Field label="Konu" name="konu" placeholder="Örn. İstikrar" />
            </div>
            <Field
              label="Hadis metni / kısa not"
              name="metin"
              type="textarea"
              placeholder="Kaynakla birlikte notun..."
            />
            <Field
              label="Hayata uygulama niyeti"
              name="uygulama"
              type="textarea"
              placeholder="Bunu bugün nasıl yaşayabilirim?"
            />
          </>
        )}
        {section === "lessons" && (
          <>
            <div className="two-fields">
              <Field
                label="Başlık"
                name="title"
                placeholder="Durumu kısa adlandır"
              />
              <Field
                label="Etkisi (1-5)"
                name="severity"
                type="number"
                min={1}
                max={5}
                placeholder="3"
              />
            </div>
            <Field
              label="Ne oldu?"
              name="wrong"
              type="textarea"
              placeholder="Yargılamadan olayı tarif et..."
            />
            <Field
              label="Bundan ne öğrendim?"
              name="learned"
              type="textarea"
              placeholder="Bir sonraki sefer için küçük ve gerçekçi bir ders..."
            />
          </>
        )}
        {section === "sukur" && (
          <>
            <Field
              label="Bugünün şükür notu"
              name="text"
              type="textarea"
              placeholder="Bugün fark ettiğim..."
            />
            <div className="three-fields">
              <Field
                label="Nimet 1"
                name="n1"
                placeholder="Küçük de olabilir"
              />
              <Field label="Nimet 2" name="n2" placeholder="Bugünden" />
              <Field label="Nimet 3" name="n3" placeholder="Kalbine gelen" />
            </div>
          </>
        )}
        <SectionContextLinks section={section} onNavigate={onNavigate} />
        <button className="primary-button" type="submit">
          Kaydı tamamla
        </button>
      </form>
      <section className="surface-card recent-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">ARŞİV</span>
            <h2>Son kayıtlar</h2>
          </div>
          <span className="quiet-chip">{items.length} toplam</span>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon="notes"
            title="Bu sayfa ilk izini bekliyor"
            description="Bugünden kalan tek bir cümle, zamanla anlamlı bir yolculuğa dönüşebilir."
          />
        ) : (
          <div className="simple-records">
            {items.slice(0, 8).map((item) => (
              <article key={item.id}>
                <strong>
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "long",
                  }).format(new Date(item.createdAt))}
                </strong>
                <p>
                  {"content" in item
                    ? item.content
                    : "ders" in item
                      ? item.ders
                      : "uygulama" in item
                        ? item.uygulama
                        : "learned" in item
                          ? item.learned
                          : item.text}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
