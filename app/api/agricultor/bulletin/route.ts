import { NextResponse } from "next/server";

const DEFAULT_BACKEND_URL =
  process.env.GOES_AMBIENTAL_BASE_URL ?? "https://sgtr-goes-ambiental.vercel.app";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const municipioId = url.searchParams.get("municipioId")?.trim();
  const municipioNome = url.searchParams.get("municipioNome")?.trim() ?? "";

  if (!municipioId) {
    return NextResponse.json(
      { ok: false, error: "Informe municipioId." },
      { status: 400 },
    );
  }

  const backendUrl = new URL("/api/environmental-bulletins/latest", DEFAULT_BACKEND_URL);
  backendUrl.searchParams.set("municipioId", municipioId);
  if (municipioNome) backendUrl.searchParams.set("municipioNome", municipioNome);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(backendUrl, {
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Falha ao consultar o boletim do agricultor."
        : error instanceof Error
          ? error.message
          : "Falha ao consultar o boletim do agricultor.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

