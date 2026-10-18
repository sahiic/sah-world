"use client";
import EmptyState from "@/components/ui/EmptyState";
import AvatarImage from "@/components/ui/AvatarImage";
import { getLevelForXP } from "@/lib/constants";
import type { RosterMember } from "./CommunityView";

export default function Roster({ members }: { members: RosterMember[] }) {
  if (!members.length)
    return (
      <EmptyState icon="◎" title="Henüz başka üye yok" description="Davet kodunu güvendiğin kişilerle paylaşarak topluluğunu büyütebilirsin." />
    );
  return (
    <div className="roster">
      <div className="roster-head">
        <span>Sıra & üye</span>
        <span>Seviye</span>
        <span>Seri</span>
        <span>Toplam XH</span>
      </div>
      {members.map((member, index) => {
        const { level } = getLevelForXP(member.xp);
        return (
          <article key={member.user_id}>
            <b className={`rank rank-${index + 1}`}>
              {index < 3 ? ["Ⅰ", "Ⅱ", "Ⅲ"][index] : index + 1}
            </b>
            <AvatarImage
              src={
                member.avatar_url ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member.display_name)}`
              }
              size={42}
            />
            <div className="member-name">
              <strong>{member.display_name}</strong>
              <small>{member.role === "owner" ? "Kurucu" : "Üye"}</small>
            </div>
            <span className="level-badge">
              {level.icon} {level.name}
            </span>
            <span className="streak-cell">↗ {member.streak_current}</span>
            <strong className="xp-cell">
              {member.xp.toLocaleString("tr-TR")} XH
            </strong>
          </article>
        );
      })}
    </div>
  );
}

