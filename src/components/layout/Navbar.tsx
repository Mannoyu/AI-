"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home, hint: "开始阅读" },
  { href: "/history", label: "历史", icon: History, hint: "学习记录" },
  { href: "/settings", label: "设置", icon: Settings, hint: "偏好与等级" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,255,65,0.07)] px-4 py-3"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <Link
        href="/"
        className="flex items-center gap-3 rounded-md px-1 py-0.5 text-primary/70 transition-colors hover:text-primary"
        aria-label="返回首页"
      >
        <div className="leading-none">
          <div className="text-[11px] uppercase tracking-[0.24em] text-primary/45">
            ENG-READER
          </div>
          <div className="mt-1 text-sm font-semibold text-text">
            English Reading Assistant
          </div>
        </div>
        <span className="hidden text-[11px] text-text-light md:inline">
          OCR / 阅读 / 跟读
        </span>
      </Link>

      <nav className="flex items-center gap-1" aria-label="主导航">
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
              aria-current={isActive ? "page" : undefined}
              className={`group flex min-h-11 items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-terminal-sm"
                  : "text-text-muted hover:bg-surface-alt hover:text-text"
              }`}
              style={{ borderRadius: "var(--radius-terminal)" }}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:flex sm:flex-col sm:items-start sm:leading-tight">
                <span>{item.label}</span>
                <span
                  className={`text-[10px] ${
                    isActive ? "text-primary/70" : "text-text-light"
                  }`}
                >
                  {item.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
