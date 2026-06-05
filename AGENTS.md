# AGENTS.md — PrintPro Portal Architecture

## Project Overview

PrintPro is a React SPA built with TanStack Start (SSR-capable React meta-framework) deployed on Netlify. It combines a public marketing site with role-gated dashboards for three user types: Admin, Staff, and Partner.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router v1 (file-based) |
| Styling | Tailwind CSS v4 |
| Auth | Netlify Identity (`@netlify/identity`) |
| Hosting | Netlify (edge functions, role-based redirects) |
| Backend | Java Spring Boot (external API, configured via `VITE_API_BASE_URL`) |

## Key Directories

```
src/
  routes/           # File-based routing (TanStack Router convention)
    index.tsx       # Public landing page + login modal
    partner/        # Partner-facing pages (Home, Quotations, Orders, Invoices)
    admin/          # Admin pages (Dashboard, Partners, Quotations, Orders, Invoices, Users)
    staff/          # Staff pages (Dashboard, Quotations, Orders, Invoices) — same as admin minus Users
  lib/
    auth.ts         # getServerUser() server function — reads nf_jwt cookie server-side
    identity-context.tsx  # React context wrapping @netlify/identity for client-side auth state
    api.ts          # apiFetch() — attaches Bearer token to all Spring Boot API calls
  middleware/
    identity.ts     # TanStack Start middleware: identityMiddleware, requireAuthMiddleware, requireRoleMiddleware
  components/
    CallbackHandler.tsx  # Processes OAuth/confirmation URL hash on page load
    PartnerNav.tsx   # Top navigation for Partner role
    AdminNav.tsx     # Top navigation for Admin and Staff roles (takes a `role` prop)

netlify/
  functions/
    identity-signup.mts  # Fires on new signup; preserves existing roles (default: partner)
```

## Routing Conventions

- All routes use `createFileRoute` from TanStack Router
- Protected routes call `getServerUser()` in `beforeLoad` and `throw redirect({ to: '/' })` if unauthenticated or wrong role
- Role checks: `user.roles?.includes('admin')`, `user.roles?.includes('partner')`, etc.
- Roles come from `user.roles` (sourced from `app_metadata.roles` in the Netlify Identity JWT)

## Auth Architecture

- **Client side**: `useIdentity()` hook from `IdentityProvider` provides `{ user, ready, logout }`
- **Server side**: `getServerUser()` reads and validates the `nf_jwt` cookie using `@netlify/identity`'s `getUser()`
- **OAuth callback**: `CallbackHandler` in `__root.tsx` processes all auth URL hashes
- **Role enforcement**: Both application-level (`beforeLoad`) and CDN-level (netlify.toml redirects)

## API Integration Pattern

`src/lib/api.ts` exports `apiGet`, `apiPost`, `apiPut`, `apiDelete`. Each:
1. Calls `getUser()` to get the current Netlify Identity user
2. Extracts the access token from `user.token.access_token`
3. Sends `Authorization: Bearer <token>` in all requests to `VITE_API_BASE_URL`

When the backend is unavailable, components silently fall back to mock data (defined at the top of each route file).

## Coding Conventions

- Mock data is defined as `const MOCK_*` at the top of each route file
- Each page component: check auth → fetch from API → fall back to mock → render
- Status badge colors are in local `statusColor(status)` functions per page
- All monetary values formatted with `toLocaleString('en-IN')` for Indian number formatting
- Purple (`purple-700`) is the primary brand color throughout

## Adding a New Page

1. Create `src/routes/<role>/<page>.tsx`
2. Add `beforeLoad` with role guard using `getServerUser()`
3. Use `PartnerNav` or `AdminNav` (with `role` prop)
4. Fetch from API with `apiGet('/api/<endpoint>')`, fall back to `MOCK_*` constant

## Non-Obvious Decisions

- `identity-signup.mts` preserves existing `app_metadata.roles` rather than overwriting — allows pre-setting roles before signup
- The `netlify.toml` edge function exclusion for `/.netlify/*` prevents TanStack's catch-all edge function from intercepting Identity endpoints
- `ready` flag from `useIdentity()` prevents hydration mismatches — SSR renders with `ready: false, user: null`
- Staff role pages reuse Admin API endpoints (`/api/admin/*`) since staff see the same data with the same read-only access
