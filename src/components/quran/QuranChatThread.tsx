"use client";
import QuranChat from "@/components/quran/QuranChat";
import { type QuranPresenceState } from "@/components/quran/useQuranPresence";

import { type PeerView } from "./companionShared";
interface QuranChatThreadProps {
  match: PeerView;
  userId: string;
  onClose: () => void;
  onRead?: () => void;
  presence?: QuranPresenceState;
}

export default function QuranChatThread({
  match,
  userId,
  onClose,
  onRead,
  presence,
}: QuranChatThreadProps) {
  return (
    <QuranChat
      contextId={match.id}
      userId={userId}
      partnerId={match.partner_id}
      name={match.partner_name}
      avatar={match.partner_avatar}
      subtitle="Kur’an çalışma eşleşmesi"
      kind="peer"
      onClose={onClose}
      onRead={onRead}
      presence={presence}
    />
  );
}
