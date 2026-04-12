"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  lectureId: string;
  status: string;
};

export function LectureDraftActions({ lectureId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (status !== "uploaded") return null;

  async function onSave() {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Не удалось сохранить.");
        setBusy(null);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMsg("Сетевая ошибка.");
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!window.confirm("Удалить эту лекцию без сохранения в списке?")) return;
    setBusy("delete");
    setMsg(null);
    try {
      const res = await fetch(`/api/lectures/${lectureId}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Не удалось удалить.");
        setBusy(null);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMsg("Сетевая ошибка.");
      setBusy(null);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
      <p className="text-sm text-text">
        Черновик: лекция ещё не в списке на главной. Нажми «Сохранить в список», чтобы она появилась в боковой панели, или «Удалить».
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={onSave}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {busy === "save" ? "Сохраняю…" : "Сохранить в список"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={onDelete}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-muted transition hover:bg-white/5 disabled:opacity-50"
        >
          {busy === "delete" ? "Удаляю…" : "Удалить"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-red-300">{msg}</p> : null}
    </div>
  );
}
