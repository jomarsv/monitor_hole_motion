import Link from "next/link";

type FeatureLinkProps = {
  href: string;
  label: string;
  detail: string;
};

export function FeatureLink({ href, label, detail }: FeatureLinkProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-28 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-md"
    >
      <span className="text-base font-semibold text-slate-950 group-hover:text-cyan-700">
        {label}
      </span>
      <span className="mt-3 text-sm leading-6 text-slate-600">{detail}</span>
    </Link>
  );
}
