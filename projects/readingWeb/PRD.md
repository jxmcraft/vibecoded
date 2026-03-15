Product Requirements Document (PRD): Project "NovelFlow"
Version: 1.1
Date: 13 Mar, 2026
Status: Draft (Refined)

1. Executive Summary
Product Name: NovelFlow (Working Title)

Problem: Reading light novels and other text-heavy content in standard PDF viewers is a poor user experience. Users must constantly pan and zoom to read text, are distracted by repetitive headers and footers, and lack modern reading aids like theming, text-to-speech, and rapid serial visual presentation (RSVP). Furthermore, standard readers treat images as static objects, interrupting the narrative flow rather than integrating them.

Vision: To create the ultimate web-based reading platform for light novels. NovelFlow will transform static PDFs into a clean, customizable, and accessible reading experience, enhancing immersion and comfort for the user.

Target Audience:

Primary: Light novel and manga enthusiasts who have their content in PDF or EPUB format.

Secondary: Students, researchers, or anyone who reads long-form PDF text documents (e.g., reports, articles) and desires a cleaner, more focused reading experience.

2. Goals & Success Metrics
Goals:

Cleanliness: Provide a distraction-free reading interface by intelligently removing repetitive page elements and reflowing text into a single column.

Customization: Offer users control over their visual experience with multiple color schemes and persistent settings.

Accessibility & Pace: Introduce alternative reading methods (Auto-reader and Fast Reader) to cater to different preferences and needs, including the ability to control narrative pacing.

Visual Integrity: Preserve and properly display images embedded within the document, which are crucial for the light novel experience.

User Control: Allow users to save their progress with bookmarks.

Success Metrics (KPIs):

User Engagement: Average time spent reading per session.

Feature Adoption: Percentage of users who try the "Fast Reader" or "Auto-reader" modes.

User Feedback: Qualitative feedback on the accuracy of header/footer removal and overall ease of use.

Retention: Number of returning users, correlated with the use of persistence features (bookmarks, saved themes).

3. User Stories
As a light novel enthusiast, I want to upload a PDF or EPUB chapter and have the page numbers and chapter titles stripped away so I can read the story without distractions.

As a user with sensitive eyes, I want to switch to a dark or greyscale scheme so reading at night is more comfortable, and I want the app to remember my choice next time I visit.

As a commuter, I want to use the auto-reader (text-to-speech) so I can listen to a novel while walking or driving.

As a speed reader, I want to use the fast reader (RSVP) to consume text at my own pace without moving my eyes across the page.

As a reader of illustrated novels, I want to see the pictures integrated into the text flow so the story's visual elements aren't lost.

As a busy reader, I want to bookmark my page so I can easily pick up where I left off later.

As an engaged reader, I want the fast reader to slow down during a climactic scene so I can savor the moment, and speed up during descriptive passages.

4. Functional Requirements
This section details what the product must do.

FR-01: Document Upload & Processing
Description: The user can upload a supported reading file from their local machine.

Requirements:

Support standard PDF and EPUB file formats.

Provide clear upload progress indicator.

Handle file errors gracefully (e.g., corrupted files, too large).

Processing should be done client-side for privacy.

FR-02: Intelligent Content Cleansing & Reflow (Core Feature)
Description: The system must analyze the source document, differentiate between the main body text and repetitive elements, and reflow the content into a single, continuous column.

Requirements:

Analysis: The algorithm should identify text blocks that are identical or highly similar on multiple pages and flag them as potential headers/footers.

Removal: Automatically remove these elements from the display view.

Column Detection: Identify multi-column layouts.

Reflow: Extract the main body text and reflow it into a single, logical, scrollable column, ignoring original PDF page breaks. The reading order (top-left to bottom-right for English) must be preserved.

Acceptance Criteria for Parser Correctness:

The reflowed text must preserve sentence order and must not detach drop caps or single-letter initials from the words they begin.

Page furniture such as page numbers, repeated watermarks, and recurring header/footer text must not be merged into body paragraphs or headings.

Paragraph starts should preserve visible indentation when the source PDF indicates a distinct first-line indent, even if the exact pixel value is approximated for the web reader.

Chapter and subchapter titles should be detected semantically from layout cues and rendered separately from body text as centered bold headings.

Known Blockers in Current Draft:

Some PDFs currently split the first letter of a paragraph or dialogue line from the rest of the sentence, producing output such as `I ...` becoming detached later in the line.

Page numbers can survive cleansing and appear inline with chapter titles or body text.

Whitespace normalization can flatten paragraph indentation if indentation is encoded only as spaces instead of structured metadata.

Single-pass line grouping can misread mixed font sizes and drop-cap layouts, causing incorrect line and paragraph assembly.

FR-03: Image Detection & Preservation
Description: Ensure images are not discarded during the cleansing process and are displayed correctly.

Requirements:

Extract images from the PDF pages.

Maintain the logical position of the image relative to the surrounding text within the reflowed single column.

Display images in a responsive manner, fitting them to the reader's screen width.

FR-04: Theme Switching & Persistence
Description: User can change the color scheme of the reading interface. This preference is saved.

Requirements:

Light Mode: Dark text on a light background (e.g., #333 on #FFF).

Dark Mode: Light text on a dark background (e.g., #EEE on #1A1A1A).

Greyscale Mode: A black and white (greyscale) theme (e.g., #000 on #FFF, or vice-versa).

Settings must be saved to the user's browser (e.g., using localStorage) and applied automatically on their next visit.

FR-05: Auto-Reader (Text-to-Speech)
Description: The application will automatically read the extracted text aloud using the browser's built-in capabilities.

Requirements:

Controls: Play, Pause, Stop, and a speed slider (e.g., 0.5x to 3x speed).

Voice Selection: Use the browser's native Web Speech API, offering a choice of available voices.

Visual Tracking: Highlight the sentence or phrase currently being spoken.

FR-06: Fast Reader (Rapid Serial Visual Presentation - RSVP) with Pacing Control
Description: A mode where words are displayed one at a time in a fixed central position, with user control over narrative pacing.

Requirements:

Activation: A button to enter "Fast Reader" mode from the current reading position.

Word Display: A single, large, centered word.

Speed Control: Adjustable words-per-minute (WPM) via a slider (e.g., 100 to 800 WPM).

Pause/Play: Control the flow.

Image Handling: When an image is encountered, Fast Reader should pause and display the image in a reasonably sized, centered box. Playback resumes with the text after the image.

Intensity Pacing (Slow Down for Intense Parts):

User Control: During Fast Reader mode, the user can press and hold a designated key (e.g., the Spacebar) or tap a "Slow Down" button on the screen. While activated, the WPM is temporarily reduced by a pre-set amount (e.g., 50% of the set speed).

Release to Resume: Releasing the key/button returns the speed to the user's set WPM.

Optional (Future): The system could analyze text for punctuation or keywords (e.g., "!!!", "battle", "whispered") and offer an "auto-pacing" mode that dynamically adjusts speed.

FR-07: Bookmarks & Progress Persistence
Description: Users can save their reading position and return to it later.



Requirements:

Auto-Save: The user's current scroll position (or the last word read) should be automatically saved when they leave the page.

Manual Bookmark: A "Bookmark" button that allows the user to explicitly save a specific position, potentially with a name/note.

Resume: On returning to a previously read document, the user is prompted with "Resume from last read position?".

Bookmark List: A simple interface to view and jump to all manually saved bookmarks within the current document.

Reading Progress Slider: Provide a lightweight progress control that shows how much of the reflowed document has been read and allows the user to scrub to another approximate point in the text, similar to a long-form web novel reader.

All bookmarks and progress data must be stored locally in the user's browser.

5. Non-Functional Requirements
Performance: Document processing and the initial cleanse should happen reasonably quickly (ideally under 10 seconds for a standard 300-page novel) using client-side resources. The user interface must remain responsive during this process.

Usability: The interface should be intuitive, with clearly labeled buttons and minimal clutter. The "Slow Down" mechanism for Fast Reader must be easily discoverable and usable.

Compatibility: The web app must function correctly on the latest versions of major browsers (Chrome, Firefox, Safari, Edge).

Privacy: All PDF processing, bookmarks, and settings are handled on the client-side. No user documents or data are uploaded to a server.

6. User Interface & Experience (UI/UX) - Wireframe Concept
The layout should be clean and focused on the text.

(Imagine a simple mockup here)

Top Bar (App Bar):

Left: Logo (NovelFlow) and "Upload File" button.

Right: Theme selector icons (Sun, Moon, a "B/W" icon for greyscale).

Main Content Area:

Initial State: Large central area with a "Drag & Drop file here or Click to Upload" message.

Reading State: A continuous, scrollable column of clean text and images. Font should be clear and size-adjustable.

Left Sidebar (Collapsible):

A "Bookmarks" section listing all manually saved positions for the current document.

Bottom Bar (Control Panel):

Buttons to switch between "Standard Read," "Auto-Reader," and "Fast Reader" modes.

When a mode is active, its specific controls appear here (e.g., Play/Pause, Speed Slider). In "Fast Reader" mode, an on-screen button or a tooltip hint (e.g., "Hold Spacebar to Slow Down") should be present.

7. Future Scope / Enhancements
Annotation Support: Highlighting, notes.

Cloud Storage & Sync: Optional account creation to sync bookmarks and progress across devices.

Table of Contents Generation: Automatically build a ToC from detected chapter headings.

More Color Schemes: Customizable background/text colors.

Mobile App: Wrapper for iOS and Android for a more native experience.

AI-Powered Pacing: Automatically detect scene intensity based on text analysis to control Fast Reader speed.

Fine-Grained Reading Timeline: Add an always-available progress timeline or slider that reflects current reading position, saved progress, and quick navigation points through a long chapter or volume.

8. Implementation Status Snapshot (16 Mar, 2026)
Legend: Implemented | Partial | Not Implemented

FR-01 Document Upload & Processing: Implemented
- Implemented: PDF and EPUB upload support, file type checks, client-side parsing pipeline, phased loading UX messaging, numeric extraction progress indicators, and normalized/friendlier error handling with richer failure categories.

FR-02 Cleansing & Reflow: Partial
- Implemented: repeated furniture detection/removal, column-aware reflow, paragraph/heading rendering, chapter checkpoint extraction, Smart/Exact mode UX, and parse-result caching.
- Implemented: EPUB chapter parsing based on semantic HTML headings/paragraphs with inline image extraction.
- Partial/Missing: known blockers remain for some PDFs (drop-cap split in edge layouts, surviving page numbers, space-only indentation flattening, mixed-font grouping edge cases).

FR-03 Image Detection & Preservation: Implemented
- Extracted page images are preserved and rendered inline in reflowed reading order for both PDF and EPUB.

FR-04 Theme Switching & Persistence: Implemented
- Light/Dark/Greyscale modes with persistent local preference storage.

FR-05 Auto-Reader (Text-to-Speech): Partial
- Implemented: Web Speech playback (play/pause/stop), speed control, voice selection, sentence highlighting, and improved resume behavior using sentence/word boundary tracking.
- Implemented: defensive word-boundary fallback for browsers with sparse boundary events.
- Implemented: bottom control-surface now exposes stop and inline speed controls in addition to play/pause.
- Partial/Missing: additional cross-browser and edge-case UX polish.

FR-06 Fast Reader (RSVP) with Pacing Control: Implemented
- Implemented: single-word RSVP playback, adjustable WPM, play/pause flow, sentence-end pause control, ETA/progress UI, and position sync back to standard reader on close/finish.
- Implemented: default paused-on-open behavior and keyboard controls (space/escape) for primary interactions.
- Implemented: image-aware RSVP pause/resume behavior with centered image display in-flow.
- Implemented: hold-to-slow-down intensity pacing (Shift-hold reduces speed temporarily; release restores baseline).

FR-07 Bookmarks & Progress Persistence: Implemented
- Implemented: auto progress save, manual bookmarks, bookmark list/jump/delete, reading progress slider.
- Implemented: resume confirmation prompt with resume/start-over actions, plus persistent resume CTA placement in fixed bottom controls.
- Implemented: manual bookmark rename capability for named bookmarks.

Non-Functional Snapshot
- Privacy (client-side only): Implemented.
- Performance KPI (<10 seconds for 300 pages equivalent): Not yet benchmark-validated.

Low-Priority TODOs
- Smart mode currently has a known regression after recent TTS resume changes; keep Exact mode as fallback while this is investigated.

9. Approved Enhancement: Home Library (MVP)
Goal: Add a dedicated library home page where uploaded files are saved locally and displayed with title + cover image when available.

Scope
- Add `/library` as the default home route.
- Persist uploaded documents in browser IndexedDB (blob + metadata).
- Show library cards with file name and generated first-page cover thumbnail when available.
- Allow opening a saved document into `/reader/[docId]`.
- Allow deleting saved documents from the local library.

Data Model (Local)
- `docId`: stable document id
- `fileName`: uploaded filename
- `fileSize`: bytes
- `uploadedAt`: timestamp
- `lastOpenedAt`: timestamp
- `thumbnailDataUrl`: first-page thumbnail data URL
- `blob`: original file binary

Storage/Privacy Constraints
- All storage remains local to the browser/device.
- No cloud sync in MVP.
- Storage is quota-limited by the browser; app should remain functional even if save fails.

Out Of Scope (MVP)
- Cross-device sync/account system.
- Backfill migration from legacy progress/bookmark-only entries.
- Auto-reader / fast-reader implementation.

