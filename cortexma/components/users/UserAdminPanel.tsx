"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CreateUserRequest, UserProfile } from "@/lib/types/auth";
import { fetchJson } from "@/lib/utils/api";
import { getRoleConfig, roleOptions } from "@/lib/types/hierarchy";

type UsersResponse = {
  users: UserProfile[];
};

export function UserAdminPanel() {
  const { profile, idToken, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState("Carregando usuarios...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<CreateUserRequest["role"]>("viewer");
  const [accessLevel, setAccessLevel] = useState("20");
  const [dailyAnalysisLimit, setDailyAnalysisLimit] = useState("5");
  const [department, setDepartment] = useState("");

  const canManage = profile?.role === "admin" || profile?.role === "manager";
  const roleConfig = useMemo(() => getRoleConfig(role), [role]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      if (!profile || !idToken) {
        if (active) {
          setUsers([]);
          setStatus("Entre para gerenciar usuarios.");
        }
        return;
      }

      if (!canManage) {
        if (active) {
          setUsers([]);
          setStatus("Seu perfil nao pode gerenciar usuarios.");
        }
        return;
      }

      try {
        const response = await fetchJson<UsersResponse>("/api/admin/users", idToken);
        if (!active) return;

        setUsers(response.users);
        setStatus(response.users.length ? "Usuarios carregados." : "Nenhum usuario cadastrado.");
      } catch {
        if (!active) return;

        setUsers([]);
        setStatus("Nao foi possivel carregar usuarios.");
      }
    }

    if (!loading) {
      loadUsers();
    }

    return () => {
      active = false;
    };
  }, [canManage, idToken, loading, profile]);

  useEffect(() => {
    setAccessLevel(String(roleConfig.accessLevel));
    setDailyAnalysisLimit(String(roleConfig.dailyAnalysisLimit));
  }, [roleConfig.accessLevel, roleConfig.dailyAnalysisLimit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (!profile || !idToken) {
        throw new Error("Entre com um perfil autorizado.");
      }

      if (!canManage) {
        throw new Error("Acesso negado.");
      }

      const payload: CreateUserRequest = {
        email,
        password,
        displayName,
        role,
        accessLevel: Number(accessLevel),
        dailyAnalysisLimit: Number(dailyAnalysisLimit),
        department: department || undefined
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel criar o usuario.");
      }

      setEmail("");
      setPassword("");
      setDisplayName("");
      setDepartment("");
      const refreshed = await fetchJson<UsersResponse>("/api/admin/users", idToken);
      setUsers(refreshed.users);
      setStatus("Usuario criado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na criacao.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile?.active) {
    return (
      <section className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
          Usuarios
        </p>
        <h1 className="mt-3 text-2xl font-bold text-cortex-ink">{status}</h1>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
              Administracao
            </p>
            <h1 className="mt-2 text-2xl font-bold text-cortex-ink">Usuarios e hierarquia</h1>
          </div>
          <p className="text-sm text-neutral-600">{status}</p>
        </div>
      </div>

      {canManage ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-cortex-line bg-white p-5 shadow-soft lg:grid-cols-2"
        >
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Nome
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Senha inicial
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Perfil
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as CreateUserRequest["role"])}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-3 text-sm"
            >
              {roleOptions.map((option) => (
                <option key={option.role} value={option.role}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Nivel de acesso
            <input
              type="number"
              min={1}
              max={100}
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Limite diario
            <input
              type="number"
              min={1}
              max={100}
              value={dailyAnalysisLimit}
              onChange={(event) => setDailyAnalysisLimit(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Departamento
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Criando..." : "Criar usuario"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
            Somente leitura
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Este perfil nao pode criar ou editar usuarios.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <article key={user.uid} className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cortex-forest">
                  {user.role} - nivel {user.accessLevel}
                </p>
                <h2 className="mt-1 text-lg font-bold text-cortex-ink">{user.displayName}</h2>
                <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>Limite diario: {user.dailyAnalysisLimit}</p>
                <p>Departamento: {user.department ?? "-"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
