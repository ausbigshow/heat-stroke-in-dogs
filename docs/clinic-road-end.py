#!/usr/bin/env python3
"""Generator for Assets/Image/Clinic-RoadEnd.png — the clinic as the road's destination.

The Act 2 drive ends by pulling up to the clinic. The bare building cutout
(Clinic-Exterior-Approach.png) floated in the middle of the road, so this composites it onto
a setting: a paved lot where the road runs out, with a curb, parking bays converging on the
road's vanishing point, grass verges and trees behind. Flat vector colours only (design-
language §1), sampled from the regraded Car-FPV-Interior.jpg so the lot reads as the same
road. Left, right and bottom edges fade to transparent so the layer melts into the painted
road and fields while it grows.

    python3 docs/clinic-road-end.py
"""
from PIL import Image, ImageDraw, ImageFilter

SS = 2                         # supersample for clean edges
W, H = 2400, 1000
BASE_Y = 700                   # where the building's slab meets the lot
VP = (1200, 330)               # lot lines converge here (sits on the scene horizon at the end)

ASPHALT_FAR, ASPHALT_NEAR = (208, 200, 190), (192, 183, 172)
CURB = (228, 221, 208)
STRIPE = (240, 238, 232)
GRASS_FAR, GRASS_NEAR = (190, 202, 150), (160, 184, 118)
TREE, TREE_SHADE = (138, 162, 112), (116, 142, 96)
TREE_FAR = (170, 190, 150)

img = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
s = lambda pts: [(x * SS, y * SS) for x, y in pts]

def band(y0, y1, c0, c1, x0=0, x1=W):
    for y in range(y0 * SS, y1 * SS):
        t = (y - y0 * SS) / max(1, (y1 - y0) * SS)
        d.line([(x0 * SS, y), (x1 * SS, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(c0, c1)))

# trees behind the building: a pale far row, then fuller clumps at each side
def clump(cx, base, r, col, shade):
    for dx, dy, k in [(-0.9, -0.55, 0.75), (0.9, -0.5, 0.8), (0, -1.05, 0.95), (-0.45, -0.3, 0.9), (0.5, -0.25, 0.85)]:
        x, y, rr = cx + dx * r, base + dy * r, k * r
        d.ellipse(s([(x - rr, y - rr), (x + rr, y + rr)]), fill=col)
    d.rectangle(s([(cx - r * 1.6, base - r * 0.35), (cx + r * 1.6, base + 4)]), fill=shade)
for cx in range(520, 1950, 150):
    clump(cx, BASE_Y - 10, 70, TREE_FAR, TREE_FAR)
for cx, r in [(430, 120), (640, 95), (1760, 100), (1990, 125)]:
    clump(cx, BASE_Y, r, TREE, TREE_SHADE)

# grass verges out to the edges
band(BASE_Y - 30, H, GRASS_FAR, GRASS_NEAR)

# the lot: widens toward the car until it swallows the road
lot = [(560, BASE_Y - 8), (1840, BASE_Y - 8), (2900, H), (-500, H)]
for y in range(BASE_Y - 8, H):
    t = (y - (BASE_Y - 8)) / (H - BASE_Y + 8)
    xl = 560 + (-500 - 560) * t
    xr = 1840 + (2900 - 1840) * t
    c = tuple(round(a + (b - a) * t) for a, b in zip(ASPHALT_FAR, ASPHALT_NEAR))
    d.line([(xl * SS, y * SS), (xr * SS, y * SS)], fill=c, width=SS)
# far curb along the building front
d.polygon(s([(560, BASE_Y - 12), (1840, BASE_Y - 12), (1848, BASE_Y + 2), (552, BASE_Y + 2)]), fill=CURB)

# parking bays either side of the entrance, on rays from the vanishing point
def ray_seg(x_at_curb, y0, y1, w):
    k0, k1 = (y0 - VP[1]) / (BASE_Y - VP[1]), (y1 - VP[1]) / (BASE_Y - VP[1])
    xa = VP[0] + (x_at_curb - VP[0]) * k0
    xb = VP[0] + (x_at_curb - VP[0]) * k1
    d.line(s([(xa, y0), (xb, y1)]), fill=STRIPE, width=round(w * SS))
for x in [620, 740, 860, 980, 1420, 1540, 1660, 1780]:
    ray_seg(x, BASE_Y + 6, BASE_Y + 120, 5)
# bay end line
d.line(s([(560 - 40, BASE_Y + 120), (1840 + 40, BASE_Y + 120)]), fill=STRIPE, width=4 * SS)

# the building on its slab
bld = Image.open('Assets/Image/Clinic-Exterior-Approach.png').convert('RGBA')
bld = bld.crop(bld.split()[3].point(lambda a: 255 if a > 128 else 0).getbbox())  # ignore faint alpha noise
BW = 826
bld = bld.resize((BW * SS, round(bld.height * BW / bld.width) * SS), Image.LANCZOS)
# soft contact shadow
sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
ImageDraw.Draw(sh).ellipse(s([(1200 - BW * 0.56, BASE_Y - 14), (1200 + BW * 0.56, BASE_Y + 22)]), fill=(60, 50, 40, 70))
img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(10 * SS)))
img.alpha_composite(bld, ((1200 - BW // 2) * SS, BASE_Y * SS - bld.height + 6 * SS))

img = img.resize((W, H), Image.LANCZOS)

# fade left/right/bottom edges so the layer melts into the painting as it grows
alpha = img.split()[3]
fade = Image.new('L', (W, H), 255)
fd = ImageDraw.Draw(fade)
EDGE = 300
for x in range(EDGE):
    v = round(255 * x / EDGE)
    fd.line([(x, 0), (x, H)], fill=v)
    fd.line([(W - 1 - x, 0), (W - 1 - x, H)], fill=v)
bot = Image.new('L', (W, H), 255)
bd = ImageDraw.Draw(bot)
for y in range(H - 160, H):
    bd.line([(0, y), (W, y)], fill=round(255 * (H - 1 - y) / 160))
from PIL import ImageChops
alpha = ImageChops.multiply(ImageChops.multiply(alpha, fade), bot)
img.putalpha(alpha)
img.save('Assets/Image/Clinic-RoadEnd.png', optimize=True)
print('saved', img.size)
