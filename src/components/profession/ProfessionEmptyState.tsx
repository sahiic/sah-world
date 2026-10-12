"use client";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {};
export default function ProfessionEmptyState({}: Props) { return (<section className="profession-empty">
          <AppIcon name="route" />
          <h2>İlk öğrenme yolunu seç</h2>
          <p>
            Yukarıdaki meslek kartlarından birini eklediğinde sekiz adımlı ders
            yolu burada açılacak.
          </p>
        </section>); }
