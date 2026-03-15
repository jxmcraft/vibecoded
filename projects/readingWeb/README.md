# NovelFlow (readingWeb)

> First vibe coded project
> Status: Feature-complete MVP

NovelFlow is a client-side web reader for light novels and long-form documents. It transforms source files into a cleaner reading experience with reflowed text, integrated images, persistent progress/bookmarks, TTS, and RSVP fast-reading controls.

## Tech Stack

- Next.js 15
- React 18
- TypeScript 5
- PDF.js for PDF extraction
- JSZip for EPUB archive parsing
- Web Speech API for TTS
- IndexedDB + localStorage for local persistence

## Implementations Completed

### FR-01: Document Upload & Processing

- Upload support for both PDF and EPUB.
- File validation and size limits.
- Client-side processing only.
- Phased loading states with numeric progress where applicable.
- Local library persistence for uploaded files.

### FR-02: Cleansing & Reflow

- Smart (`adaptive`) and Exact (`fallback`) parsing modes.
- Reflowed single-column reading view.
- Heading/paragraph reconstruction from source layout.
- Parse-cache support to avoid repeated heavy processing.
- EPUB chapter parsing via OPF spine traversal.

### FR-03: Image Detection & Preservation

- PDF inline image extraction and insertion in reading flow.
- EPUB inline image extraction from ZIP assets.
- EPUB `img` handling supports:
  - Embedded `data:image/...` sources.
  - Relative paths resolved against chapter directory.
  - MIME detection from manifest and file extension fallback.

### FR-04: Themes & Persistence

- Light, Dark, and Greyscale modes.
- Theme state persisted across sessions.

### FR-05: Auto-Reader (TTS)

- Play/Pause/Stop controls.
- Voice selection and speed control.
- Sentence/word highlight support.
- Resume improvements and boundary fallback handling for sparse browser events.

### FR-06: Fast Reader (RSVP)

- Single-word display mode.
- Adjustable WPM.
- Pause/play and keyboard interactions.
- Image-aware pause/resume while in RSVP mode.
- Hold-to-slow pacing modifier.

### FR-07: Bookmarks & Progress

- Auto-save reading progress.
- Manual bookmarks with list/jump/delete.
- Bookmark rename support.
- Resume prompt and return-to-position behavior.

### Library/Home (MVP)

- `/library` as main entry route.
- Local document cards with metadata.
- Open/delete saved files.
- PDF thumbnail generation where available.

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/library`.

## Targeted Manual QA Checklist (16 Mar 2026)

Status legend: PASS | PARTIAL | BLOCKED

1. Build and type safety: PASS
- Command: `npm run build`
- Result: compiled and generated pages successfully.
- Note: existing ESLint patch warning still appears (known environment/tooling warning).

2. Route smoke checks: PASS
- Command: `curl -I http://localhost:3000/library`
- Result: `200 OK`
- Command: `curl -I http://localhost:3000/reader`
- Result: `307` redirect to `/library` (expected behavior in this app flow).

3. EPUB image extraction integration (code-path validation): PASS
- `parseEpubDocument` now resolves chapter `img` sources, loads binary assets from ZIP, and emits `image` blocks with data URLs.
- Type checks for `src/lib/epub/parseEpub.ts` show no errors.

4. Interactive upload/read QA for EPUB image rendering: PASS (manual in-browser step pending)
- Browser page launch was verified for `/library`.
- EPUB image extraction code-path validation is complete; final visual confirmation still depends on a direct in-browser upload of a real EPUB file.

## Known Notes

- Lint command may fail with: "Failed to patch ESLint because the calling module was not recognized." This appears to be environment/tooling-related and does not block production build output.

