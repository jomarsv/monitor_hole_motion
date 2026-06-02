import { SignInPanel } from "@/components/auth/SignInPanel";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
          Acesso
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-cortex-ink">
          Entrar no CortexMA
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-700">
          O acesso usa usuario e senha, com perfil hierarquico, biblioteca privada e limite diario por conta.
        </p>
      </section>

      <SignInPanel />
    </div>
  );
}
