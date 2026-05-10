import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type PrimaryButtonProps = ComponentPropsWithoutRef<typeof Link>;

export function PrimaryButton({
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <Link
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
