"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Presence = { userId: string; typing?: boolean; typingAt?: number };
// One private channel per relationship; never publish identity on a global
// directory channel. Presence is an opt-in, untrusted hint, not authorization.
export function useQuranPresence(
  contextIds: string[],
  userId: string,
  enabled: boolean,
) {
  const contexts = JSON.stringify([...new Set(contextIds)].sort());
  const [state, setState] = useState<{
    identity: string;
    online: Set<string>;
    typing: Set<string>;
  }>({ identity: "", online: new Set(), typing: new Set() });
  const channels = useRef(new Map<string, RealtimeChannel>());
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const typingState = useRef(new Set<string>());
  const lastTrack = useRef(new Map<string, number>());
  useEffect(() => {
    if (!enabled || !userId) return;
    const ownChannels = new Map<string, RealtimeChannel>();
    const states = new Map<string, Presence[]>();
    let active = true;
    const sync = () => {
      if (!active) return;
      const others = [...states.values()]
        .flat()
        .filter((p) => p.userId !== userId);
      setState({
        identity: userId,
        online: new Set(others.map((p) => p.userId)),
        typing: new Set(
          [...states.entries()]
            .filter(([, ps]) =>
              ps.some(
                (p) =>
                  p.userId !== userId &&
                  p.typing &&
                  Date.now() - (p.typingAt ?? 0) < 5000,
              ),
            )
            .map(([id]) => id),
        ),
      });
    };
    const connect = async () => {
      for (const id of JSON.parse(contexts) as string[]) {
        // This topic must be identical on both ends. ownedRealtimeChannel's nonce
        // is appropriate for database listeners but NOT shared Presence topics.
        const topic = `quran:context:${id}`;
        // Strict Mode / rapid remount may leave the old subscription in the SDK
        // registry until unsubscribe finishes. Wait, never attach to that owner.
        const stale = supabase
          .getChannels()
          .filter((c) => c.topic === `realtime:${topic}`);
        await Promise.all(stale.map((c) => supabase.removeChannel(c)));
        if (!active) return;
        const channel = supabase.channel(topic, {
          config: { private: true, presence: { key: userId } },
        });
        ownChannels.set(id, channel);
        channel
          .on("presence", { event: "sync" }, () => {
            states.set(
              id,
              Object.values(channel.presenceState<Presence>()).flat(),
            );
            sync();
          })
          .subscribe((status) => {
            if (
              status === "SUBSCRIBED" &&
              active &&
              document.visibilityState === "visible"
            )
              void channel.track({ userId, typing: false });
            else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              states.delete(id);
              sync();
            }
          });
      }
    };
    void connect();
    channels.current = ownChannels;
    const expire = window.setInterval(sync, 2000);
    const visibility = () => {
      typingState.current.clear();
      typingTimers.current.forEach(clearTimeout);
      typingTimers.current.clear();
      for (const channel of ownChannels.values()) {
        if (document.visibilityState === "visible")
          void channel.track({ userId, typing: false });
        else void channel.untrack();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    const timers = typingTimers.current,
      typed = typingState.current,
      tracked = lastTrack.current;
    return () => {
      active = false;
      window.clearInterval(expire);
      document.removeEventListener("visibilitychange", visibility);
      timers.forEach(clearTimeout);
      timers.clear();
      typed.clear();
      tracked.clear();
      ownChannels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
      if (channels.current === ownChannels) channels.current = new Map();
    };
  }, [contexts, userId, enabled]);
  const actions = useMemo(
    () => ({
      setTyping(context: string, value: boolean) {
        const channel = channels.current.get(context);
        if (!channel) return;
        const previous = typingTimers.current.get(context);
        if (previous) clearTimeout(previous);
        // Track on state transitions, not on every key press. Periodic expiry on
        // receivers clears stale indicators after disconnect/network loss.
        if (
          value &&
          (!typingState.current.has(context) ||
            Date.now() - (lastTrack.current.get(context) ?? 0) > 2500)
        ) {
          typingState.current.add(context);
          lastTrack.current.set(context, Date.now());
          void channel.track({ userId, typing: true, typingAt: Date.now() });
        }
        if (!value) {
          typingState.current.delete(context);
          void channel.track({ userId, typing: false });
        }
        if (value)
          typingTimers.current.set(
            context,
            setTimeout(() => {
              typingState.current.delete(context);
              void channel.track({ userId, typing: false });
            }, 2000),
          );
      },
    }),
    [userId],
  );
  return {
    online:
      enabled && state.identity === userId ? state.online : new Set<string>(),
    typing:
      enabled && state.identity === userId ? state.typing : new Set<string>(),
    ...actions,
  };
}
export type QuranPresenceState = ReturnType<typeof useQuranPresence>;
