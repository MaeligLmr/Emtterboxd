# Emtterbox

A personal film diary in the spirit of Letterboxd: log films with a poster, rating, comment, watch date and favorites.

Vue 3 + Vite + Tailwind + Supabase.

## Setup

```sh
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev
```

Run `supabase/schema.sql` once in the Supabase SQL editor (tables, RLS policies, private storage buckets).

## Build

```sh
npm run build
```
