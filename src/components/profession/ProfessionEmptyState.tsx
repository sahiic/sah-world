"use client";
import { AppIcon } from "@/components/ui/AppIcon";

export default function ProfessionEmptyState() { return (<section className="profession-empty">
          <AppIcon name="route" />
          <h2>İlk öğrenme yolunu seç</h2>
          <p>
            Yukarıdaki meslek kartlarından birini eklediğinde sekiz adımlı ders
            yolu burada açılacak.
          </p>
        </section>); }
