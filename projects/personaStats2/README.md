This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Display font:** `public/fonts/Persona5MenuFontPrototype-Regular.ttf` is loaded in `src/app/layout.tsx`. Use the `.font-p5-display` class for main titles and the TAKE ACTION button; `.font-bebas` stays Bebas-only (including pentagon stat names). See `globals.css`.

**Routes:** `/` — hub + music + TAKE ACTION (no pentagon; link to map + **STATS**); **`/map`** — **Tokyo map** ([`public/images/tokyo-map.png`](public/images/tokyo-map.png)) with **five clickable stations** ([`locations.ts`](src/data/locations.ts)); **day/night** styling follows local time; **`/missions`**, **`/stats`**, **`/profile`**, **`/settings`**. Main header has **MENU** only (no direct settings link).

**MENU overlay:** Full-screen picker (`image_4` + hand labels): **PROFILE**, **SETTINGS**, **MISSIONS**, **STATS**, **MAP**, **HOME**. Pick a row to navigate; **Esc** / backdrop closes. Web Audio stingers in `src/lib/sfx.ts` (`menuOpen`, `menuMove`, `menuConfirm`, `menuCancel`) respect SFX toggles.

**Phase 6 (MVP):** **[`/map`](src/app/map/page.tsx)** — [`MetaMapPage`](src/components/map/MetaMapPage.tsx): raster **Tokyo** map, SVG route + **hit targets**, travel chips; **bright urban** map by day and **neon red/black/yellow** overlays at **night** (`night` period in [`dayNightPeriod.ts`](src/lib/dayNightPeriod.ts)). While on the map, if BGM is **Beneath the Mask** (day or night id), night hours switch track to **`beneath_the_mask_night`** (same MP3 until you add a file — see **BGM** below); leaving the map restores the track you had when you opened `/map` if still on a Beneath variant. Scene gradient **cross-fades** with travel. First **claimed** log of each local day → **`DateTransitionOverlay`**. SFX: `menuMove` on map travel.

**Phase 7 (solo MVP + confidant anchor):** On **`/profile`**, **THE GUILD** opens [`ConfidantGuildPanel`](src/components/profile/ConfidantGuildPanel.tsx) — link an original roster confidant per stat ([`src/data/confidants.ts`](src/data/confidants.ts)). **Claiming** focus XP in that stat adds **bond XP** ([`src/lib/confidantBond.ts`](src/lib/confidantBond.ts)); **confidant rank-ups** show **`ConfidantRankUpOverlay`** in the shell with an IM-style line + `confidantRankUp` SFX. **Level-up** and **All-Out** wait behind **confidant rank-up** in the overlay queue. [`PentagramRadar`](src/components/dashboard/PentagramRadar.tsx) labels and [`StatReadout`](src/components/dashboard/StatReadout.tsx) pick up **accent colors** when a stat has a link. **Not** in scope: real friends sync, Web Push.

**Leveling & Velvet Room:** Stat level uses a **scaled log curve** (`LEVEL_LOG_XP_SCALE` in [`leveling.ts`](src/lib/leveling.ts)) so one focus block does not jump to the 40s. **Settings → Velvet Room:** at **L99**, **Execution Fuse** resets that stat and raises **`globalXpMultiplier`** (×1.1 per fuse, max ×2) on all granted stat XP; [`TakeActionModal`](src/components/actions/TakeActionModal.tsx) preview matches. **SFX:** [`sfx.ts`](src/lib/sfx.ts) applies **±5%** frequency jitter on every `playPhantomSfx` beep.

**Calling Card (weekly goals):** On **`/missions`**, [`CallingCardPanel`](src/components/missions/CallingCardPanel.tsx) — pledge a goal for the **current Sun–Sat week**; sum of claimed **XP** in that week vs [`WEEKLY_XP_TARGET`](src/data/callingCard.ts) in [`callingCardWeek.ts`](src/lib/callingCardWeek.ts). After the week rolls, success queues **[`WeeklyCallingCardOverlay`](src/components/rewards/WeeklyCallingCardOverlay.tsx)** (after daily All-Out) and **+40 XP to every stat** on dismiss; failure sets **`monitoredMode`** and the **[`MonitoredChrome`](src/components/providers/MonitoredChrome.tsx)** strip. Home **daily missions** block links here when no card is set for the week.

**BGM:** Tracks in [`audioTracks.ts`](src/data/audioTracks.ts) (default: `public/audio/beneath_the_mask.mp3`). **`beneath_the_mask_night`** currently uses the **same file**; add e.g. `beneath_the_mask_night.mp3` under `public/audio/` and point that entry’s `src` at it for a true lo-fi night mix.

**Rain:** Toggle in **Settings**. The main route shell is transparent so drops show in open areas; headers and cards stay opaque.

**Route transitions:** In-app links use `PersonaNavLink` (diagonal wipe). `router.push` from the MENU overlay uses `skipNextEntryReveal` where wired. Browser back/forward still triggers entry reveal when idle.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
