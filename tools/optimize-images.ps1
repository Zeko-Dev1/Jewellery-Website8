# ─────────────────────────────────────────────────────────────
# Bizhuteria Fantazia — image optimizer
#
# Converts big photos (iPhone JPGs etc.) into fast web copies:
#   900px wide, JPEG quality 78  →  images\opt\<name>-900.jpg
#
# USAGE (from the project folder, in PowerShell):
#   .\tools\optimize-images.ps1  images\IMG_1234.jpg
#   .\tools\optimize-images.ps1  images\*.jpg          (all at once)
#
# Then in index.html use:  src="images/opt/IMG_1234-900.jpg"
# NOTE: .HEIC files must be converted to .jpg first (iPhone:
# Settings > Camera > Formats > Most Compatible, or export as JPEG).
# ─────────────────────────────────────────────────────────────
[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true, Position = 0)]
    [string[]]$Paths,
    [int]$Width = 900,
    [int]$Quality = 78
)

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $projectRoot "images\opt"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

$files = @()
foreach ($p in $Paths) { $files += Get-Item $p -ErrorAction SilentlyContinue }
if (-not $files) { Write-Host "No matching files found." -ForegroundColor Yellow; exit 1 }

foreach ($file in $files) {
    if ($file.Extension -match 'heic') {
        Write-Host "SKIP  $($file.Name)  (convert HEIC to JPG first)" -ForegroundColor Yellow
        continue
    }
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
    } catch {
        Write-Host "SKIP  $($file.Name)  (not a readable image)" -ForegroundColor Yellow
        continue
    }
    try {
        if ($img.Width -le $Width) { $w = $img.Width; $h = $img.Height }
        else { $w = $Width; $h = [int][Math]::Round($img.Height * ($Width / $img.Width)) }

        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::White)
        $g.DrawImage($img, 0, 0, $w, $h)
        $g.Dispose()

        $name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $outPath = Join-Path $outDir "$name-$Width.jpg"
        $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
        $bmp.Save($outPath, $jpegCodec, $ep)
        $bmp.Dispose()

        $kb = [Math]::Round((Get-Item $outPath).Length / 1KB)
        Write-Host ("OK    {0}  ->  images\opt\{1}-{2}.jpg  ({3} KB)" -f $file.Name, $name, $Width, $kb) -ForegroundColor Green
    } finally {
        $img.Dispose()
    }
}
Write-Host ""
Write-Host "Done. Use src=""images/opt/<name>-$Width.jpg"" in index.html." -ForegroundColor Cyan
