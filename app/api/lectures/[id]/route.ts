import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../../lib/supabase";
import { unlink } from "node:fs/promises";
import path from "node:path";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const id = context.params.id;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action !== "publish") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const { error } = await supabase
    .from("lectures")
    .update({ status: "ready", error_message: null })
    .eq("id", id)
    .eq("status", "uploaded");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const id = context.params.id;

  const { data: fileRow } = await supabase.from("lecture_files").select("file_url").eq("lecture_id", id).maybeSingle();

  const { error } = await supabase.from("lectures").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = fileRow?.file_url;
  if (typeof url === "string" && url.startsWith("data/")) {
    try {
      await unlink(path.join(process.cwd(), url));
    } catch {
      // ignore missing file
    }
  }

  return NextResponse.json({ ok: true });
}
