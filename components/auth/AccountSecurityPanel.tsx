"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function AccountSecurityPanel() {
  const { profile, changePassword, requestPasswordReset } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (nextPassword.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError("A confirmação da senha não confere.");
      return;
    }

    try {
      setBusy(true);
      await changePassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setMessage("Senha atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    try {
      if (!profile?.email) {
        throw new Error("E-mail não disponível para redefinição.");
      }

      await requestPasswordReset(profile.email);
      setMessage("Link de redefinição enviado para o e-mail cadastrado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a redefinição.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
          Conta
        </p>
        <h1 className="mt-2 text-2xl font-bold text-cortex-ink">Segurança da conta</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Troque sua senha atual sem sair do sistema.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-cortex-line bg-white p-5 shadow-soft lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
          E-mail
          <input
            value={profile?.email ?? ""}
            disabled
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm text-neutral-700"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink">
          Senha atual
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink">
          Nova senha
          <input
            type="password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
          Confirmar nova senha
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 lg:col-span-2">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Atualizando..." : "Trocar senha"}
          </button>
          <button
            type="button"
            onClick={handlePasswordReset}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-cortex-line bg-white px-5 py-3 text-sm font-bold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river"
          >
            Enviar redefinição por e-mail
          </button>
        </div>
      </form>
    </div>
  );
}

