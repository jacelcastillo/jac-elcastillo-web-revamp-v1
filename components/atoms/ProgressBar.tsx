import type { ComponentPropsWithoutRef } from "react";

type ProgressBarProps = Omit<ComponentPropsWithoutRef<"progress">, "value" | "max" | "children"> & {
  value: number;
};

export function ProgressBar({ value, className = "", ...props }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Progreso</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <progress
        value={value}
        max={100}
        aria-label="Progreso"
        className={`h-2.5 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-leaf-deep [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:bg-leaf-deep ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
