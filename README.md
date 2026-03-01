# fis-web

Interactive frontend for food insecurity seasonal indicators. The app consumes precomputed artifacts from Cloudflare R2.

## Stack

- **Frontend**: SvelteKit + shadcn-svelte + Tailwind CSS + MapLibre GL JS
- **Charts**: LayerChart (D3-based)
- **Data source**: Cloudflare R2 — static artifacts served from here (zero egress)
- **Hosting target**: Cloudflare Pages (static)

## Structure

```
app/        SvelteKit frontend
```

## Frontend dev

```bash
cd app
pnpm install
pnpm dev
```
