# QIC B2C Non-Motor — demo landing

A static demo of the Home Contents Insurance landing page and the first step of
its quote flow. No build step, no dependencies: open `index.html` in a browser
and it runs.

## Running it

Open `index.html` directly, or serve the folder if you prefer real URLs:

```
python3 -m http.server 8000
```

Then go to <http://localhost:8000>.

## What is in here

| Path | What it is |
| --- | --- |
| `index.html` | The landing page: hero, owners flow, real cases, what's covered, claim steps, app banner, Why QIC, articles, reviews, FAQ, footer |
| `property.html` | Step 1 of the quote flow, "About property" |
| `css/tokens.css` | Design tokens taken from the live portal, qic.online |
| `css/base.css` | Font faces, reset, type scale |
| `css/components.css` | Everything on the landing page |
| `css/flow.css` | The quote flow: header, fields, summary, loading skeleton |
| `js/main.js` | Hero slider, the illustration that follows it, the A/B switch |
| `js/state.js` | Quote data shared between the landing and the flow |
| `js/flow.js` | Step 1 behaviour |
| `assets/` | Fonts and images |

## Things worth knowing

**The first block is an A/B test.** Variant A is a form card beside the
illustration; variant B is a centred headline over a full-bleed base. The
floating switch in the bottom-right corner swaps them, the choice is remembered
per browser, and `?hero=a` or `?hero=b` pins one for a link you want to share.

**The landing hands data to the flow.** Both variants' call-to-action buttons
lead to `property.html`, but only once the landing has what it asks for —
variant A needs a phone number and a contents value, variant B only the value,
since it has no phone field. The value travels in `sessionStorage` and in the
query string, so `property.html?value=250000` opens with that number already in
place.

**Step 1 opens with a skeleton.** It stands in for the screen for 900 ms, then
the content fades in. The duration is `SKELETON_MS` at the top of `js/flow.js`.

**Nothing is wired to a backend.** Prices, reviews and copy are fixed; Continue
on step 1 only saves what the step collected, because steps 2 and 3 do not
exist yet.

## Where the design comes from

Layout follows the Figma file *B2C • Non-Motor* (desktop frame `35648:19413`,
mobile `35648:18761`, flow step `35665:99718`). Colours, radii and shadows are
not eyeballed: they are the real CSS custom properties scraped from qic.online
into `css/tokens.css`, so they should stay in step with production.

Desktop is built against a 1440 frame with a 1088 content column; there is a
full mobile pass at 390. Widths in between fall back gracefully but have no
frame of their own.

## Before sharing this outside the team

The renders, icons and the PP Neue Montreal font files come from QIC's own
design system and production site. Keep the repository private unless those are
replaced.
