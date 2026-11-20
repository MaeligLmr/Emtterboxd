# Emtterbox

A personal film diary in the spirit of Letterboxd. Log the films you watch with a poster, a rating, a comment and a watch date, pick up to 5 favorites, and optionally share a read-only public profile.

Built with Vue 3, Vite, Tailwind CSS 4 and Supabase (Auth, Postgres, Storage). Mobile first.

## Features

- **Account**: sign up with first name, last name, username, email and password; sign in; show/hide password.
- **Films**: add, edit and delete films with a poster (cropped in the app and converted to WebP before upload), half-star rating, comment and watch date.
- **Rewatch toggle**: marks a film as rewatched and moves the watch date to today; turning it off restores the previous date.
- **Profile**: profile photo, 5 favorite films (scrollable row, empty slots open a picker or create a new review), recent activity.
- **On Site**: your diary, grouped by month of the watch date.
- **Public profiles**: private by default. From the ⋮ menu on your profile you can make it public; anyone, signed in or not, can then browse your favorites, diary and reviews in read-only mode from the **Explore** tab.

## Getting started

Requirements: Node `^22.18` or `>=24.12`, and a [Supabase](https://supabase.com) project.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local`:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL, e.g. `https://<project-id>.supabase.co` (Project Settings → API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The `sb_publishable_...` key (Project Settings → API Keys) |

### Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (**New query → Run**). It is idempotent: run it again after pulling changes that touch the schema. It creates:
   - the `films` and `profiles` tables with row level security (each user only reads and writes their own rows);
   - a trigger that creates the profile at sign-up and another that limits favorites to 5;
   - **private** `posters` and `avatars` buckets (5 MB, images only), readable only from the owner's folder;
   - the `public_profiles` and `public_films` views, plus a storage policy, that let anonymous visitors read public profiles only (first and last names are never exposed).
2. In Auth settings, set a password policy you are happy with, and consider disabling new sign-ups once your account exists.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Deployment (GitHub Pages)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys the site on every push to `main`.

1. Repository **Settings → Pages → Source**: choose **GitHub Actions**.
2. Repository **Settings → Secrets and variables → Actions**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

The workflow sets `BASE_PATH` to `/<repository-name>/`. Remove that line if you deploy to a `<user>.github.io` repository or a custom domain.

## Routes

Routing uses the URL hash, so it works on GitHub Pages without server configuration.

| Hash | Page |
| --- | --- |
| `#/profil` | Your profile |
| `#/on-site` | Your diary |
| `#/explore` | Public profiles (no account needed) |
| `#/login` | Sign in / sign up |
| `#/film/new` | New film (`?favorite=1` pre-selects the favorite star) |
| `#/film/<id>` · `#/film/<id>/edit` | A film of yours: review page / edit form |
| `#/u/<username>` | A public profile |
| `#/u/<username>/diary` | Its diary |
| `#/u/<username>/film/<id>` | One of its films (read-only) |

## Project structure

```
supabase/schema.sql      Database schema, RLS policies, storage policies
src/
  App.vue                Chooses the page from the session and the route
  views/                 One component per page
  components/            Reusable UI pieces
  composables/           useAuth, useRoute (hash router), useSignedUrl
  handlers/              All Supabase access (films, profiles, storage)
  lib/                   Supabase client, dates, validation, image → WebP
  types/db/              Shapes of database rows
  types/ui/              Shapes used by the interface (routes, forms…)
  constants.ts           Shared constants (e.g. MAX_FAVORITES)
```

Components never call Supabase directly: they go through the handlers in `src/handlers/`.

## Notes

- Images are never public: posters and avatars are served through short-lived signed URLs, so a page left open for more than an hour may need a refresh to show images again.
- Uploaded images are cropped, resized and converted to WebP in the browser before they are sent to Storage.
