import type { ComponentPropsWithoutRef } from "react";

export type Variant = "primary" | "secondary";

const variants: Record<Variant, string> = {
  primary: "bg-leaf-deep text-white hover:bg-[#354d07]",
  secondary: "border border-ink/15 bg-white text-ink hover:border-ink/40",
};

const base =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors";

export const buttonClass = (variant: Variant) => `${base} ${variants[variant]}`;

type ButtonProps = ComponentPropsWithoutRef<"button"> & { variant?: Variant };

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant)} ${className}`.trim()}
      {...props}
    />
  );
}
