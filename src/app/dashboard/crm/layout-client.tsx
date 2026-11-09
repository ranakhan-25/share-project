"use client";


export function CrmLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <main className="flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
