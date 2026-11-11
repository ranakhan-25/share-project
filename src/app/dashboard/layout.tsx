"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { LogoMark } from "@/components/site/Logo";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth guard: no token → login page. Dashboard cannot be accessed without login.
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (typeof document !== "undefined") {
      document.cookie = `share-project:access-token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `admin_access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
    }

    if (typeof window !== "undefined" && !(window as unknown as { __shareProjectFetchPatched?: boolean }).__shareProjectFetchPatched) {
      const origFetch = window.fetch.bind(window);
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");
      (window as unknown as { __shareProjectFetchPatched?: boolean }).__shareProjectFetchPatched = true;
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const isBackendCall =
          url.startsWith(apiBase) ||
          url.includes("/realbizpro/api/v1") ||
          url.startsWith("/api/backend");
        if (isBackendCall) {
          const activeToken = getStoredAccessToken();
          if (activeToken) {
            const headers = new Headers(
              init?.headers ?? (input instanceof Request ? input.headers : undefined),
            );
            if (!headers.has("authorization")) {
              headers.set("Authorization", `Bearer ${activeToken}`);
              return origFetch(input, { ...init, headers });
            }
          }
        }
        return origFetch(input, init);
      };
    }

    try {
      setCollapsed(localStorage.getItem("share-project:sidebar") === "collapsed");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [router]);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem("share-project:sidebar", c ? "open" : "collapsed");
      } catch {
        /* ignore */
      }
      return !c;
    });

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="animate-float rounded-3xl bg-white p-4 ring-1 ring-slate-200">
          <LogoMark size={56} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]"}`}>
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
