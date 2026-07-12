#!/bin/bash
# استخراج اللوجو الدائري الأصلي بدون تغيير ألوان — من الملف المصدر فقط
set -euo pipefail
SRC="${1:-/opt/cursor/artifacts/assets/naiosh-logo.png}"
OUT="${2:-public/naiosh-logo.png}"
python3 << PY
from PIL import Image, ImageDraw
import numpy as np

src = "$SRC"
out = "$OUT"
img = Image.open(src).convert("RGBA")
w, h = img.size
cx, cy, radius = w // 2, 907, 509
left, top, side = cx - radius, cy - radius, radius * 2
crop = img.crop((left, top, left + side, top + side))
arr = np.array(crop)
ch, cw = arr.shape[:2]
mask = Image.new("L", (cw, ch), 0)
ImageDraw.Draw(mask).ellipse([0, 0, cw - 1, ch - 1], fill=255)
mask_f = np.array(mask).astype(np.float32) / 255.0
arr[..., 3] = (arr[..., 3].astype(np.float32) * mask_f).astype(np.uint8)
Image.fromarray(arr, "RGBA").resize((512, 512), Image.Resampling.LANCZOS).save(out, "PNG")
print("saved", out)
PY
