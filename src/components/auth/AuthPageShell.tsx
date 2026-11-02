"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/site/Logo";

type AuthMode = "register" | "forgot" | "reset" | "otp" | "verify";

export function AuthPageShell({ mode }: { mode: AuthMode }) {
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const content = {
    register: { title: { bn: "নতুন অ্যাকাউন্ট", en: "Create account" }, text: { bn: "আপনার শেয়ারহোল্ডার প্রোফাইল তৈরি করুন।", en: "Create your shareholder profile." } },
    forgot: { title: { bn: "পাসওয়ার্ড পুনরুদ্ধার", en: "Forgot password" }, text: { bn: "রিসেট লিংক পাঠানোর জন্য ইমেইল দিন।", en: "Enter your email to receive a reset link." } },
    reset: { title: { bn: "নতুন পাসওয়ার্ড", en: "Reset password" }, text: { bn: "একটি শক্তিশালী নতুন পাসওয়ার্ড নির্ধারণ করুন।", en: "Choose a strong new password." } },
    otp: { title: { bn: "OTP যাচাই", en: "Verify OTP" }, text: { bn: "আপনার মোবাইল নম্বরে পাঠানো ৬ ডিজিট দিন।", en: "Enter the 6-digit code sent to your phone." } },
    verify: { title: { bn: "ইমেইল যাচাই", en: "Email verification" }, text: { bn: "আপনার ইমেইল যাচাই করতে লিংক ব্যবহার করুন।", en: "Use the verification link sent to your email." } },
  }[mode];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const phone = String(form.get("phone") || "");
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    const token = String(form.get("token") || new URLSearchParams(window.location.search).get("token") || "");
    const API = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1/share-user`;

    try {
      if (mode === "reset" && password !== confirmPassword) throw new Error("Passwords do not match.");
      if (mode === "otp") throw new Error("OTP verification is handled by the backend email workflow.");

      let endpoint = "";
      let body: Record<string, string> = {};
      if (mode === "register") {
        endpoint = "register";
        body = { name, email, phone, password };
      } else if (mode === "forgot") {
        endpoint = "forgot-password";
        body = { email };
      } else if (mode === "reset") {
        endpoint = "reset-password";
        body = { token, password };
      } else if (mode === "verify") {
        endpoint = "verify-email";
        body = { token };
      }

      if (!endpoint) throw new Error("This verification method is not available.");
      const response = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((payload && typeof payload.message === "string" ? payload.message : null) || `Request failed (${response.status})`);
      }
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-white p-6 shadow-[0_40px_120px_-20px_rgba(0,0,0,.7)] sm:p-9">
        <div className="mb-8 flex items-center justify-between"><Logo /><Link href="/login" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link></div>
        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-5 text-2xl font-bold text-slate-900">{t(mode === "forgot" || mode === "otp" ? { bn: "সম্পন্ন হয়েছে", en: "Request submitted" } : { bn: "সফল হয়েছে", en: "Success" })}</h1>
            <p className="mt-2 text-sm text-slate-500">{t({ bn: "পরবর্তী ধাপে এগিয়ে যেতে নির্দেশনা অনুসরণ করুন।", en: "Follow the next-step instructions to continue." })}</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800">{t({ bn: "লগইনে যান", en: "Go to login" })}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{t(content.title)}</h1>
            <p className="mt-2 text-sm text-slate-500">{t(content.text)}</p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === "register" && <><input required name="name" className={inputClass} placeholder={t({ bn: "পুরো নাম", en: "Full name" })} /><input required name="phone" type="tel" className={inputClass} placeholder={t({ bn: "মোবাইল নম্বর", en: "Mobile number" })} /></>}
              {(mode === "register" || mode === "forgot") && <input required name="email" type="email" className={inputClass} placeholder="name@example.com" />}
              {(mode === "register" || mode === "reset") && <input required name="password" minLength={8} type="password" className={inputClass} placeholder={t({ bn: "পাসওয়ার্ড", en: "Password" })} />}
              {mode === "otp" && <input required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} className={`${inputClass} text-center text-xl tracking-[0.45em]`} placeholder="000000" />}
              {mode === "reset" && <><input required name="token" type="hidden" defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""} /><input required name="confirmPassword" minLength={8} type="password" className={inputClass} placeholder={t({ bn: "পাসওয়ার্ড নিশ্চিত করুন", en: "Confirm password" })} /></>}
              {mode === "verify" && <input required name="token" className={inputClass} defaultValue={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""} placeholder={t({ bn: "ইমেইল যাচাই টোকেন", en: "Email verification token" })} />}
              {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t({ bn: "চালিয়ে যান", en: "Continue" })}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">{t({ bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?", en: "Already have an account?" })} <Link href="/login" className="font-semibold text-emerald-600">{t({ bn: "লগইন", en: "Login" })}</Link></p>
          </>
        )}
      </div>
    </main>
  );
}
