import type { ComponentPropsWithoutRef } from "react";

type Tone = "leaf" | "sun" | "blue" | "muted";

const tones: Record<Tone, string> = {
  leaf: "bg-leaf/15 text-leaf-deep",
  sun: "bg-sun text-ink",
  blue: "bg-flag-blue/10 text-flag-blue",
  muted: "bg-line text-muted",
};

type TagProps = ComponentPropsWithoutRef<"span"> & { tone?: Tone };

export function Tag({ tone = "leaf", className = "", ...props }: TagProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${tones[tone]} ${className}`.trim()}
      {...props}
    />
  );
}
