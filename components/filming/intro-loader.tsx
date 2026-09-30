"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { INTRO_STORAGE_KEY } from "@/lib/filming/intro";

const HOLD_MS = 900;
const FADE_MS = 600;

type Phase = "showing" | "leaving" | "done";

/** Full-screen logo shown once per session; the gallery renders underneath. */
export function IntroLoader() {
  const [phase, setPhase] = useState<Phase>("showing");

  useEffect(() => {
    let seen = false;

    try {
      seen = sessionStorage.getItem(INTRO_STORAGE_KEY) !== null;
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // Storage blocked: show the intro every time.
    }

    const hold = seen ? 0 : HOLD_MS;
    const leave = window.setTimeout(() => setPhase("leaving"), hold);
    const done = window.setTimeout(() => {
      document.documentElement.dataset.filmingIntro = "seen";
      setPhase("done");
    }, hold + FADE_MS);

    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className={`intro-loader fixed inset-0 z-[60] grid place-items-center bg-paper transition-opacity ease-out ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <LogoMark
        className="h-24 w-auto text-ink md:h-32"
        style={{
          animation: "intro-mark 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      />
    </div>
  );
}
