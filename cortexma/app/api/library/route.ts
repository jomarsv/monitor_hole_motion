import { NextResponse } from "next/server";
import { requireVerifiedUser, extractBearerToken, getTokenAccessLevel, getTokenRole } from "@/lib/server/auth";
import { createLibraryItem, getSignedLibraryUrl, listAccessibleLibraryItems } from "@/lib/server/library";

export const runtime = "nodejs";

async function requireLibraryAccess(request: Request) {
  const user = await requireVerifiedUser(await extractBearerToken(request.headers));
  const role = getTokenRole(user.tokenClaims) || user.profile.role;

  return {
    user,
    role,
    accessLevel: getTokenAccessLevel(user.tokenClaims) || user.profile.accessLevel,
    canWrite: role === "admin" || role === "manager" || role === "analyst"
  };
}

export async function GET(request: Request) {
  try {
    const access = await requireLibraryAccess(request);
    const items = await listAccessibleLibraryItems({
      question: "",
      accessLevel: access.accessLevel,
      maxItems: 100
    });

    const itemsWithUrl = await Promise.all(
      items.map(async (item) => ({
        ...item,
        downloadUrl: await getSignedLibraryUrl(item)
      }))
    );

    return NextResponse.json({ items: itemsWithUrl, canWrite: access.canWrite });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao autorizado.";
    const status =
      message.includes("Acesso negado")
        ? 403
        : message.includes("Nao autenticado") || message.includes("Conta desativada")
          ? 401
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireLibraryAccess(request);
    if (!access.canWrite) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
    }

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const tags = String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const accessLevel = Number(formData.get("accessLevel") ?? access.accessLevel);
    const excerpt = String(formData.get("excerpt") ?? "").trim() || undefined;

    if (!title || !summary) {
      return NextResponse.json({ error: "Titulo e resumo sao obrigatorios." }, { status: 400 });
    }

    if (!Number.isFinite(accessLevel) || accessLevel <= 0) {
      return NextResponse.json({ error: "Nivel de acesso invalido." }, { status: 400 });
    }

    if (accessLevel > access.accessLevel) {
      return NextResponse.json(
        {
          error:
            "O nivel da biblioteca nao pode ser maior que o nivel de acesso do usuario."
        },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const item = await createLibraryItem({
      title,
      description: description || summary,
      tags,
      accessLevel,
      ownerUid: access.user.uid,
      ownerName: access.user.profile.displayName,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      storageBuffer: buffer,
      summary,
      excerpt,
      byteSize: buffer.byteLength
    });

    const downloadUrl = await getSignedLibraryUrl(item);
    return NextResponse.json({ item: { ...item, downloadUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel enviar o arquivo.";
    const status =
      message.includes("Acesso negado")
        ? 403
        : message.includes("Nao autenticado") || message.includes("Conta desativada")
          ? 401
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
