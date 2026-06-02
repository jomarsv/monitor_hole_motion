"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { LibraryItem } from "@/lib/types/library";
import { fetchJson } from "@/lib/utils/api";

type LibraryResponse = {
  items: Array<LibraryItem & { downloadUrl: string }>;
  canWrite: boolean;
};

function formatFileSize(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryManager() {
  const { profile, idToken, loading } = useAuth();
  const [items, setItems] = useState<Array<LibraryItem & { downloadUrl: string }>>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [status, setStatus] = useState("Carregando biblioteca...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [accessLevel, setAccessLevel] = useState("20");

  const maxAllowed = useMemo(() => profile?.accessLevel ?? 20, [profile?.accessLevel]);

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      if (!profile || !idToken) {
        if (active) {
          setItems([]);
          setStatus("Entre com seu usuario para acessar a biblioteca.");
        }
        return;
      }

      try {
        const response = await fetchJson<LibraryResponse>("/api/library", idToken);

        if (!active) {
          return;
        }

        setItems(response.items);
        setCanWrite(response.canWrite);
        setStatus(response.items.length ? "Biblioteca carregada." : "Nenhum arquivo cadastrado.");
      } catch {
        if (!active) {
          return;
        }

        setItems([]);
        setStatus("Nao foi possivel carregar a biblioteca autenticada.");
      }
    }

    if (!loading) {
      loadLibrary();
    }

    return () => {
      active = false;
    };
  }, [idToken, loading, profile]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (!profile || !idToken) {
        throw new Error("Entre com seu usuario para enviar arquivos.");
      }

      if (!selectedFile) {
        throw new Error("Selecione um arquivo.");
      }

      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("title", title);
      formData.set("description", description);
      formData.set("summary", summary);
      formData.set("excerpt", excerpt);
      formData.set("tags", tags);
      formData.set("accessLevel", accessLevel);

      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: formData
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Nao foi possivel enviar o arquivo.");
      }

      setTitle("");
      setDescription("");
      setSummary("");
      setExcerpt("");
      setTags("");
      setAccessLevel(String(profile.accessLevel));
      setSelectedFile(null);
      const refreshed = await fetchJson<LibraryResponse>("/api/library", idToken);
      setItems(refreshed.items);
      setCanWrite(refreshed.canWrite);
      setStatus("Arquivo salvo na biblioteca privada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile?.active) {
    return (
      <section className="rounded-lg border border-cortex-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-forest">
          Biblioteca
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
              Biblioteca privada
            </p>
            <h1 className="mt-2 text-2xl font-bold text-cortex-ink">Arquivos de conhecimento</h1>
          </div>
          <p className="text-sm text-neutral-600">{status}</p>
        </div>
      </div>

      {canWrite ? (
        <form
          onSubmit={handleUpload}
          className="grid gap-4 rounded-lg border border-cortex-line bg-white p-5 shadow-soft lg:grid-cols-2"
        >
          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Arquivo
            <input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Titulo
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink">
            Nivel de acesso
            <input
              type="number"
              min={1}
              max={maxAllowed}
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value)}
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Descricao
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Resumo para IA
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-28 rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Trecho relevante
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="min-h-24 rounded-lg border border-cortex-line bg-cortex-cloud px-4 py-3 text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-cortex-ink lg:col-span-2">
            Tags separadas por virgula
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="territorio, saude, infraestrutura"
              className="h-12 rounded-lg border border-cortex-line bg-cortex-cloud px-4 text-sm"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 lg:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cortex-forest px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Enviando..." : "Salvar arquivo"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cortex-gold">
            Acesso somente leitura
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Este perfil pode consultar a biblioteca, mas nao enviar novos arquivos.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-cortex-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cortex-forest">
                  Nivel {item.accessLevel}
                </p>
                <h2 className="mt-1 text-lg font-bold text-cortex-ink">{item.title}</h2>
              </div>
              <a
                href={item.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center rounded-lg border border-cortex-line bg-white px-3 py-2 text-sm font-bold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river"
              >
                Baixar
              </a>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-700">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span>Arquivo: {item.fileName}</span>
              <span>•</span>
              <span>{formatFileSize(item.byteSize)}</span>
              <span>•</span>
              <span>Autor: {item.ownerName}</span>
            </div>
            {item.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cortex-line bg-cortex-cloud px-3 py-1 text-xs font-semibold text-cortex-ink"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
