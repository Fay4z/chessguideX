"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface PrototypeVariantOption {
  key: string;
  label: string;
}

/**
 * Floating prototype switcher — dev only. Updates ?variant= so a variant is
 * shareable and reload-stable. ←/→ also cycle.
 */
export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: PrototypeVariantOption[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  );

  const go = useCallback(
    (delta: number) => {
      const next =
        variants[(index + delta + variants.length) % variants.length];
      const params = new URLSearchParams(window.location.search);
      params.set("variant", next.key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [index, variants, pathname, router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  if (process.env.NODE_ENV === "production") return null;

  const active = variants[index];

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white shadow-xl">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous variant"
        className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-zinc-700"
      >
        ←
      </button>
      <span className="min-w-44 px-1 text-center text-xs font-medium">
        <span className="font-mono text-amber-400">{active.key}</span>{" "}
        {active.label}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next variant"
        className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-zinc-700"
      >
        →
      </button>
    </div>
  );
}