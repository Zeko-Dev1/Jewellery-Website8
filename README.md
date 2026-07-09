# Bizhuteria Fantazia — Website

Static bilingual (SQ/EN) jewellery showcase site. No build step — deploy the folder as-is
(GitHub Pages, Netlify, Vercel, or any static host).

## Files

| File | Purpose |
|---|---|
| `index.html` | Main page (all sections) |
| `index.css` | All styles |
| `script.js` | Language toggle, nav, filters, reveal animations |
| `privacy.html` / `terms.html` | Legal pages (bilingual) |
| `404.html` | Branded "not found" page |
| `robots.txt` / `sitemap.xml` | Search engine files |
| `images/product/` | Product-card photos, one file per product (e.g. `kurore-ari.jpg`) |
| `images/section/` | Page section photos: `hero.jpg` / `hero-mobile.jpg`, `heritage-1/2/3.jpg`, `story.jpg` |
| `images/instagram/` | The 6 Instagram-wall photos (`instagram-1.jpg` … `instagram-6.jpg`) |
| `images/icons/` | Logo, favicon, and app icons |

All four folders above hold **web-optimized copies** (900–1600px, JPEG q78) —
the site only ever links these. Full-size originals and `.HEIC` files stay in
`images/` itself as source material and are never linked directly.

## 🚀 Launch checklist (do these before going live)

1. **Domain** — replace every `https://yourdomain.com/` with your real domain in:
   `index.html` (canonical, og:url, og:image, JSON-LD), `robots.txt`, `sitemap.xml`.
2. **Instagram / TikTok** — replace every `yourbrand` with your real handles in
   `index.html`, `privacy.html`, `terms.html` (search for `yourbrand`).
   Also update the visible `@yourbrand` text in the Instagram section and footer.
3. **Email** — confirm `info@bizhuteriafantazia.com` is a real inbox, or change it
   (in `index.html` footer, `privacy.html`, `terms.html`).
4. **Google Search Console** — verify your site, then uncomment the
   `google-site-verification` meta tag in `index.html` and paste your code.
   Submit `sitemap.xml` in Search Console.
5. **Product photos** — many product cards have `src=""` (they show the gold line-art
   placeholder). When you have photos, run the included optimizer so they never slow
   the site down:
   ```powershell
   .\tools\optimize-images.ps1 images\IMG_1234.jpg      # one photo
   .\tools\optimize-images.ps1 images\*.jpg             # all photos
   ```
   It creates a fast copy in `images/opt/` (900px, ~150 KB). Move/rename that file
   into `images/product/<product-name>.jpg` and point the card's `src` at it. Never
   link the original multi-MB files. (iPhone .HEIC files must be converted to JPG first.)
6. **Business location** — legal pages say the business is based in
   **North Macedonia** with North Macedonian governing law (updated July 2026).
   Payment is cash on delivery; confirmed orders are not returnable.

## Catalog structure (July 2026)

The grid has exactly **49 cards** in this order: 20 kurora (10 white, 7 yellow,
1 gold, 1 red, 1 black) → 8 gjerdan (2 white, 2 yellow, 2 gold, 2 black) →
4 lule → 4 kollan → 2 hallka → 2 byzylykë → 2 orë → 3 vathë → 4 unaza.
Filter pills follow the same order. New Arrivals shows the 4 picked pieces
(white crown, yellow watch, gold kollan, white gjerdan). Special Edition shows
the 3 complete bridal-set photos (gold / black / alltan) — no sale pricing.

**24 cards still show the gold line-art placeholder** (kollan, hallka, watches,
bracelets, earrings, rings, Lule Zambaku, and the 3 Special Edition sets) —
no photos exist yet for these. Search `FOTO NË PRITJE` in index.html to find
every empty slot.

All `.HEIC` files that arrived in the project root have been converted to JPG
(via a pure-JS decoder, since this machine has no native HEIC codec) and
optimized. They now fill 8 gjerdan cards and 3 lule cards in `images/product/` —
including a gold coin/lira necklace set and two crystal hair-vine ("lule")
pieces that hadn't been placed before. The `.HEIC` originals are kept in the
project root; the full-size JPG copies live in `images/`.

**All cards now use properly optimized, descriptively-named photos** in
`images/product/` (e.g. `kurore-ari.jpg`, `gjerdan-jona.jpg`) — the old
`images/opt/IMG_XXXX-900.jpg` naming and the multi-MB full-size `src`s are
gone. `images/opt/` no longer exists.

## Notes

- `images/product/`, `images/section/`, `images/instagram/`, `images/icons/`
  hold the only images the site ever links (900–1600px, JPEG q78). Never link
  the multi-MB originals in `images/` directly — they destroy page speed.
- `.HEIC` files are unused by the site (iPhone originals). Safe to keep or archive.
- `tools/optimize-images.ps1` still writes its output into `images/opt/` by
  default (unchanged) — move/rename the result into `images/product/` (or
  `section`/`instagram`) afterward, or ask to have the tool updated to match.
- Prices exist in the HTML but are hidden site-wide by CSS
  (`.prod-price-wrap … display:none`) — remove that CSS block in `index.css`
  (search "No prices shown on site") to show prices again.
- The flash-sale countdown is hidden by CSS (`#cdWrap`); its JS auto-skips while hidden.
