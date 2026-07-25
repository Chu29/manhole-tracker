"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname.startsWith(href);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col justify-between border-r border-ink-700 bg-ink-900/80 px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg font-700 text-mist">
            Manhole Tracker
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-caution">
            Admin Console
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/manholes"
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive("/manholes") && pathname === "/manholes"
                ? "bg-ink-800 text-mist"
                : "text-haze hover:bg-ink-800 hover:text-mist"
            }`}
          >
            Manholes
          </Link>
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="rounded px-3 py-2 text-left text-sm text-haze hover:bg-ink-800 hover:text-mist"
      >
        Sign out
      </button>
    </aside>
  );
}
