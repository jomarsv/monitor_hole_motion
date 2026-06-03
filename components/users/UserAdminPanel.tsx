"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CreateUserRequest, UserProfile } from "@/lib/types/auth";
import { fetchJson } from "@/lib/utils/api";
import { getRoleConfig, roleOptions } from "@/lib/types/hierarchy";

type UsersResponse = {
  users: UserProfile[];
};

type BusyAction = "limit" | "history" | "delete" | null;

export function UserAdminPanel() {
  const { profile, idToken, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const [busyByUser, setBusyByUser] = useState<Record<string, BusyAction>>({});
  const [status, setStatus] = useState("Carregando usuários...");
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
  const canDeleteAndEdit = profile?.role === "admin";
  const roleConfig = useMemo(() => getRoleConfig(role), [role]);

  async function reloadUsers(token = idToken) {
    if (!token) return;

    const response = await fetchJson<UsersResponse>("/api/admin/users", token);
    setUsers(response.users);
    setLimitDrafts(
      Object.fromEntries(response.users.map((user) => [user.uid, String(user.dailyAnalysisLimit)]))
    );
    setStatus(response.users.length ? "Usuários carregados." : "Nenhum usuário cadastrado.");
  }

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      if (!profile || !idToken) {
        if (active) {
          setUsers([]);
          setStatus("Entre para gerenciar usuários.");
        }
        return;
      }

      if (!canManage) {
        if (active) {
          setUsers([]);
          setStatus("Seu perfil não pode gerenciar usuários.");
        }
        return;
      }

      try {
        const response = await fetchJson<UsersResponse>("/api/admin/users", idToken);
        if (!active) return;

        setUsers(response.users);
        setLimitDrafts(
          Object.fromEntries(response.users.map((user) => [user.uid, String(user.dailyAnalysisLimit)]))
        );
        setStatus(response.users.length ? "Usuários carregados." : "Nenhum usuário cadastrado.");
      } catch {
        if (!active) return;

        setUsers([]);
        setStatus("Não foi possível carregar usuários.");
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

  function setBusyAction(uid: string, action: BusyAction) {
    setBusyByUser((current) => ({
      ...current,
      [uid]: action
    }));
  }

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
        throw new Error(data.error ?? "Não foi possível criar o usuário.");
      }

      setEmail("");
      setPassword("");
      setDisplayName("");
      setDepartment("");
      await reloadUsers(idToken);
      setStatus("Usuário criado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na criacao.");
    } finally {
      setBusy(false);
    }
  }

  async function updateLimit(uid: string) {
    if (!profile || !idToken) {
      setError("Entre com um perfil autorizado.");
      return;
    }

    if (!canDeleteAndEdit) {
      setError("Acesso negado.");
      return;
    }

    const nextLimit = Number(limitDrafts[uid]);
    if (!Number.isFinite(nextLimit) || nextLimit < 1) {
      setError("Limite diário inválido.");
      return;
    }

    try {
      setError("");
      setBusyAction(uid, "limit");
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ dailyAnalysisLimit: Math.floor(nextLimit) })
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar o limite diário.");
      }

      await reloadUsers(idToken);
      setStatus("Limite diário atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na atualização.");
    } finally {
      setBusyAction(uid, null);
    }
  }

  async function deleteHistory(uid: string, displayName: string) {
    if (!profile || !idToken) {
      setError("Entre com um perfil autorizado.");
      return;
    }

    if (!canDeleteAndEdit) {
      setError("Acesso negado.");
      return;
    }

    if (!window.confirm(`Excluir todo o histórico de ${displayName}?`)) {
      return;
    }

    try {
      setError("");
      setBusyAction(uid, "history");
      const response = await fetch(`/api/admin/users/${uid}/analyses`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível excluir o histórico.");
      }

      setStatus(`Histórico de ${displayName} removido.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir histórico.");
    } finally {
      setBusyAction(uid, null);
    }
  }

  async function deleteUser(uid: string, displayName: string) {
    if (!profile || !idToken) {
      setError("Entre com um perfil autorizado.");
      return;
    }

    if (!canDeleteAndEdit) {
      setError("Acesso negado.");
      return;
    }

    if (!window.confirm(`Excluir a conta de ${displayName}?`)) {
      return;
    }

    try {
      setError("");
      setBusyAction(uid, "delete");
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível excluir a conta.");
      }

      await reloadUsers(idToken);
      setStatus(`Conta de ${displayName} removida.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir conta.");
    } finally {
      setBusyAction(uid, null);
    }
  }

  if (!profile?.active) {
    return (
      <section className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">Usuários</p>
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
              Administração
            </p>
            <h1 className="mt-2 text-2xl font-bold text-cortex-ink">Usuários e hierarquia</h1>
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
            Nível de acesso
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
            Limite diário
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
              {busy ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
            Somente leitura
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Este perfil não pode criar ou editar usuários.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <article key={user.uid} className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cortex-forest">
                  {user.role} - nível {user.accessLevel}
                </p>
                <h2 className="mt-1 text-lg font-bold text-cortex-ink">{user.displayName}</h2>
                <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
                <p className="mt-1 text-xs text-neutral-500">Departamento: {user.department ?? "-"}</p>
              </div>

              <div className="grid gap-3 lg:min-w-80">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cortex-forest">
                  Limite diário
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={limitDrafts[user.uid] ?? String(user.dailyAnalysisLimit)}
                    onChange={(event) =>
                      setLimitDrafts((current) => ({
                        ...current,
                        [user.uid]: event.target.value
                      }))
                    }
                    disabled={!canDeleteAndEdit}
                    className="h-11 rounded-lg border border-cortex-line bg-cortex-cloud px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateLimit(user.uid)}
                    disabled={!canDeleteAndEdit || busyByUser[user.uid] === "limit"}
                    className="inline-flex min-h-10 items-center rounded-lg bg-cortex-forest px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyByUser[user.uid] === "limit" ? "Salvando..." : "Salvar limite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteHistory(user.uid, user.displayName)}
                    disabled={!canDeleteAndEdit || busyByUser[user.uid] === "history"}
                    className="inline-flex min-h-10 items-center rounded-lg border border-cortex-line bg-white px-3 py-2 text-xs font-bold text-cortex-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyByUser[user.uid] === "history" ? "Excluindo..." : "Excluir histórico"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(user.uid, user.displayName)}
                    disabled={!canDeleteAndEdit || busyByUser[user.uid] === "delete"}
                    className="inline-flex min-h-10 items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyByUser[user.uid] === "delete" ? "Excluindo..." : "Excluir conta"}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
