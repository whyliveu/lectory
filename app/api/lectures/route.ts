import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../lib/supabase";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function titleFromMarkdown(markdown: string, fallback: string) {
  const line = markdown.split(/\r?\n/).find((l) => l.trim().startsWith("#"));
  if (line) {
    const t = line.replace(/^#+\s*/, "").trim();
    if (t) return t.slice(0, 200);
  }
  return fallback;
}

function shortFromMarkdown(markdown: string) {
  const withoutFirstHeading = markdown.replace(/^#+\s+.+\n+/, "").trim();
  const para = withoutFirstHeading.split(/\n\n+/)[0]?.replace(/\s+/g, " ").trim() ?? "";
  return para.slice(0, 280) || null;
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const disciplineTitle = String(formData.get("disciplineTitle") ?? "").trim();
  const teacherName = String(formData.get("teacherName") ?? "").trim();
  const lectureDate = String(formData.get("lectureDate") ?? "").trim();
  const file = formData.get("file");

  if (!disciplineTitle || !teacherName || !lectureDate || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Заполните дисциплину, преподавателя, дату и прикрепите .md файл с конспектом." },
      { status: 400 }
    );
  }

  const fileName = file.name ?? "lecture.md";
  const lowerName = fileName.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  const isMarkdown =
    lowerName.endsWith(".md") || lowerName.endsWith(".markdown") || mime.includes("markdown") || mime === "text/plain";

  if (!isMarkdown) {
    return NextResponse.json({ error: "Нужен файл конспекта в Markdown (.md)." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой. Для MVP до 5 МБ." }, { status: 400 });
  }

  const markdownBody = (await file.text()).trim();
  if (!markdownBody) {
    return NextResponse.json({ error: "Файл пустой или не удалось прочитать текст." }, { status: 400 });
  }

  const baseTitle = fileName.replace(/\.(md|markdown)$/i, "").replace(/_/g, " ");
  const generatedTitle = titleFromMarkdown(markdownBody, baseTitle);
  const shortDescription = shortFromMarkdown(markdownBody);

  let lectureId = "";
  let stage = "start";

  try {
    stage = "find_discipline";
    const { data: foundDiscipline } = await supabase
      .from("disciplines")
      .select("id")
      .eq("title", disciplineTitle)
      .eq("teacher_name", teacherName)
      .maybeSingle();

    let disciplineId = foundDiscipline?.id ?? "";
    if (!disciplineId) {
      stage = "create_discipline";
      const { data: createdDiscipline, error: createDisciplineError } = await supabase
        .from("disciplines")
        .insert({
          title: disciplineTitle,
          teacher_name: teacherName
        })
        .select("id")
        .single();

      if (createDisciplineError || !createdDiscipline) {
        throw new Error(`Не удалось создать дисциплину: ${createDisciplineError?.message ?? "unknown error"}`);
      }
      disciplineId = createdDiscipline.id;
    }

    stage = "create_lecture";
    const { data: createdLecture, error: createLectureError } = await supabase
      .from("lectures")
      .insert({
        discipline_id: disciplineId,
        lecture_date: lectureDate,
        generated_title: generatedTitle,
        short_description: shortDescription,
        status: "uploaded",
        error_message: null
      })
      .select("id")
      .single();

    if (createLectureError || !createdLecture) {
      throw new Error(`Не удалось создать запись лекции: ${createLectureError?.message ?? "unknown error"}`);
    }

    lectureId = createdLecture.id;

    stage = "write_full_text_local";
    const relativeFilePath = path.join("data", "lecture-files", `${lectureId}.md`);
    const absoluteFilePath = path.join(process.cwd(), relativeFilePath);
    await mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await writeFile(absoluteFilePath, markdownBody, "utf-8");

    stage = "insert_file";
    const preview =
      markdownBody.length > 12000
        ? `${markdownBody.slice(0, 12000)}\n\n[Фрагмент в БД; полный текст в file_url.]`
        : markdownBody;

    const { error: fileError } = await supabase.from("lecture_files").insert({
      lecture_id: lectureId,
      file_name: fileName,
      file_type: "md",
      file_url: relativeFilePath.replaceAll("\\", "/"),
      raw_text: markdownBody,
      clean_text: preview
    });

    if (fileError) {
      stage = "insert_file_retry";
      const shortPreview = `${markdownBody.slice(0, 4000)}\n\n[Фрагмент из-за лимита размера.]`;
      const { error: retryError } = await supabase.from("lecture_files").insert({
        lecture_id: lectureId,
        file_name: fileName,
        file_type: "md",
        file_url: relativeFilePath.replaceAll("\\", "/"),
        raw_text: markdownBody.slice(0, 8000),
        clean_text: shortPreview
      });
      if (retryError) {
        throw new Error(`Не удалось сохранить файл: ${retryError.message}`);
      }
    }

    stage = "insert_summary";
    const { error: summaryError } = await supabase.from("lecture_summaries").insert({
      lecture_id: lectureId,
      full_summary: markdownBody,
      main_outline: "",
      key_points: [],
      tags: [],
      mentions: { books: [], authors: [], films: [], dates: [], terms: [], other: [] },
      interesting_notes: []
    });

    if (summaryError) {
      throw new Error(`Не удалось сохранить конспект: ${summaryError.message}`);
    }

    return NextResponse.json({ lectureId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка при создании лекции.";
    if (lectureId) {
      await supabase.from("lectures").update({ status: "error", error_message: errorMessage }).eq("id", lectureId);
    }
    console.error("[lectures:post] failed", { stage, error: errorMessage });

    return NextResponse.json(
      {
        error: `Ошибка на этапе "${stage}": ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
