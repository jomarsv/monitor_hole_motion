"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

type Mode = "entrar" | "bootstrap";

export function SignInPanel() {
  const router = useRouter();
  const { profile, signIn, createInitialAdmin, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bootstrapKey, setBootstrapKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === "entrar" ? "Acesso ao CortexMA" : "Primeiro administrador"), [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "entrar") {
        await signIn(email, password);
        router.push("/nova-analise");
        return;
      }

      await createInitialAdmin({
        email,
        password,
        displayName,
        bootstrapKey
      });

      setMessage("Conta inicial criada e vinculada ao perfil administrativo.");
      router.push("/nova-analise");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel concluir a operacao.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError("");
    setMessage("");

    try {
      await requestPasswordReset(email);
      setMessage("Solicitacao de redefinicao de senha enviada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel enviar a redefinicao.");
    }
  }

  if (profile?.active) {
    return (
      <section className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
          Usuario autenticado
        </p>
        <h1 className="mt-3 text-2xl font-bold text-cortex-ink">
          {profile.displayName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          O acesso ja esta ativo. Use o menu para seguir para analises, biblioteca ou gestao de usuarios.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("entrar")}
            className={`inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-bold transition ${
              mode === "entrar"
                ? "border-cortex-forest bg-cortex-forest text-white"
                : "border-cortex-line bg-white text-cortex-ink"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("bootstrap")}
            className={`inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-bold transition ${
              mode === "bootstrap"
                ? "border-cortex-forest bg-cortex-forest text-white"
                : "border-cortex-line bg-white text-cortex-ink"
            }`}
          >
            Criar admin inicial
          </button>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-cortex-ink">{title}</h1>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-cortex-ink" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm outline-none focus:border-cortex-forest focus:bg-white"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink" htmlFor="password">
            Senha
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm outline-none focus:border-cortex-forest focus:bg-white"
            />
          </label>

          {mode === "bootstrap" ? (
            <>
              <label
                className="grid gap-2 text-sm font-bold text-cortex-ink"
                htmlFor="display-name"
              >
                Nome de exibicao
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm outline-none focus:border-cortex-forest focus:bg-white"
                />
              </label>

              <label
                className="grid gap-2 text-sm font-bold text-cortex-ink"
                htmlFor="bootstrap-key"
              >
                Chave de bootstrap
                <input
                  id="bootstrap-key"
                  type="password"
                  value={bootstrapKey}
                  onChange={(event) => setBootstrapKey(event.target.value)}
                  className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm outline-none focus:border-cortex-forest focus:bg-white"
                />
              </label>
            </>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white transition hover:bg-cortex-leaf disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processando..." : mode === "entrar" ? "Entrar" : "Criar conta inicial"}
          </button>

          {mode === "entrar" ? (
            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cortex-line bg-white px-5 py-3 text-sm font-bold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river"
            >
              Redefinir senha
            </button>
          ) : null}
        </div>
      </form>

      <aside className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
          Hierarquia
        </p>
        <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
          <p>Admin: gerencia usuarios, biblioteca e limites.</p>
          <p>Gestor: cria usuarios e publica conteudo com nivel controlado.</p>
          <p>Analista: consulta biblioteca e gera analises de acordo com seu nivel.</p>
          <p>Consulta: leitura restrita e limite diario reduzido.</p>
        </div>
        <p className="mt-5 text-xs leading-6 text-neutral-500">
          O primeiro acesso usa a chave de bootstrap configurada no servidor. Depois disso, o login normal passa a valer para os usuarios cadastrados.
        </p>
      </aside>
    </section>
  );
}
