import type { Metadata } from "next";
import FocusExperience from "./components/FocusExperience";

export const metadata: Metadata = {
  title: "Odaklanma",
  description: "Kesintisiz odak seansları, ambiyans sesleri ve pomodoro zamanlayıcı.",
  alternates: { canonical: "/focus" },
};

export default function FocusPage() {
  return <FocusExperience />;
}

