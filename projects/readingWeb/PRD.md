Product Requirements Document (PRD): Project "NovelFlow"
Version: 1.1
Date: 13 Mar, 2026
Status: Draft (Refined)

1. Executive Summary
Product Name: NovelFlow (Working Title)

Problem: Reading light novels and other text-heavy content in standard PDF viewers is a poor user experience. Users must constantly pan and zoom to read text, are distracted by repetitive headers and footers, and lack modern reading aids like theming, text-to-speech, and rapid serial visual presentation (RSVP). Furthermore, standard readers treat images as static objects, interrupting the narrative flow rather than integrating them.

Vision: To create the ultimate web-based reading platform for light novels. NovelFlow will transform static PDFs into a clean, customizable, and accessible reading experience, enhancing immersion and comfort for the user.

Target Audience:

Primary: Light novel and manga enthusiasts who have their content in PDF format.

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
As a light novel enthusiast, I want to upload a PDF chapter and have the page numbers and chapter titles stripped away so I can read the story without distractions.

As a user with sensitive eyes, I want to switch to a dark or greyscale scheme so reading at night is more comfortable, and I want the app to remember my choice next time I visit.

As a commuter, I want to use the auto-reader (text-to-speech) so I can listen to a novel while walking or driving.

As a speed reader, I want to use the fast reader (RSVP) to consume text at my own pace without moving my eyes across the page.

As a reader of illustrated novels, I want to see the pictures integrated into the text flow so the story's visual elements aren't lost.

As a busy reader, I want to bookmark my page so I can easily pick up where I left off later.

As an engaged reader, I want the fast reader to slow down during a climactic scene so I can savor the moment, and speed up during descriptive passages.

4. Functional Requirements
This section details what the product must do.

FR-01: PDF Upload & Processing
Description: The user can upload a PDF file from their local machine.

Requirements:

Support standard PDF file formats.

Provide clear upload progress indicator.

Handle file errors gracefully (e.g., corrupted files, too large).

Processing should be done client-side for privacy.

FR-02: Intelligent Content Cleansing & Reflow (Core Feature)
Description: The system must analyze the PDF, differentiate between the main body text and repetitive elements, and reflow the content into a single, continuous column.

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
Performance: PDF processing and the initial cleanse should happen reasonably quickly (ideally under 10 seconds for a standard 300-page novel) using client-side resources. The user interface must remain responsive during this process.

Usability: The interface should be intuitive, with clearly labeled buttons and minimal clutter. The "Slow Down" mechanism for Fast Reader must be easily discoverable and usable.

Compatibility: The web app must function correctly on the latest versions of major browsers (Chrome, Firefox, Safari, Edge).

Privacy: All PDF processing, bookmarks, and settings are handled on the client-side. No user documents or data are uploaded to a server.

6. User Interface & Experience (UI/UX) - Wireframe Concept
The layout should be clean and focused on the text.

(Imagine a simple mockup here)

Top Bar (App Bar):

Left: Logo (NovelFlow) and "Upload PDF" button.

Right: Theme selector icons (Sun, Moon, a "B/W" icon for greyscale).

Main Content Area:

Initial State: Large central area with a "Drag & Drop PDF here or Click to Upload" message.

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

8. Implementation Status Snapshot (15 Mar, 2026)
Legend: Implemented | Partial | Not Implemented

FR-01 PDF Upload & Processing: Partial
- Implemented: PDF upload, file type checks, client-side parsing pipeline, error state handling.
- Partial/Missing: explicit upload progress indicator and richer file-size/corruption messages.

FR-02 Cleansing & Reflow: Partial
- Implemented: repeated furniture detection/removal, column-aware reflow, paragraph/heading rendering, chapter checkpoint extraction.
- Partial/Missing: known blockers remain for some PDFs (drop-cap split, surviving page numbers, space-only indentation flattening, mixed-font grouping edge cases).

FR-03 Image Detection & Preservation: Implemented
- Extracted page images are preserved and rendered inline in reflowed reading order.

FR-04 Theme Switching & Persistence: Implemented
- Light/Dark/Greyscale modes with persistent local preference storage.

FR-05 Auto-Reader (Text-to-Speech): Not Implemented

FR-06 Fast Reader (RSVP) with Pacing Control: Not Implemented

FR-07 Bookmarks & Progress Persistence: Partial
- Implemented: auto progress save, manual bookmarks, bookmark list/jump/delete, reading progress slider.
- Partial/Missing: resume confirmation prompt is not yet implemented.

Non-Functional Snapshot
- Privacy (client-side only): Implemented.
- Performance KPI (<10 seconds for 300 pages): Not yet benchmark-validated.

9. Approved Enhancement: Home Library (MVP)
Goal: Add a dedicated library home page where uploaded PDFs are saved locally and displayed with title + cover image.

Scope
- Add `/library` as the default home route.
- Persist uploaded PDFs in browser IndexedDB (blob + metadata).
- Show library cards with PDF file name and generated first-page cover thumbnail.
- Allow opening a saved document into `/reader/[docId]`.
- Allow deleting saved documents from the local library.

Data Model (Local)
- `docId`: stable document id
- `fileName`: uploaded filename
- `fileSize`: bytes
- `uploadedAt`: timestamp
- `lastOpenedAt`: timestamp
- `thumbnailDataUrl`: first-page thumbnail data URL
- `blob`: original PDF binary

Storage/Privacy Constraints
- All storage remains local to the browser/device.
- No cloud sync in MVP.
- Storage is quota-limited by the browser; app should remain functional even if save fails.

Out Of Scope (MVP)
- Cross-device sync/account system.
- Backfill migration from legacy progress/bookmark-only entries.
- Auto-reader / fast-reader implementation.

