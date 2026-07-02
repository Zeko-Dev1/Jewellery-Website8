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
| `images/opt/` | **Web-optimized images — the site uses these.** Originals stay in `images/`. |

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
   placeholder). When you have photos: resize to ~900px wide JPEG (quality ~78) and
   put them in `images/opt/`, then fill in the `src`.
6. **Business location** — legal pages currently say the business is based in
   **Albania** with Albanian governing law. If that's wrong, fix `privacy.html` §1
   and `terms.html` §1/§9.

## Notes

- Images in `images/opt/` are generated from the originals (900–1600px, JPEG q78).
  Never link the multi-MB originals directly — they destroy page speed.
- `.HEIC` files in `images/` are unused by the site (iPhone originals). Safe to keep or archive.
- Prices exist in the HTML but are hidden site-wide by CSS
  (`.prod-price-wrap … display:none`) — remove that CSS block in `index.css`
  (search "No prices shown on site") to show prices again.
- The flash-sale countdown is hidden by CSS (`#cdWrap`); its JS auto-skips while hidden.
