# ─────────────────────────────────────────────────────────────
# Bizhuteria Fantazia — product photo normalizer
#
# Every card box on the site has a fixed aspect ratio, but the raw
# photos range from 0.63 (tall) to 1.39 (wide). This tool reshapes
# each photo to the EXACT ratio of the box it is shown in, so the
# sharp photo always fills the card edge-to-edge:
#
#   1. finds the product (edge-energy bounding box on a thumbnail)
#   2. crops into the photo's own empty fabric backdrop as much as
#      possible (products end up a consistent size in the frame)
#   3. where the photo is too wide/tall to crop, extends the fabric
#      backdrop by mirroring + blurring the photo's own edges — the
#      pad reads as out-of-focus backdrop, never a "ghost" product
#   4. resizes to web size and recompresses (originals are ~2-3 MB,
#      output is ~100-200 KB)
#
# Outputs to images\product-fit\  (originals in images\product are
# never touched). Variants per placement:
#   <name>.jpg        3:4   grid cards          (900 px wide)
#   <name>-feat.jpg   3:2   featured grid card  (1560 px wide)
#   <name>-na.jpg     21:20 New Arrivals cards  (1200 px wide)
#   <name>-sale.jpg   2:3   Special Edition     (960 px wide)
#
# USAGE (from the project folder):  .\tools\normalize-product-images.ps1
# ─────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'

$csharp = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ProdFit
{
    // ── EXIF orientation (tag 274): browsers honor it, GDI+ does not ──
    static void ApplyExifOrientation(Bitmap b)
    {
        const int TAG = 274;
        foreach (int id in b.PropertyIdList)
        {
            if (id != TAG) continue;
            int o = b.GetPropertyItem(TAG).Value[0];
            switch (o)
            {
                case 3: b.RotateFlip(RotateFlipType.Rotate180FlipNone); break;
                case 6: b.RotateFlip(RotateFlipType.Rotate90FlipNone);  break;
                case 8: b.RotateFlip(RotateFlipType.Rotate270FlipNone); break;
            }
            b.RemovePropertyItem(TAG);
            return;
        }
    }

    // ── product bounding box, found on a ~200px thumbnail ──
    // A pixel is "product" if it has a hard edge (crystal/metal sparkle),
    // strong chroma difference vs the backdrop, or is much darker than it
    // (mannequins, dark metal, velvet stands). Fabric folds are soft
    // gradients and stay below the thresholds. Marks are eroded, then
    // grouped into connected components; only components reaching the
    // central 70% of the frame count — this drops backdrop seams and
    // shadows in the frame corners.
    static Rectangle DetectBBox(Bitmap src)
    {
        int W = src.Width, H = src.Height;
        int tw = 200, th = Math.Max(1, (int)Math.Round(200.0 * H / W));
        bool[] keep;
        using (Bitmap thumb = new Bitmap(tw, th, PixelFormat.Format24bppRgb))
        {
            using (Graphics g = Graphics.FromImage(thumb))
            {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.DrawImage(src, 0, 0, tw, th);
            }
            BitmapData d = thumb.LockBits(new Rectangle(0, 0, tw, th),
                ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
            int stride = d.Stride;
            byte[] px = new byte[stride * th];
            Marshal.Copy(d.Scan0, px, 0, px.Length);
            thumb.UnlockBits(d);

            // backdrop model: median border color
            var bs = new System.Collections.Generic.List<byte>();
            var gs = new System.Collections.Generic.List<byte>();
            var rs = new System.Collections.Generic.List<byte>();
            int ring = 12;
            for (int y = 0; y < th; y++)
                for (int x = 0; x < tw; x++)
                {
                    if (x >= ring && x < tw - ring && y >= ring && y < th - ring) continue;
                    int i = y * stride + x * 3;
                    bs.Add(px[i]); gs.Add(px[i + 1]); rs.Add(px[i + 2]);
                }
            bs.Sort(); gs.Sort(); rs.Sort();
            int bgB = bs[bs.Count / 2], bgG = gs[gs.Count / 2], bgR = rs[rs.Count / 2];

            byte[] lum = new byte[tw * th];
            for (int y = 0; y < th; y++)
                for (int x = 0; x < tw; x++)
                {
                    int i = y * stride + x * 3;
                    lum[y * tw + x] = (byte)((px[i] * 29 + px[i + 1] * 150 + px[i + 2] * 77) >> 8);
                }
            bool[] mark = new bool[tw * th];
            for (int y = 1; y < th - 1; y++)
                for (int x = 1; x < tw - 1; x++)
                {
                    int i = y * stride + x * 3;
                    int c = lum[y * tw + x];
                    int e = Math.Max(Math.Abs(lum[y * tw + x + 1] - c),
                                     Math.Abs(lum[(y + 1) * tw + x] - c));
                    int db = px[i] - bgB, dg = px[i + 1] - bgG, dr = px[i + 2] - bgR;
                    int mean = (db + dg + dr) / 3;
                    int chroma = Math.Abs(db - mean) + Math.Abs(dg - mean) + Math.Abs(dr - mean);
                    int dark = Math.Max(0, -mean);
                    if (e > 22 || chroma > 24 || dark > 60) mark[y * tw + x] = true;
                }
            // erode lone speckle (fabric noise): need >=3 marked neighbours
            bool[] er = new bool[tw * th];
            for (int y = 1; y < th - 1; y++)
                for (int x = 1; x < tw - 1; x++)
                {
                    if (!mark[y * tw + x]) continue;
                    int n = 0;
                    for (int yy = -1; yy <= 1; yy++)
                        for (int xx = -1; xx <= 1; xx++)
                            if ((xx != 0 || yy != 0) && mark[(y + yy) * tw + x + xx]) n++;
                    if (n >= 3) er[y * tw + x] = true;
                }
            // connected components (8-conn BFS); keep those touching the
            // central 70% region and bigger than a few pixels
            int cx0 = (int)(tw * 0.15), cx1 = (int)(tw * 0.85);
            int cy0 = (int)(th * 0.15), cy1 = (int)(th * 0.85);
            keep = new bool[tw * th];
            bool[] seen = new bool[tw * th];
            int[] queue = new int[tw * th];
            var comp = new System.Collections.Generic.List<int>();
            for (int s = 0; s < tw * th; s++)
            {
                if (!er[s] || seen[s]) continue;
                int head = 0, tail = 0;
                queue[tail++] = s; seen[s] = true;
                comp.Clear();
                bool central = false;
                while (head < tail)
                {
                    int p = queue[head++];
                    comp.Add(p);
                    int py = p / tw, pxx = p % tw;
                    if (pxx >= cx0 && pxx <= cx1 && py >= cy0 && py <= cy1) central = true;
                    for (int yy = -1; yy <= 1; yy++)
                        for (int xx = -1; xx <= 1; xx++)
                        {
                            int ny = py + yy, nx = pxx + xx;
                            if (ny < 0 || ny >= th || nx < 0 || nx >= tw) continue;
                            int q = ny * tw + nx;
                            if (er[q] && !seen[q]) { seen[q] = true; queue[tail++] = q; }
                        }
                }
                if (central && comp.Count >= 4)
                    foreach (int p in comp) keep[p] = true;
            }
        }
        int x0f = -1, x1f = -1, y0f = -1, y1f = -1;
        for (int y = 0; y < th; y++)
            for (int x = 0; x < tw; x++)
                if (keep[y * tw + x])
                {
                    if (x0f < 0 || x < x0f) x0f = x;
                    if (x > x1f) x1f = x;
                    if (y0f < 0 || y < y0f) y0f = y;
                    if (y > y1f) y1f = y;
                }
        if (x0f < 0) return new Rectangle(0, 0, W, H);

        // safety: product is always at least near the frame center
        x0f = Math.Min(x0f, (int)(tw * 0.42)); x1f = Math.Max(x1f, (int)(tw * 0.58));
        y0f = Math.Min(y0f, (int)(th * 0.42)); y1f = Math.Max(y1f, (int)(th * 0.58));

        double kx = (double)W / tw, ky = (double)H / th;
        int margin = (int)(0.03 * Math.Max(W, H));
        int bx = Math.Max(0, (int)(x0f * kx) - margin);
        int by = Math.Max(0, (int)(y0f * ky) - margin);
        int bx2 = Math.Min(W, (int)((x1f + 1) * kx) + margin);
        int by2 = Math.Min(H, (int)((y1f + 1) * ky) + margin);
        return new Rectangle(bx, by, bx2 - bx, by2 - by);
    }

    static ImageCodecInfo JpegCodec()
    {
        foreach (ImageCodecInfo c in ImageCodecInfo.GetImageEncoders())
            if (c.MimeType == "image/jpeg") return c;
        return null;
    }

    // draw src[srcRect] into dest area (dx,dy,dw,dh), optionally flipped
    static void DrawStrip(Graphics g, Bitmap src, Rectangle srcRect,
                          float dx, float dy, float dw, float dh, bool flipX, bool flipY)
    {
        PointF ul = new PointF(flipX ? dx + dw : dx, flipY ? dy + dh : dy);
        PointF ur = new PointF(flipX ? dx : dx + dw, flipY ? dy + dh : dy);
        PointF ll = new PointF(flipX ? dx + dw : dx, flipY ? dy : dy + dh);
        g.DrawImage(src, new PointF[] { ul, ur, ll }, srcRect, GraphicsUnit.Pixel);
    }

    public static string Process(string srcPath, string dstPath, double ratio,
                                 int outW, int quality, double fill)
    {
        using (Bitmap src = new Bitmap(srcPath))
        {
            ApplyExifOrientation(src);
            int W = src.Width, H = src.Height;
            Rectangle bbox = DetectBBox(src);

            // Window sizing, crop-first:
            //   loW = smallest ratio-true window still containing the product
            //   fitW = window that puts the product at the target fill fraction
            //   hiW = largest ratio-true window that fits inside the photo
            // If the product fits inside the photo at this ratio (loW<=hiW) we
            // crop — no synthetic pixels at all. Only when even the full photo
            // cannot contain the product at this ratio do we pad the backdrop.
            double loW = Math.Max(bbox.Width * 1.02, bbox.Height * 1.02 * ratio);
            double fitW = Math.Max(bbox.Width / fill, bbox.Height / fill * ratio);
            double hiW = Math.Min(W, H * ratio);
            double w = (loW <= hiW) ? Math.Min(Math.Max(fitW, loW), hiW) : loW;
            double h = w / ratio;

            double cx = bbox.X + bbox.Width / 2.0, cy = bbox.Y + bbox.Height / 2.0;
            double sx = (w >= W) ? (W - w) / 2.0 : Math.Max(0, Math.Min(W - w, cx - w / 2.0));
            double sy = (h >= H) ? (H - h) / 2.0 : Math.Max(0, Math.Min(H - h, cy - h / 2.0));

            // visible portion of the source inside the window
            int isx = (int)Math.Max(0, sx), isy = (int)Math.Max(0, sy);
            int iex = (int)Math.Min(W, sx + w), iey = (int)Math.Min(H, sy + h);
            int iw = iex - isx, ih = iey - isy;
            bool hasPads = (sx < -0.5) || (sy < -0.5) || (sx + w > W + 0.5) || (sy + h > H + 0.5);

            // work canvas: 2× the output for quality, never upscale the source
            int workW = (int)Math.Min(outW * 2, Math.Max(outW, w));
            int workH = (int)Math.Round(workW / ratio);
            double k = workW / w;

            float mx = (float)((isx - sx) * k), my = (float)((isy - sy) * k);
            float mw = (float)(iw * k), mh = (float)(ih * k);

            using (Bitmap canvas = new Bitmap(workW, workH, PixelFormat.Format24bppRgb))
            {
                using (Graphics g = Graphics.FromImage(canvas))
                {
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.SmoothingMode = SmoothingMode.HighQuality;

                    if (hasPads)
                    {
                        // corner catch-all: cover-fit of the whole photo (blurred later)
                        double cs = Math.Max((double)workW / W, (double)workH / H);
                        g.DrawImage(src, (float)((workW - W * cs) / 2), (float)((workH - H * cs) / 2),
                                    (float)(W * cs), (float)(H * cs));

                        // mirror the photo's own edges into the pads (fabric continues)
                        if (my > 0.5)
                        {
                            int strip = Math.Min(ih, Math.Max(1, (int)(my / k)));
                            DrawStrip(g, src, new Rectangle(isx, isy, iw, strip), mx, 0, mw, my, false, true);
                        }
                        if (my + mh < workH - 0.5)
                        {
                            int strip = Math.Min(ih, Math.Max(1, (int)((workH - my - mh) / k)));
                            DrawStrip(g, src, new Rectangle(isx, iey - strip, iw, strip),
                                      mx, my + mh, mw, workH - my - mh, false, true);
                        }
                        if (mx > 0.5)
                        {
                            int strip = Math.Min(iw, Math.Max(1, (int)(mx / k)));
                            DrawStrip(g, src, new Rectangle(isx, isy, strip, ih), 0, my, mx, mh, true, false);
                        }
                        if (mx + mw < workW - 0.5)
                        {
                            int strip = Math.Min(iw, Math.Max(1, (int)((workW - mx - mw) / k)));
                            DrawStrip(g, src, new Rectangle(iex - strip, isy, strip, ih),
                                      mx + mw, my, workW - mx - mw, mh, true, false);
                        }
                    }

                    // the real (cropped) photo on top
                    g.DrawImage(src, new RectangleF(mx, my, mw, mh),
                                new RectangleF(isx, isy, iw, ih), GraphicsUnit.Pixel);
                }

                if (hasPads)
                {
                    // blur the pads: sharp at the seam (mirror is continuous there),
                    // fully out-of-focus deeper in; noise added to stop JPEG banding
                    int bw = Math.Max(1, workW / 14), bh = Math.Max(1, workH / 14);
                    using (Bitmap blurred = new Bitmap(workW, workH, PixelFormat.Format24bppRgb))
                    {
                        using (Bitmap small = new Bitmap(bw, bh, PixelFormat.Format24bppRgb))
                        {
                            using (Graphics gs = Graphics.FromImage(small))
                            {
                                gs.InterpolationMode = InterpolationMode.HighQualityBilinear;
                                gs.DrawImage(canvas, 0, 0, bw, bh);
                            }
                            using (Graphics gb = Graphics.FromImage(blurred))
                            {
                                gb.InterpolationMode = InterpolationMode.HighQualityBilinear;
                                gb.PixelOffsetMode = PixelOffsetMode.HighQuality;
                                gb.DrawImage(small, 0, 0, workW, workH);
                            }
                        }

                        Rectangle all = new Rectangle(0, 0, workW, workH);
                        BitmapData dc = canvas.LockBits(all, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
                        BitmapData db = blurred.LockBits(all, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
                        int stride = dc.Stride;
                        byte[] pc = new byte[stride * workH];
                        byte[] pb = new byte[stride * workH];
                        Marshal.Copy(dc.Scan0, pc, 0, pc.Length);
                        Marshal.Copy(db.Scan0, pb, 0, pb.Length);

                        float top = my, bot = my + mh, lef = mx, rig = mx + mw;
                        float rTop = Math.Max(1f, top * 0.7f);
                        float rBot = Math.Max(1f, (workH - bot) * 0.7f);
                        float rLef = Math.Max(1f, lef * 0.7f);
                        float rRig = Math.Max(1f, (workW - rig) * 0.7f);

                        for (int y = 0; y < workH; y++)
                        {
                            float myy = 0;
                            if (y < top) myy = Math.Min(1f, (top - y) / rTop);
                            else if (y > bot) myy = Math.Min(1f, (y - bot) / rBot);
                            for (int x = 0; x < workW; x++)
                            {
                                float m = myy;
                                if (x < lef) m = Math.Max(m, Math.Min(1f, (lef - x) / rLef));
                                else if (x > rig) m = Math.Max(m, Math.Min(1f, (x - rig) / rRig));
                                if (m <= 0f) continue;
                                int i = y * stride + x * 3;
                                int n = (((x * 73856093) ^ (y * 19349663)) >> 13) % 5 - 2; // ±2 dither
                                for (int c = 0; c < 3; c++)
                                {
                                    int v = (int)(pc[i + c] * (1 - m) + pb[i + c] * m + n * m);
                                    pc[i + c] = (byte)(v < 0 ? 0 : (v > 255 ? 255 : v));
                                }
                            }
                        }
                        Marshal.Copy(pc, 0, dc.Scan0, pc.Length);
                        canvas.UnlockBits(dc);
                        blurred.UnlockBits(db);
                    }
                }

                // final resize + save
                int outH = (int)Math.Round(outW / ratio);
                using (Bitmap outBmp = new Bitmap(outW, outH, PixelFormat.Format24bppRgb))
                {
                    using (Graphics og = Graphics.FromImage(outBmp))
                    {
                        og.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        og.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        og.CompositingQuality = CompositingQuality.HighQuality;
                        og.DrawImage(canvas, 0, 0, outW, outH);
                    }
                    EncoderParameters ep = new EncoderParameters(1);
                    ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)quality);
                    outBmp.Save(dstPath, JpegCodec(), ep);
                }

                int padPct = (int)Math.Round(100.0 * (1.0 - (double)iw * ih / (w * h)));
                int cropPct = (int)Math.Round(100.0 * (1.0 - (double)iw * ih / ((double)W * H)));
                return string.Format("pad {0,2}%  crop {1,2}%", padPct, Math.Max(0, cropPct));
            }
        }
    }
}
'@
if (-not ([System.Management.Automation.PSTypeName]'ProdFit').Type) {
    Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing
}

$root   = Split-Path $PSScriptRoot -Parent
$srcDir = Join-Path $root 'images\product'
$outDir = Join-Path $root 'images\product-fit'
New-Item -ItemType Directory -Force $outDir | Out-Null

# grid cards — 3:4 (matches .prod-visual aspect-ratio in index.css)
$grid = Get-ChildItem "$srcDir\*.jpg" | Where-Object { $_.BaseName -notmatch '^(Komplet|IMG_) ?' }
# featured card — 3:2 ; New Arrivals — 21:20 ; Special Edition — 2:3
$na   = @('Kuror Shum Shitur', 'Or Shum Shitur', 'Kollan Shum Shitur', 'Gjerdan Shum Shitur 1')
$feat = @('Kuror Shum Shitur')
$sale = @('Komplet 1', 'Komplet 2', 'Komplet 3')

$jobs = @()
foreach ($f in $grid) { $jobs += ,@($f.FullName, (Join-Path $outDir "$($f.BaseName).jpg"),      0.75,   900, 82, 0.84) }
foreach ($n in $feat) { $jobs += ,@("$srcDir\$n.jpg", (Join-Path $outDir "$n-feat.jpg"),        1.5,   1560, 82, 0.80) }
foreach ($n in $na)   { $jobs += ,@("$srcDir\$n.jpg", (Join-Path $outDir "$n-na.jpg"),          1.05,  1200, 82, 0.82) }
foreach ($n in $sale) { $jobs += ,@("$srcDir\$n.jpg", (Join-Path $outDir "$n-sale.jpg"),        0.6667, 960, 82, 0.92) }

foreach ($j in $jobs) {
    $info = [ProdFit]::Process($j[0], $j[1], $j[2], $j[3], $j[4], $j[5])
    $kb = [int]((Get-Item $j[1]).Length / 1KB)
    Write-Host ("{0,-34} {1}  {2,5} KB" -f (Split-Path $j[1] -Leaf), $info, $kb)
}
Write-Host "`nDone -> images\product-fit\" -ForegroundColor Cyan