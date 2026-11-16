# Brand system

Tokens: `src/styles/tokens.css` (change values there, never at a call site).

| role | value | use |
|---|---|---|
| night (live site navy) | `#071528` | base plane |
| teal (live site) | `#52EBC8` | Whitehall, primary buttons (dark text `#04261F` on it) |
| orchid (live site) | `#D369FF` | Menands, Rewards |
| aurora | `#C25CFF → #8A6BFF → #4089FF → #2EC4FF → #55FFD6` | the badge's spike gradient: topbar, one accent word per heading |
| lamplight | amber `#FFB45E`, lamp `#FFD9A3`, clapboard `#B23C32` | inside-the-store bands |
| paper | `#F6EFE3` with ink `#17202E` | the light band (about + FAQ) |

Type: Fraunces (display, open stand-in for Vallejo Black) and Jost (body, open stand-in for Futura Book), self-hosted
woff2 in `src/assets/fonts/` (SIL OFL).

Photos: the Northern Lights frame (aurora ring, spike crown, moon and stars from the badge; `src/styles/frames.css`).
Never paper, tape, polaroids, scrapbook or graffiti treatments.

Shapes: buttons 12px radius (not pills), cards 18px, frames 28px, panels 44px; chips stay pill-shaped.
Marks: the client's round badge, wordmark, NL monogram and spike icon (`src/assets/brand/`), resized only.
