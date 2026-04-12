"use client";

import { SidebarLectureItem } from "./SidebarLectureItem";

export type LectureRow = {
  id: string;
  title: string;
  dateLabel: string;
};

type Props = {
  discipline: string;
  teacher: string;
  lectures: LectureRow[];
};

/** Раскрывающийся блок по одной дисциплине; лекции внутри — от старых к новым по дате. */
export function DisciplineLecturesBlock({ discipline, teacher, lectures }: Props) {
  return (
    <details className="rounded-xl2 border border-white/10 bg-panelSoft open:shadow-inner">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 rounded-xl2 px-4 py-3.5 text-left marker:content-none [&::-webkit-details-marker]:hidden open:[&_.chev]:rotate-180">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text">{discipline}</h2>
          <p className="mt-0.5 text-xs text-muted">{teacher}</p>
        </div>
        <span className="chev shrink-0 text-muted transition" aria-hidden>
          ▼
        </span>
      </summary>
      <div className="space-y-2 border-t border-white/10 px-3 pb-3 pt-2">
        {lectures.map((lecture) => (
          <SidebarLectureItem key={lecture.id} lectureId={lecture.id} title={lecture.title} dateLabel={lecture.dateLabel} />
        ))}
      </div>
    </details>
  );
}
