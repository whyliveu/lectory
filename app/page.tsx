const demoLectures = [
  {
    discipline: "Философия науки",
    teacher: "Ирина Смирнова",
    lecture: "Научные революции и смена парадигм",
    date: "2026-03-11",
    description: "Разобрали идеи Томаса Куна и почему наука развивается рывками."
  },
  {
    discipline: "Культурология",
    teacher: "Алексей Борисов",
    lecture: "Миф как язык культуры",
    date: "2026-03-18",
    description: "Поговорили о мифе как системе смыслов и социальной памяти."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl gap-6 p-6">
      <aside className="w-96 rounded-xl2 border border-white/10 bg-panel/80 p-5 backdrop-blur">
        <h1 className="text-xl font-semibold">Lectory</h1>
        <p className="mt-1 text-sm text-muted">MVP базы лекций</p>

        <div className="mt-5 rounded-xl bg-panelSoft p-3">
          <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Поиск</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-bg/70 px-3 py-2 text-sm outline-none ring-accent placeholder:text-muted/70 focus:ring-2"
            placeholder="Дата, дисциплина или преподаватель"
            disabled
          />
        </div>

        <div className="mt-5 space-y-3">
          {demoLectures.map((item) => (
            <article key={item.lecture} className="rounded-xl border border-white/10 bg-panelSoft p-4">
              <h2 className="text-sm font-semibold">{item.discipline}</h2>
              <p className="text-xs text-muted">{item.teacher}</p>
              <div className="mt-2 rounded-lg bg-bg/50 p-3">
                <p className="text-sm">{item.lecture}</p>
                <p className="mt-1 text-xs text-muted">{item.date}</p>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <section className="flex-1 rounded-xl2 border border-white/10 bg-panel/70 p-8">
        <p className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
          Шаг 1 MVP
        </p>
        <h2 className="mt-4 text-3xl font-semibold">Каркас готов</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Мы подняли красивую стартовую страницу с тёмно-фиолетовым стилем. На следующем шаге добавим базу данных
          Supabase и формы для создания дисциплины и загрузки SRT.
        </p>
      </section>
    </main>
  );
}
