"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";
import { LogoMark } from "@/components/site/Logo";
import toast from "react-hot-toast";

export default function MyInvestmentsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      toast.error("মাই ইনভেস্টমেন্ট দেখার জন্য আগে লগইন করুন।");
      router.replace("/login?redirect=/dashboard/my-investments");
    } else {
      router.replace("/dashboard/my-investments");
    }
  }, [router]);

  return (
    <div className="grid min-h-[60vh] place-items-center bg-slate-50 pt-28">
      <div className="animate-float rounded-3xl bg-white p-4 ring-1 ring-slate-200">
        <LogoMark size={56} />
      </div>
    </div>
  );
}
