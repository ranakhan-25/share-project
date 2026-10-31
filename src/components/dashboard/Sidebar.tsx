"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronsLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Logo, LogoMark } from "@/components/site/Logo";
import { sidebarMenu, type MenuItem } from "./sidebar-data";

function Item({ item, collapsed, onNavigate }: { item: MenuItem; collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasChildren = !!item.children?.length;
  const childActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;
  const selfActive = item.href ? (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)) : false;
  const active = selfActive || childActive;
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const base = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
  } ${collapsed ? "justify-center" : ""}`;

  const inner = (
    <>
      {active && <motion.span layoutId="side-active" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400" />}
      <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-emerald-300" : ""}`} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{t(item.label)}</span>
          {item.badge && <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">{item.badge}</span>}
          {hasChildren && <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
        </>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl ring-1 ring-white/10 transition group-hover:opacity-100">
          {t(item.label)}
        </span>
      )}
    </>
  );

  return (
    <li>
      {hasChildren ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className={base}>{inner}</button>
      ) : (
        <Link href={item.href ?? "#"} onClick={onNavigate} className={base}>{inner}</Link>
      )}
      <AnimatePresence initial={false}>
        {hasChildren && open && !collapsed && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-[26px] mt-1 space-y-0.5 overflow-hidden border-l border-white/10 pl-3"
          >
            {item.children!.map((c) => {
              const on = pathname === c.href || pathname.startsWith(c.href + "/");
              return (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-3 py-2 text-[13px] transition ${on ? "bg-emerald-400/10 font-semibold text-emerald-300" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
                  >
                    {t(c.label)}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function Content({ collapsed, onNavigate, onToggle, onClose }: { collapsed: boolean; onNavigate: () => void; onToggle?: () => void; onClose?: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center" : "justify-between px-5"}`}>
        {collapsed ? <Link href="/"><LogoMark size={36} /></Link> : <Logo />}
        {onClose && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sidebarMenu.map((g, i) => (
          <div key={i}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">{t(g.title)}</p>}
            {collapsed && i > 0 && <div className="mx-3 mb-3 h-px bg-white/10" />}
            <ul className="space-y-1">
              {g.items.map((it, j) => <Item key={j} item={it} collapsed={collapsed} onNavigate={onNavigate} />)}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400/20 to-sky-500/20 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-white">{t({ bn: "সাহায্য দরকার?", en: "Need help?" })}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">{t({ bn: "আমাদের সাপোর্ট টিম আপনার জন্য প্রস্তুত।", en: "Our support team is ready for you." })}</p>
          <Link href="/contact" className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-emerald-300">
            {t({ bn: "যোগাযোগ করুন", en: "Contact us" })}
          </Link>
        </div>
      )}

      {onToggle && (
        <button onClick={onToggle} className="hidden h-12 shrink-0 items-center justify-center gap-2 border-t border-white/10 text-xs text-white/50 transition hover:text-white lg:flex">
          <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && t({ bn: "ছোট করুন", en: "Collapse" })}
        </button>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      {/* desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden bg-ink-950 transition-[width] duration-300 lg:block ${collapsed ? "w-[84px]" : "w-[272px]"}`}>
        <Content collapsed={collapsed} onNavigate={() => {}} onToggle={onToggle} />
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[285px] bg-ink-950 shadow-2xl lg:hidden"
            >
              <Content collapsed={false} onNavigate={onMobileClose} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
