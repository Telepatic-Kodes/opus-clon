import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface HookVariant {
  id: "A" | "B" | "C";
  hook: string;        // Texto del hook (1-2 oraciones)
  overlayText: string; // Texto corto para overlay en video (max 8 palabras)
  style: string;       // e.g. "PREGUNTA RETÓRICA" | "DATO SORPRENDENTE" | "CONTROVERSIA"
  emoji: string;       // Representativo del estilo
}

interface GenerateHooksBody {
  clipId: string;
  title: string;
  transcript: string;
  reason: string;
  hook: string;
}

function isValidBody(body: unknown): body is GenerateHooksBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.clipId === "string" &&
    typeof b.title === "string" &&
    typeof b.transcript === "string" &&
    typeof b.reason === "string" &&
    typeof b.hook === "string"
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Body must contain: clipId, title, transcript, reason, hook (all strings)" },
      { status: 400 }
    );
  }

  const { title, transcript, reason, hook: currentHook } = body;

  const prompt = `Eres un experto en contenido viral para redes sociales.

Dado este clip de video:
- Título: "${title}"
- Razón viral: "${reason}"
- Hook actual: "${currentHook}"
- Transcript: "${transcript?.slice(0, 500)}"

Genera EXACTAMENTE 3 variantes de hook de apertura diferentes, en español, para los primeros 3 segundos del video.
Cada variante debe usar un estilo DIFERENTE.

Responde SOLO con este JSON (sin markdown):
[
  { "id": "A", "hook": "texto del hook...", "overlayText": "max 8 palabras", "style": "PREGUNTA RETÓRICA", "emoji": "❓" },
  { "id": "B", "hook": "texto del hook...", "overlayText": "max 8 palabras", "style": "DATO SORPRENDENTE", "emoji": "🤯" },
  { "id": "C", "hook": "texto del hook...", "overlayText": "max 8 palabras", "style": "CONTROVERSIA", "emoji": "🔥" }
]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";
  let variants: HookVariant[];
  try {
    variants = JSON.parse(raw) as HookVariant[];
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    variants = match ? (JSON.parse(match[0]) as HookVariant[]) : [];
  }

  return NextResponse.json({ variants });
}
