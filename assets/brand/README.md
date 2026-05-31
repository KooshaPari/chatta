# chatta Brand

**AI-CODED, not AI-generated.** The mark is hand-authored as a vector
[`logo.svg`](./logo.svg) (paths/shapes written by hand). No image-generation
model was used. Raster formats are exported deterministically from the SVG.

## The mark

Two overlapping **chat bubbles** forming a live conversation — a pink->purple
back bubble (the other speaker) and a cyan->indigo front bubble (you) carrying
three white **typing dots** — on a dark rounded app tile.

## Files

| File | Purpose |
|------|---------|
| `logo.svg` | Source of truth (hand-coded vector) |
| `logo-{16,32,48,128,256,512}.png` | Raster sizes |
| `logo.png` | Canonical 512px PNG |
| `logo.jpg` | 512px, white matte |
| `app.ico` | Multi-resolution Windows icon (16/32/48/256) — feeds the Start-Menu / desktop shortcut |

## Regenerating

```powershell
pwsh tools/Export-Brand.ps1
```

Renderer preference matches the Civis pure-Rust SVG convention (RND-016):
**resvg** (canonical), falling back to `rsvg-convert` -> ImageMagick ->
Python/cairosvg+Pillow. ICO/JPG assembly uses ImageMagick when present, else Pillow.
