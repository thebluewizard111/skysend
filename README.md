# SkySend

SkySend este o fundație de produs pentru o aplicație premium de logistică urbană cu drone, construită cu Next.js App Router, TypeScript și un design system minimalist, orientat pe claritate, performanță și scalare.

Proiectul este organizat pentru:
- suprafețe publice clare
- autentificare și route protection
- dashboard-uri separate pe roluri: `client`, `admin`, `operator`
- mock data și logică de produs care pot fi înlocuite treptat cu integrare reală
- dezvoltare iterativă asistată de Codex, fără să sacrifice structura tehnică

## Stack Tehnic

- `Next.js 16` cu `App Router`
- `TypeScript`
- `React 19`
- `ESLint` flat config
- `Tailwind CSS v4`
- `Clerk` pentru autentificare
- `Supabase` foundation pentru data layer
- `MapLibre` pentru hartă și coverage preview
- `Motion` pentru animații scurte și controlate
- `Lucide React` pentru iconografie

## Filosofie

SkySend urmărește trei principii:

- `Minimalist`: interfețe calme, fără blur-uri grele, efecte decorative inutile sau zgomot vizual
- `Premium`: tipografie clară, spacing generos, suprafețe curate și ton matur
- `Performant`: route-based code splitting, componente server-first unde este posibil, motion controlat și dependențe limitate

Aceeași filosofie se aplică atât în UI, cât și în structura de cod: puține abstracții, nume clare, logică centralizată și module ușor de înlocuit ulterior.

## Structura Proiectului

```text
src/
├─ app/
│  ├─ (public)/
│  ├─ (auth)/
│  ├─ (client-app)/
│  ├─ (admin-app)/
│  ├─ (operator-app)/
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ manifest.ts
│  └─ viewport.ts
├─ components/
├─ constants/
├─ hooks/
├─ lib/
├─ mocks/
├─ styles/
└─ types/
```

### Rolul folderelor

- `src/app`
  Conține rutele App Router, layout-urile globale și route groups pentru zonele principale ale aplicației.

- `src/app/(public)`
  Pagini publice precum homepage, coverage, pricing, faq și contact.

- `src/app/(auth)`
  Pagini de autentificare și access denied.

- `src/app/(client-app)`, `src/app/(admin-app)`, `src/app/(operator-app)`
  Dashboard-uri private separate pe rol, cu layout și protecție dedicate.

- `src/components`
  Componente UI și de produs: layout, dashboard, marketing, parcel assistant, map, shared primitives.

- `src/constants`
  Sursa centrală pentru label-uri, config-uri de navigație, role config, coverage, drone fleet și alte reguli statice.

- `src/hooks`
  Hook-uri client-side mici și reutilizabile.

- `src/lib`
  Logică de domeniu, helper-e, acces env, auth, route protection, mock engines și fundații tehnice.

- `src/mocks`
  Demo data și seed-style content pentru dezvoltare UI și prezentări.

- `src/styles`
  Design tokens și bază vizuală globală.

- `src/types`
  Tipuri de domeniu, entități, navigație, roluri, hartă și helper outputs.

## Route Groups și URL-uri

Route groups permit layout-uri separate fără să complice URL-urile finale:

- pagini publice: `/`, `/how-it-works`, `/coverage`, `/sustainability`, `/pricing`, `/faq`, `/contact`
- auth: `/sign-in`, `/sign-up`, `/access-denied`
- client app: `/client`
- admin app: `/admin`
- operator app: `/operator`

Această structură ajută la separarea clară dintre marketing, auth și suprafețele autentificate.

## Rolurile Aplicației

- `client`
  Creează comenzi, urmărește livrări, vede billing și notificări.

- `admin`
  Controlează partea de oversight: venituri, operațiuni, compliance și guvernanță.

- `operator`
  Gestionează execuția misiunilor, readiness, excepții și coordonarea operațională.

Rolurile sunt modelate centralizat, iar strategia recomandată este:
- baza de date ca sursă de adevăr
- Clerk metadata ca mirror rapid pentru sesiune și UI
- middleware și layout guards pentru protecția rutelor

## Variabile de Mediu

Proiectul include un exemplu complet în [`.env.local.example`](./.env.local.example).

### Variabile publice

Acestea pot ajunge în client bundle și trebuie prefixate cu `NEXT_PUBLIC_`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MAP_PROVIDER`
- `NEXT_PUBLIC_MAP_PUBLIC_TOKEN` optional
- `NEXT_PUBLIC_MAP_TILE_URL` optional
- `NEXT_PUBLIC_MAP_GEOCODING_URL` optional

### Variabile server-only

Acestea trebuie păstrate doar pe server:

- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MAP_PROVIDER_SECRET_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Accesul este centralizat în:
- [`src/lib/env.ts`](./src/lib/env.ts)
- [`src/lib/env.server.ts`](./src/lib/env.server.ts)

## Rulare Locală

1. Creează fișierul local de env:

```cmd
copy .env.local.example .env.local
```

2. Completează valorile reale necesare în `.env.local`.

3. Instalează dependențele:

```cmd
npm install
```

4. Rulează serverul de dezvoltare:

```cmd
npm run dev
```

5. Deschide aplicația:

```text
http://localhost:3000
```

### Scripturi utile

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Zone Funcționale Deja Pregătite

- auth foundation cu Clerk
- protected routes și role model foundation
- dashboard shell pe roluri
- PWA metadata foundation
- service area logic pentru `Pitesti` cu fallback radial și structură viitoare pentru polygon
- MapLibre foundation și coverage preview
- Parcel Assistant mock
- order helpers și eco metrics helpers
- mock data layer și demo seed content
- loading states și empty states
- accessibility baseline

## Design System și UI

Direcția de design este intenționat sobră:

- culori neutre și desaturate
- colțuri rotunjite elegante
- ierarhie tipografică clară
- motion discret
- focus pe utilizabilitate și contrast

Tokenii și baza vizuală sunt centralizate în:
- [`src/styles/tokens.css`](./src/styles/tokens.css)
- [`src/app/globals.css`](./src/app/globals.css)
- [`src/constants/design-system.ts`](./src/constants/design-system.ts)

## Dezvoltare cu Codex

Proiectul este organizat astfel încât Codex să poată lucra incremental și sigur:

- tipurile și constantele sunt centralizate, ceea ce reduce string-urile hardcodate
- logica de domeniu stă în `src/lib`, nu în componente
- mock data este separată de UI și poate fi înlocuită ulterior cu repository-uri reale
- route groups și layout-urile dedicate permit schimbări locale, fără refactor mare

Flux recomandat pentru lucru cu Codex:

1. actualizează tipurile și constantele centrale
2. implementează helper-ele sau logica de domeniu în `src/lib`
3. conectează UI-ul prin componente mici și reutilizabile
4. validează cu `lint`, `typecheck` și `build`

## Convenții de Dezvoltare

- folosește importuri prin aliasul `@/`
- păstrează `Server Components` implicit; adaugă `use client` doar unde este necesar
- evită string-uri hardcodate când există deja constants sau label maps
- nu pune logică de domeniu direct în componente
- preferă module mici și explicite în `src/lib`
- orice nouă integrare trebuie să aibă și bază de tipuri, nu doar implementare
- înainte de a considera un task închis, rulează:

```bash
npm run lint
npm run typecheck
npm run build
```

- dacă o funcționalitate este încă mock, documenteaz-o ca mock și evită să sugerezi precizie reală sau logică “AI” care nu există
