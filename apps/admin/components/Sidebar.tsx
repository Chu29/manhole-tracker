"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { MapIcon, UsersIcon, ClipboardIcon, SignOutIcon } from "./Icons";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname.startsWith(href);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col justify-between border-r border-white/10 bg-ink-900/90 px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-bold text-white">
            Manhole Tracker
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-sky-400">
            Admin Console
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/manholes"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/manholes")
                ? "bg-sky-500/15 text-white border border-sky-500/25"
                : "text-haze hover:bg-ink-800 hover:text-white"
            }`}
          >
            <MapIcon className="h-4 w-4 text-sky-400" /> Manholes & Map
          </Link>
          <Link
            href="/technicians"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/technicians")
                ? "bg-sky-500/15 text-white border border-sky-500/25"
                : "text-haze hover:bg-ink-800 hover:text-white"
            }`}
          >
            <UsersIcon className="h-4 w-4 text-sky-400" /> Technicians
          </Link>
          <Link
            href="/inspections"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/inspections")
                ? "bg-sky-500/15 text-white border border-sky-500/25"
                : "text-haze hover:bg-ink-800 hover:text-white"
            }`}
          >
            <ClipboardIcon className="h-4 w-4 text-sky-400" /> Inspection Logs
          </Link>
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10 transition-colors"
      >
        <SignOutIcon className="h-4 w-4 text-rose-400" /> Sign out
      </button>
    </aside>
  );
}
