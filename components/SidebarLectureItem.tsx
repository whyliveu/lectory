"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type Props = {
  lectureId: string;
  title: string;
  /** Уже отформатированная дата, напр. «9 апреля 2026 года» */
  dateLabel: string;
};

export function SidebarLectureItem({ lectureId, title, dateLabel }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function openAt(clientX: number, clientY: number) {
    const pad = 8;
    const x = Math.min(clientX, typeof window !== "undefined" ? window.innerWidth - 180 : clientX);
    const y = Math.min(clientY, typeof window !== "undefined" ? window.innerHeight - 100 : clientY);
    setCoords({ x: Math.max(pad, x), y: Math.max(pad, y) });
    setMenuOpen(true);
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openAt(e.clientX, e.clientY);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    longPressFired.current = false;
    clearLongPress();
    const cx = e.clientX;
    const cy = e.clientY;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      longPressFired.current = true;
      openAt(cx, cy);
    }, 550);
  }

  function onPointerUp() {
    clearLongPress();
  }

  function onLinkClick(e: React.MouseEvent) {
    if (longPressFired.current) {
      e.preventDefault();
      longPressFired.current = false;
    }
  }

  async function onDelete() {
    if (!window.confirm(`Удалить лекцию «${title}»?`)) {
      setMenuOpen(false);
      return;
    }
    const res = await fetch(`/api/lectures/${lectureId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Не удалось удалить.");
      setMenuOpen(false);
      return;
    }
    setMenuOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" onContextMenu={onContextMenu}>
      <Link
        href={`/lectures/${lectureId}`}
        title="ПКМ или долгое нажатие — меню «Удалить»"
        onClick={onLinkClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        className="block min-h-[48px] rounded-lg bg-bg/50 px-3 py-3.5 transition hover:bg-bg/80 active:bg-bg/90"
      >
        <p className="text-sm font-medium leading-snug text-text">{title}</p>
        <p className="mt-1.5 text-xs text-muted">{dateLabel}</p>
      </Link>

      {menuOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Закрыть меню" onClick={closeMenu} />
          <div
            className="fixed z-50 min-w-[min(100vw-2rem,200px)] rounded-lg border border-white/15 bg-panel py-1 shadow-xl"
            style={{ left: coords.x, top: coords.y }}
          >
            <button
              type="button"
              onClick={onDelete}
              className="min-h-[44px] w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-white/5"
            >
              Удалить
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
