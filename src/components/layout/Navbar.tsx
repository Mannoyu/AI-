"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Settings, Home } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/history", label: "历史", icon: History },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="relative z-20 flex items-center justify-between px-4 py-2.5 border-b border-[rgba(0,255,65,0.07)]"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {/* Left — terminal title */}
      <Link
        href="/"
        className="flex items-center gap-2 text-primary/50 hover:text-primary transition-colors text-xs tracking-widest uppercase"
      >
        <span className="text-primary/25">[</span>
        ENG-READER
        <span className="text-primary/25">]</span>
      </Link>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Right — Nav Links */}
      <nav className="flex items-center gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text hover:bg-surface-alt"
              }`}
              style={{ borderRadius: "var(--radius-terminal)" }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
