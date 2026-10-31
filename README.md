# Share Project

Next.js 15 · TypeScript · Tailwind CSS v4 · Motion. Bilingual (বাংলা default / English).

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # optional: review types (imported pages are loosely typed)
```

## Routes
| Route | Description |
|---|---|
| `/` `/features` `/about` `/contact` | Public site (navbar + footer) |
| `/login` | Split card: image slider + form (no navbar/footer). Calls `loginUniversalSession` |
| `/dashboard` | The single main dashboard page (premium charts) |
| `/dashboard/project/**` | Your supplied project pages |

## Login API
`src/lib/admin-auth/adminAuthApi.ts` — `POST {NEXT_PUBLIC_API_BASE_URL}{NEXT_PUBLIC_LOGIN_PATH}`.
`.env.local` ships with `NEXT_PUBLIC_DEMO_MODE=true` (any username + 4 char password works).
Set it to `false` for the real API. Edit the path/body in the file if your backend differs.

## Customise
- Sidebar menu: `src/components/dashboard/sidebar-data.ts`
- Dashboard data: top of `src/app/dashboard/page.tsx` (sample data)
- Report endpoints for generic pages: `src/components/project/project-page-config.ts` (guessed, adjust)
- Text: every string is `{ bn, en }` inline.
