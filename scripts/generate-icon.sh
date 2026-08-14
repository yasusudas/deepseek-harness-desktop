#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets"
ICONSET="$ASSETS/icon.iconset"
BG="#FFFFFF"
LOGO_SIZE=620

find_favicon() {
  if [ -n "${DSH_FAVICON:-}" ] && [ -f "$DSH_FAVICON" ]; then echo "$DSH_FAVICON"; return 0; fi
  for path in \
    "$ROOT/bundle/dsh/lib/node_modules/@deepseek-ai/dsh-web-frontend/dist/favicon.svg" \
    "$ROOT/assets/favicon.svg" \
    "$(npm root -g 2>/dev/null)/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/favicon.svg"; do
    if [ -f "$path" ]; then echo "$path"; return 0; fi
  done
  return 1
}

to_opaque_rgba() {
  local src="$1"
  local dest="$2"
  magick "$src" \
    -colorspace sRGB \
    -background "$BG" -alpha remove \
    -alpha set -channel A -evaluate set 100% +channel \
    -type TrueColorAlpha -depth 8 \
    -define png:color-type=6 \
    "$dest"
}

FAVICON="$(find_favicon)" || { echo "favicon.svg not found" >&2; exit 1; }
rm -rf "$ICONSET"
mkdir -p "$ICONSET"
cp "$FAVICON" "$ASSETS/favicon.svg"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Black whale, no color inversion
magick -density 384 "$FAVICON" -background none -resize "${LOGO_SIZE}x${LOGO_SIZE}" \
  -colorspace sRGB "$TMP/logo.png"

# Full-bleed white canvas. Must be 8-bit RGBA with opaque alpha so macOS
# applies the squircle mask (grayscale / no-alpha icons stay square).
magick -size 1024x1024 "xc:${BG}" -colorspace sRGB \
  "$TMP/logo.png" -gravity center -compose over -composite \
  -background "$BG" -alpha remove \
  -alpha set -channel A -evaluate set 100% +channel \
  -type TrueColorAlpha -depth 8 \
  -define png:color-type=6 \
  "$ASSETS/icon-1024.png"

for size in 16 32 128 256 512; do
  to_opaque_rgba "$ASSETS/icon-1024.png" "$TMP/base.png"
  magick "$TMP/base.png" -resize "${size}x${size}" -type TrueColorAlpha -define png:color-type=6 \
    "$ICONSET/icon_${size}x${size}.png"
  magick "$TMP/base.png" -resize "$((size * 2))x$((size * 2))" -type TrueColorAlpha -define png:color-type=6 \
    "$ICONSET/icon_${size}x${size}@2x.png"
done

iconutil -c icns "$ICONSET" -o "$ASSETS/icon.icns"
echo "Generated $ASSETS/icon.icns"
magick identify "$ASSETS/icon-1024.png"
