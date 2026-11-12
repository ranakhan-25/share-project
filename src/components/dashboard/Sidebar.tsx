"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronsLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Logo, LogoMark } from "@/components/site/Logo";
import { sidebarMenu, type MenuItem, type SubMenuItem } from "./sidebar-data";

function SubItem({ item, onNavigate }: { item: SubMenuItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasGrandChildren = !!item.children?.length;
  const isGrandChildActive =
    item.children?.some(
      (gc) => pathname === gc.href || pathname.startsWith(gc.href + "/")
    ) ?? false;
  const [open, setOpen] = useState(isGrandChildActive);

  useEffect(() => {
    if (isGrandChildActive) setOpen(true);
  }, [isGrandChildActive]);

  if (!hasGrandChildren) {
    const on = item.href
      ? pathname === item.href || pathname.startsWith(item.href + "/")
      : false;
    return (
      <li>
        <Link
          href={item.href ?? "#"}
          onClick={onNavigate}
          className={`block rounded-lg px-3 py-2 text-[13px] transition ${
            on
              ? "bg-emerald-50 font-semibold text-emerald-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {t(item.label)}
        </Link>
      </li>
    );
  }

  return (
    <li className="my-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition ${
          isGrandChildActive
            ? "text-emerald-700 font-semibold bg-emerald-50/50"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className="truncate text-left">{t(item.label)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3 mt-0.5 space-y-0.5 overflow-hidden border-l border-slate-200 pl-2.5"
          >
            {item.children!.map((c) => {
              const on =
                pathname === c.href || pathname.startsWith(c.href + "/");
              return (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={onNavigate}
                    className={`block rounded-lg px-2.5 py-1.5 text-xs transition ${
                      on
                        ? "bg-emerald-50 font-semibold text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
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

function Item({ item, collapsed, onNavigate }: { item: MenuItem; collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasChildren = !!item.children?.length;
  const childActive =
    item.children?.some((c) => {
      if (c.children?.length) {
        return c.children.some(
          (gc) => pathname === gc.href || pathname.startsWith(gc.href + "/")
        );
      }
      return c.href ? pathname === c.href || pathname.startsWith(c.href + "/") : false;
    }) ?? false;
  const selfActive = item.href ? (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)) : false;
  const active = selfActive || childActive;
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const base = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  } ${collapsed ? "justify-center" : ""}`;

  const inner = (
    <>
      {active && <motion.span layoutId="side-active" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />}
      <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-emerald-600" : ""}`} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{t(item.label)}</span>
          {item.badge && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{item.badge}</span>}
          {hasChildren && <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
        </>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs text-slate-900 opacity-0 shadow-xl ring-1 ring-slate-200 transition group-hover:opacity-100">
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
            className="ml-[26px] mt-1 space-y-0.5 overflow-hidden border-l border-slate-200 pl-3"
          >
            {item.children!.map((c, idx) => (
              <SubItem key={c.href ?? idx} item={c} onNavigate={onNavigate} />
            ))}
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
      <div className={`flex h-16 shrink-0 items-center border-b border-slate-200 ${collapsed ? "justify-center" : "justify-between px-5"}`}>
        {collapsed ? <Link href="/"><LogoMark size={36} /></Link> : <Logo />}
        {onClose && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sidebarMenu.map((g, i) => (
          <div key={i}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t(g.title)}</p>}
            {collapsed && i > 0 && <div className="mx-3 mb-3 h-px bg-slate-200" />}
            <ul className="space-y-1">
              {g.items.map((it, j) => <Item key={j} item={it} collapsed={collapsed} onNavigate={onNavigate} />)}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{t({ bn: "সাহায্য দরকার?", en: "Need help?" })}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{t({ bn: "আমাদের সাপোর্ট টিম আপনার জন্য প্রস্তুত।", en: "Our support team is ready for you." })}</p>
          <Link href="/contact" className="mt-3 inline-block rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800">
            {t({ bn: "যোগাযোগ করুন", en: "Contact us" })}
          </Link>
        </div>
      )}

      {onToggle && (
        <button onClick={onToggle} className="hidden h-12 shrink-0 items-center justify-center gap-2 border-t border-slate-200 text-xs text-slate-500 transition hover:text-slate-900 lg:flex">
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
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-300 lg:block ${collapsed ? "w-[84px]" : "w-[272px]"}`}>
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
              className="fixed inset-y-0 left-0 z-50 w-[285px] border-r border-slate-200 bg-white shadow-2xl lg:hidden"
            >
              <Content collapsed={false} onNavigate={onMobileClose} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
