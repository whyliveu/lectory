import Link from "next/link";
import nextDynamic from "next/dynamic";
import { getSupabaseClient } from "../../../lib/supabase";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { LectureDraftActions } from "../../../components/LectureDraftActions";

const LectureMarkdown = nextDynamic(
  () =>
    import("../../../components/LectureMarkdown").then((mod) => ({
      default: mod.LectureMarkdown,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="lecture-markdown lecture-markdown--reader lecture-markdown--reader-skeleton text-muted">
        Загрузка конспекта…
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LecturePageProps = {
  params: {
    id: string;
  };
};

type SummaryRow = {
  full_summary?: string | null;
  main_outline?: string | null;
  key_points?: unknown;
  interesting_notes?: unknown;
} | null;

function buildPrimaryMarkdown(summary: SummaryRow): string {
  const full = (summary?.full_summary ?? "").trim();
  if (full) return full;

  const parts: string[] = [];
  const outline = (summary?.main_outline ?? "").trim();
  if (outline) {
    parts.push(`## Канва лекции\n\n${outline}`);
  }
  const keyPoints = Array.isArray(summary?.key_points)
    ? (summary.key_points as string[]).filter((x) => typeof x === "string" && x.trim())
    : [];
  if (keyPoints.length) {
    parts.push(`## Ключевые тезисы\n\n${keyPoints.map((p) => `- ${p}`).join("\n")}`);
  }
  const notes = Array.isArray(summary?.interesting_notes)
    ? (summary.interesting_notes as string[]).filter((x) => typeof x === "string" && x.trim())
    : [];
  if (notes.length) {
    parts.push(`## Заметки\n\n${notes.map((n) => `- ${n}`).join("\n")}`);
  }
  const legacy = parts.join("\n\n").trim();
  if (legacy) return legacy;

  return "*Контент лекции пока не добавлен. Загрузите готовый конспект в формате Markdown на странице «Новая лекция».*";
}

export default async function LecturePage({ params }: LecturePageProps) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl p-6">
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm">Supabase не настроен в .env.local.</p>
      </main>
    );
  }

  const { data: lecture, error } = await supabase
    .from("lectures")
    .select(
      "id,lecture_date,generated_title,short_description,status,error_message,disciplines(title,teacher_name),lecture_summaries(full_summary,main_outline,key_points,interesting_notes),lecture_files(raw_text,clean_text,file_url,file_name,file_type)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !lecture) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl p-6">
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm">Лекция не найдена или ошибка загрузки.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
          Вернуться на главную
        </Link>
      </main>
    );
  }

  const summary = Array.isArray(lecture.lecture_summaries) ? lecture.lecture_summaries[0] : lecture.lecture_summaries;
  const file = Array.isArray(lecture.lecture_files) ? lecture.lecture_files[0] : lecture.lecture_files;

  let fullTextFromFileUrl = "";
  const localPath = typeof file?.file_url === "string" ? file.file_url : "";
  if (localPath && localPath.startsWith("data/")) {
    try {
      const absolute = path.join(process.cwd(), localPath);
      fullTextFromFileUrl = await readFile(absolute, "utf-8");
    } catch {
      fullTextFromFileUrl = "";
    }
  }

  let primaryMarkdown = buildPrimaryMarkdown(summary as SummaryRow);
  const summaryFullEmpty = !(summary as SummaryRow)?.full_summary?.trim();
  if (summaryFullEmpty && fullTextFromFileUrl.trim()) {
    primaryMarkdown = fullTextFromFileUrl.trim();
  }

  const rawForCollapsible =
    (typeof file?.raw_text === "string" && file.raw_text.trim()) ||
    (typeof file?.clean_text === "string" && file.clean_text.trim()) ||
    fullTextFromFileUrl.trim() ||
    "";

  const discipline = (lecture.disciplines as { title?: string; teacher_name?: string } | null)?.title ?? "—";
  const teacher = (lecture.disciplines as { title?: string; teacher_name?: string } | null)?.teacher_name ?? "—";

  return (
    <main className="min-h-screen w-full pb-20 pt-6 sm:pt-8 md:pt-10">
      <div className="mx-auto w-full max-w-[720px] px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="rounded-xl2 border border-white/10 bg-panel/80 px-5 py-8 backdrop-blur sm:px-7 sm:py-9 md:px-9 md:py-11">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-sm text-accent hover:underline">
              На главную
            </Link>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted">Статус: {lecture.status}</span>
          </div>

          {lecture.error_message ? (
            <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">{lecture.error_message}</p>
          ) : null}

          <LectureDraftActions lectureId={lecture.id as string} status={lecture.status as string} />

          <header className="mb-12 border-b border-white/10 pb-10 sm:mb-14 sm:pb-12">
            <h1 className="text-[clamp(1.5rem,4.5vw,2rem)] font-bold leading-tight tracking-tight text-text sm:text-[clamp(1.625rem,3.5vw,2.25rem)]">
              {lecture.generated_title}
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-sm">
              <span className="text-text/90">{discipline}</span>
              {" • "}
              <span className="text-text/90">{teacher}</span>
              {" • "}
              <span>{lecture.lecture_date}</span>
            </p>
            {lecture.short_description ? (
              <p className="mt-4 max-w-none text-[0.9375rem] leading-relaxed text-muted sm:text-sm">{lecture.short_description}</p>
            ) : null}
          </header>

          <section aria-label="Конспект лекции">
            <h2 className="sr-only">Конспект лекции</h2>
            <LectureMarkdown markdown={primaryMarkdown} />
          </section>

          {rawForCollapsible ? (
            <details className="mt-12 rounded-lg border border-white/10 bg-panelSoft p-4 sm:mt-14">
            <summary className="cursor-pointer text-sm font-semibold text-text">
              Исходный текст загрузки (транскрипт / файл)
            </summary>
            <p className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-muted">{rawForCollapsible}</p>
          </details>
        ) : null}
        </div>
      </div>
    </main>
  );
}
