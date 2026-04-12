import { getSupabaseClient } from "../lib/supabase";
import Link from "next/link";
import { DisciplineLecturesBlock } from "../components/DisciplineLecturesBlock";
import { formatLectureDateRu } from "../lib/format-date-ru";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SidebarLecture = {
  id: string;
  title: string;
  date: string;
};

type SidebarGroup = {
  id: string;
  discipline: string;
  teacher: string;
  lectures: SidebarLecture[];
};

const demoLectures: SidebarGroup[] = [
  {
    id: "demo-1",
    discipline: "Философия науки",
    teacher: "Ирина Смирнова",
    lectures: [
      {
        id: "demo-1-lecture-1",
        title: "Научные революции и смена парадигм",
        date: "2026-03-11"
      }
    ]
  },
  {
    id: "demo-2",
    discipline: "Культурология",
    teacher: "Алексей Борисов",
    lectures: [
      {
        id: "demo-2-lecture-1",
        title: "Миф как язык культуры",
        date: "2026-03-18"
      }
    ]
  }
];

async function getSidebarData(): Promise<{ groups: SidebarGroup[]; sourceLabel: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      groups: demoLectures,
      sourceLabel: "Демо-данные (нужно проверить .env.local)"
    };
  }

  const { data: rows, error } = await supabase
    .from("lectures")
    .select("id, generated_title, lecture_date, disciplines ( id, title, teacher_name )")
    .eq("status", "ready");

  if (error || !rows) {
    return {
      groups: demoLectures,
      sourceLabel: "Демо-данные (ошибка загрузки списка лекций)"
    };
  }

  const map = new Map<string, SidebarGroup>();

  for (const row of rows) {
    const raw = row.disciplines as { id: string; title: string; teacher_name: string } | { id: string; title: string; teacher_name: string }[] | null;
    const d = Array.isArray(raw) ? raw[0] : raw;
    if (!d?.id) continue;
    if (!map.has(d.id)) {
      map.set(d.id, {
        id: d.id,
        discipline: d.title,
        teacher: d.teacher_name,
        lectures: []
      });
    }
    map.get(d.id)!.lectures.push({
      id: row.id as string,
      title: (row.generated_title as string) ?? "Без названия",
      date: row.lecture_date as string
    });
  }

  for (const g of map.values()) {
    g.lectures.sort((a, b) => a.date.localeCompare(b.date));
  }

  const groups = [...map.values()].sort((a, b) => a.discipline.localeCompare(b.discipline, "ru"));

  return {
    groups,
    sourceLabel: "Данные из Supabase (только сохранённые в список)"
  };
}

export default async function HomePage() {
  const sidebarData = await getSidebarData();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-6">
      {/* На мобильных сначала действия; на lg — колонка справа */}
      <section className="order-1 flex w-full flex-col rounded-xl2 border border-white/10 bg-panel/70 p-5 sm:p-8 lg:order-2 lg:flex-1">
        <div className="flex flex-col gap-4">
          <Link
            href="/new"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-accent/90 sm:w-auto sm:min-w-[200px]"
          >
            Добавить лекцию
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-lg border border-white/15 bg-panelSoft/50 px-4 py-3 text-center text-base font-semibold text-muted opacity-70 sm:w-auto sm:min-w-[200px]"
          >
            Подготовка к экзамену
          </button>
        </div>
      </section>

      <aside className="order-2 flex max-h-[min(70vh,32rem)] w-full shrink-0 flex-col rounded-xl2 border border-white/10 bg-panel/80 p-4 backdrop-blur sm:p-5 lg:order-1 lg:max-h-none lg:max-w-sm lg:w-96">
        <h1 className="text-xl font-semibold">Lectory</h1>
        <p className="mt-1 text-sm text-muted">База лекций</p>
        <p className="mt-2 text-xs text-accent">{sidebarData.sourceLabel}</p>

        <div className="mt-5 rounded-xl bg-panelSoft p-3">
          <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Поиск</label>
          <input
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-bg/70 px-3 py-2 text-base outline-none ring-accent placeholder:text-muted/70 focus:ring-2 sm:text-sm"
            placeholder="Дата, дисциплина или преподаватель"
            disabled
          />
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {sidebarData.groups.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-panelSoft p-4 text-sm leading-relaxed text-muted">
              Пока нет лекций в списке. Создай лекцию и нажми «Сохранить в список» на её странице.
            </p>
          ) : (
            sidebarData.groups.map((item) => (
              <DisciplineLecturesBlock
                key={item.id}
                discipline={item.discipline}
                teacher={item.teacher}
                lectures={item.lectures.map((lecture) => ({
                  id: lecture.id,
                  title: lecture.title,
                  dateLabel: formatLectureDateRu(lecture.date)
                }))}
              />
            ))
          )}
        </div>
      </aside>
    </main>
  );
}
