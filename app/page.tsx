import { PrimaryButton } from "@/components/primary-button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-12">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          Monitoramento assistivo
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-[#10201d] sm:text-6xl">
          Holy Motion Assistive Monitor
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#43524e]">
          PWA para acompanhamento de sinais do sensor BLE Holy-Motion, com base
          preparada para painel, Firebase e integração Bluetooth futura.
        </p>
        <div className="mt-8">
          <PrimaryButton href="/dashboard">Ir ao dashboard</PrimaryButton>
        </div>
      </section>
    </main>
  );
}
