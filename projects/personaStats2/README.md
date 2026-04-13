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

**Hideout BGM:** tracks are listed in `src/data/audioTracks.ts` (default: `public/audio/beneath_the_mask.mp3`). Add files under `public/audio/` and new entries there to switch or cycle tracks in **Hideout** settings.

**Rain:** Toggle in Hideout. The main route shell is transparent so drops show in open areas; headers and cards stay opaque.

**Route transitions:** In-app links to `/` and `/settings` use `PersonaNavLink` (full diagonal wipe: cover → navigate → reveal). Any other URL change while the wipe system is idle—typically **browser back/forward**—triggers the same **reveal** wipe on top of the new page so it doesn’t appear as a hard cut.

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
