# Mark of Frame visual system

Approved reference: chat mockup `afterframe.html`, Afterframe Hall of Fame.

- Background #0d0d0e, surface #151516, text #f1eee8, secondary #a6a29b.
- Gold #c9ac73 for rankings and primary actions; burgundy #682b35 for progress; purple #b39adc for rewatches.
- Cormorant Garamond display typography, Noto Sans Thai reading and controls. Body 16px; regular controls 14px; metadata 12px minimum.
- Full-width cinematic featured image fades toward the reading area and the surrounding dark canvas. Five poster columns on desktop, two on mobile.
- Rank, score and personal memory sit together. Keep personal writing more prominent than synopsis.
- Fine-pointer cover hover reveals a short note; all details remain available by opening the title.
- Change featured artwork with a crossfade; poster transforms are subtle. Use CSS for this, with reduced-motion and pointer gating.
- Operate surfaces (forms, progress, filters) prioritize speed and clarity. Hall of Fame is the experience surface.
- Every sample record is labeled. Never turn demonstration counts or notes into claims about the user's history.

## User-directed revision — 21 November 2026

This revision supersedes the original Hall layout while preserving its palette and reading fonts.

- Text-only two-line wordmark: Entertaiment / MARK OF FRAME. No aperture or logo icon.
- Edge-to-edge featured cinema canvas, centered story/score/memory, compact Top 3 overlay and centered category controls above it.
- The decorative Hall of Frame heading sits below the canvas. Gold gradient, glow and dimensional lettering are explicitly requested, not generic decoration defaults.
- Racing Sans One is the self-hosted, italic game-like rank face. Multi-layer gold extrusion is consistent across posters, rows, detail views and annual winners.
- The showcase runs on a five-second slideshow, with working pause/resume, focus interruption and reduced-motion support. Pointer hover does not stop the requested continuous playback. Mist is a bounded, faint transform-only CSS layer; it stops under reduced motion.
- All-Time Ten defaults to ten posters in five desktop columns. Both Hall and Library offer a list view. Library defaults to full-width rows, with text/details left and score/rank right.
- Center page headings. English descriptions run one or two desktop lines, with natural mobile wrapping. Metadata and user-authored memories retain their language.
- Annual analysis, management and settings are operate/read surfaces: clear structure, factual counts, real empty states and no ambient movement behind forms.
