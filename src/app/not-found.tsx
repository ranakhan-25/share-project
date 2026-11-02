import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-20">
      <div className="max-w-md text-center">
        <p className="text-7xl font-black text-emerald-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm text-slate-500">The page you requested does not exist or has been moved.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-600">
          Back to home
        </Link>
      </div>
    </section>
  );
}
