# PrintPro — Print Media Publications Portal

A full-featured React SPA built on TanStack Start and Netlify, serving as the digital hub for PrintPro's print media publication business.

## What it does

- **Public landing page** with business information, services showcase, portfolio, and an enquiry form
- **Role-based authentication** via Netlify Identity (OAuth + email/password)
- **Three role-specific dashboards**: Admin, Staff, and Partner
- **Secure API integration** with a Java Spring Boot backend — all requests include the Bearer JWT token from Netlify Identity

## Key Technologies

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19, SSR) |
| Styling | Tailwind CSS v4 |
| Auth | Netlify Identity (`@netlify/identity`) |
| Hosting | Netlify (edge functions, role-based redirects) |
| Backend | Java Spring Boot (external API, configured via `VITE_API_BASE_URL`) |

## User Roles

| Role | Landing Page | Access |
|------|-------------|--------|
| `partner` | `/partner` | Dashboard, Quotations, Orders, Invoices |
| `staff` | `/staff` | Dashboard, Quotations, Orders, Invoices (read-only, cross-partner) |
| `admin` | `/admin` | Full access including Partners list and User management |

Roles are stored in `app_metadata.roles` in the Netlify Identity JWT. The CDN enforces role-based routing via `netlify.toml` redirect conditions.

## Running Locally

```bash
npm install
netlify dev      # runs on http://localhost:8888
```

> **Note:** Netlify Identity authentication only works when deployed to Netlify, not on plain localhost. Use a branch preview for auth testing.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_NETLIFY_SITE_URL` | Your Netlify site URL (for Identity) |
| `VITE_API_BASE_URL` | Base URL of the Java Spring Boot backend |

## Setting Up the First Admin

1. Deploy to Netlify
2. Go to **Identity** in the Netlify dashboard
3. Click **Invite users** and enter the admin email
4. After the user accepts the invite, open their profile and add the `admin` role

## Backend Integration

All API calls in `src/lib/api.ts` automatically attach the `Authorization: Bearer <token>` header using the current user's Netlify Identity JWT. Configure `VITE_API_BASE_URL` to point to your Spring Boot server.
