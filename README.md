# fis-web

Interactive web dashboard for food insecurity seasonal indicators. Visualizes precomputed climate and crop indicators for Ghana, Kenya, and Zimbabwe.

## Stack

- **Frontend**: SvelteKit + shadcn-svelte + Tailwind CSS + MapLibre GL JS
- **Charts**: LayerChart (D3-based)
- **Data storage**: Cloudflare R2 — all static artifacts served from here (zero egress)
- **Hosting target**: Cloudflare Pages (static)
- **Data pipeline**: Python scripts run on HPC → artifacts pushed to R2 via `rclone`

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
