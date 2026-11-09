import type { ComponentPropsWithoutRef } from "react";

type ProgressBarProps = Omit<ComponentPropsWithoutRef<"progress">, "value" | "max" | "children"> & {
  value: number;
};

export function ProgressBar({ value, className = "", ...props }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <progress
        value={value}
        max={100}
        aria-label="Avance"
        className={`h-2.5 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-leaf-deep [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:bg-leaf-deep ${className}`.trim()}
        {...props}
      />
      <span className="text-sm font-semibold tabular-nums">{value}%</span>
    </div>
  );
}
