"use client";

export default function CommunityEmpty({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <section className="surface-card community-empty">
      <div className="community-orbits">
        <i />
        <i />
        <i />
        <span>◎</span>
      </div>
      <span className="eyebrow">GRUBUM YOK</span>
      <h2>İyi alışkanlıklar, iyi bir çevreyle güçlenir.</h2>
      <p>
        Yakınların için özel bir topluluk oluştur veya sana gönderilen altı
        karakterli kodla katıl. Günlük, hata ve tefekkür içerikleri paylaşılmaz.
      </p>
      <div>
        <button className="primary-button" onClick={onCreate}>
          Grup oluştur
        </button>
        <button className="ghost-button" onClick={onJoin}>
          Gruba katıl
        </button>
      </div>
    </section>
  );
}

