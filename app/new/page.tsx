"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { presetDisciplines, presetTeachers } from "../../lib/schedule-presets";

export default function NewLecturePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [disciplineTitle, setDisciplineTitle] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatusText("Выбери файл .md.");
      return;
    }

    setIsSubmitting(true);
    setStatusText("Сохраняем лекцию…");

    const formData = new FormData();
    formData.set("disciplineTitle", disciplineTitle);
    formData.set("teacherName", teacherName);
    formData.set("lectureDate", lectureDate);
    formData.set("file", file);

    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { lectureId?: string; error?: string };

      if (!response.ok || !payload.lectureId) {
        setStatusText(payload.error ?? "Ошибка создания лекции.");
        setIsSubmitting(false);
        return;
      }

      setStatusText("Готово! На странице лекции нажми «Сохранить в список», чтобы она появилась на главной.");
      window.location.href = `/lectures/${payload.lectureId}`;
    } catch {
      setStatusText("Сетевая ошибка. Проверь интернет и повтори.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:p-6">
      <div className="rounded-xl2 border border-white/10 bg-panel/80 p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold sm:text-2xl">Новая лекция</h1>
          <Link href="/" className="min-h-[44px] inline-flex items-center text-sm text-accent hover:underline">
            На главную
          </Link>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm text-muted">Дисциплина</label>
            <input
              required
              list="discipline-options"
              value={disciplineTitle}
              onChange={(event) => setDisciplineTitle(event.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-white/10 bg-bg/70 px-3 py-3 text-base outline-none ring-accent focus:ring-2 sm:text-sm"
              placeholder="Например: История философии"
            />
            <datalist id="discipline-options">
              {presetDisciplines.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-muted">Начни вводить название и выбери из подсказок.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">Преподаватель</label>
            <input
              required
              list="teacher-options"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-white/10 bg-bg/70 px-3 py-3 text-base outline-none ring-accent focus:ring-2 sm:text-sm"
              placeholder="Например: Анна Петрова"
            />
            <datalist id="teacher-options">
              {presetTeachers.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-muted">Начни вводить фамилию и выбери нужного преподавателя.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">Дата лекции</label>
            <input
              required
              type="date"
              value={lectureDate}
              onChange={(event) => setLectureDate(event.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-white/10 bg-bg/70 px-3 py-3 text-base outline-none ring-accent focus:ring-2 sm:text-sm"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm text-muted">Загрузить лекцию</span>
            <input
              ref={fileInputRef}
              required
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[48px] w-full rounded-lg border border-white/15 bg-bg/70 px-4 py-3 text-base font-medium text-text transition hover:bg-bg/90 sm:text-sm"
            >
              Выбор файла
            </button>
            {file ? <p className="mt-2 break-all text-sm text-muted">{file.name}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {isSubmitting ? "Обрабатываем..." : "Создать лекцию"}
          </button>
        </form>

        {statusText ? (
          <p className="mt-4 rounded-lg border border-white/10 bg-panelSoft p-3 text-sm leading-relaxed text-muted">{statusText}</p>
        ) : null}
      </div>
    </main>
  );
}
