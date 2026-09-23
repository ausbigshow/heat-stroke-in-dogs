#!/usr/bin/env python3
"""Generator for docs/lake-prop-dock.svg -> Assets/Image/Lake-Prop-Dock.png.

The dock is modelled on its own deck plane in "dock coordinates": u runs along the walkway
(0 = near end on the sand, 1 = far end over the water), v runs across it (0 = front edge
facing the camera, 1 = back edge). A homography maps that plane onto the four screen corners
of the original hand-tuned deck, so everything placed in (u, v) - planks, the T platform past
the walkway's end, posts, bollards - is perspective-correct by construction, including points
outside the unit square.

It matches Lake-POV-Dock.png (the same dock, first person): a straight walkway ending in a
wide T platform, square posts rising above the deck along both edges, heaviest at the near end.

    python3 docs/lake-prop-dock.py
    rsvg-convert -w 760 -h 420 docs/lake-prop-dock.svg -o Assets/Image/Lake-Prop-Dock.png
"""
from pathlib import Path

W, H = 760, 420

# Screen corners of the walkway deck (u, v) -> (x, y), from the previous hand-drawn dock.
CORNERS = {
    (0, 0): (678.0, 345.8),  # near, front
    (0, 1): (702.0, 298.2),  # near, back
    (1, 1): (100.6, 186.8),  # far, back
    (1, 0): (91.4, 205.2),   # far, front
}

# Palette sampled from Lake-POV-Dock.png - flat vector, nothing else (design-language §1).
PLANKS = ['#CBC1B7', '#D6CCC4', '#CBC1B7', '#DED5CE', '#CBC1B7', '#D6CCC4']
SEAM = '#8E8880'
POST = '#342216'
POST_LIT = '#896A55'
SHADOW = '#2A1B11'

WALK_END = 0.84           # the walkway stops here; the T platform takes u in [WALK_END, 1]
T_FRONT, T_BACK = -0.75, 1.75   # T platform extends past both walkway edges
SAND_U = 0.15             # the near ~15% of the deck is over sand: no posts there


def solve_homography():
    """Unit square -> screen quad (standard 8-unknown DLT, solved by Gaussian elimination)."""
    rows, rhs = [], []
    for (u, v), (x, y) in CORNERS.items():
        rows.append([u, v, 1, 0, 0, 0, -u * x, -v * x]); rhs.append(x)
        rows.append([0, 0, 0, u, v, 1, -u * y, -v * y]); rhs.append(y)
    n = 8
    m = [r + [b] for r, b in zip(rows, rhs)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(n):
            if r != c:
                f = m[r][c] / m[c][c]
                m[r] = [a - f * b for a, b in zip(m[r], m[c])]
    return [m[i][n] / m[i][i] for i in range(n)]


A, B, C, D, E, F, G, Hh = solve_homography()


def P(u, v):
    w = G * u + Hh * v + 1
    return ((A * u + B * v + C) / w, (D * u + E * v + F) / w)


def scale_at(u):
    """Screen length of one unit of v at depth u - the local size of the world."""
    (x0, y0), (x1, y1) = P(u, 0), P(u, 1)
    return ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5


def poly(pts, fill, extra=''):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}"{extra}/>'


def quad(u0, u1, v0, v1):
    return [P(u0, v0), P(u0, v1), P(u1, v1), P(u1, v0)]


out = []

# Fascia thickness, in the same units as scale_at (fraction of deck width).
FASCIA = 0.16


def fascia_along_u(u0, u1, v, steps=24):
    """Dark thickness band hanging below the deck edge at constant v, running along u."""
    top = [P(u0 + (u1 - u0) * i / steps, v) for i in range(steps + 1)]
    bot = [(x, y + FASCIA * scale_at(u0 + (u1 - u0) * i / steps)) for i, (x, y) in enumerate(top)]
    return poly(top + bot[::-1], POST)


def fascia_along_v(u, v0, v1):
    """Thickness band on an edge at constant u (the T platform's near-facing side)."""
    a, b = P(u, v0), P(u, v1)
    t = FASCIA * scale_at(u)
    return poly([a, b, (b[0], b[1] + t), (a[0], a[1] + t)], SHADOW)


def post(u, v, below=1.15, above=0.0, width=0.17):
    """A square post at deck point (u, v): down into the water, optionally up as a bollard."""
    s = scale_at(u)
    x, y = P(u, v)
    w = width * s
    top = y - above * s
    bottom = y + below * s
    parts = [
        f'<rect x="{x - w / 2:.1f}" y="{top:.1f}" width="{w:.1f}" height="{bottom - top:.1f}" fill="{POST}"/>',
        f'<rect x="{x + w / 6:.1f}" y="{top:.1f}" width="{w / 3:.1f}" height="{bottom - top:.1f}" fill="{POST_LIT}"/>',
    ]
    if above:
        parts.append(f'<rect x="{x - w / 2:.1f}" y="{top:.1f}" width="{w:.1f}" height="{w * 0.35:.1f}" fill="{SHADOW}"/>')
    if below and u > SAND_U:
        # wet line and a short soft reflection where the post meets the water
        parts.append(f'<rect x="{x - w / 2:.1f}" y="{bottom - w * 0.35:.1f}" width="{w:.1f}" height="{w * 0.35:.1f}" fill="{SHADOW}"/>')
        parts.append(f'<rect x="{x - w * 0.3:.1f}" y="{bottom:.1f}" width="{w * 0.6:.1f}" height="{0.35 * s:.1f}" fill="{SHADOW}" opacity="0.22"/>')
    return parts


# Posts under the walkway's front edge, back to front so near ones overlap far ones.
walk_posts = [u for u in (0.78, 0.66, 0.54, 0.43, 0.33, 0.24) if u > SAND_U]
for u in walk_posts:
    out += post(u, 0)

# T platform posts under its front corners (drawn before the deck so the deck overlaps them).
out += post(0.985, T_FRONT, below=1.1)
out += post(WALK_END + 0.01, T_FRONT, below=1.1)

# T platform deck: near-facing side band, front fascia, then the planks on top.
out.append(fascia_along_v(WALK_END, T_FRONT, 0))
out.append(fascia_along_u(WALK_END, 1.0, T_FRONT))
N_T = 5
for i in range(N_T):
    v0 = T_FRONT + (T_BACK - T_FRONT) * i / N_T
    v1 = T_FRONT + (T_BACK - T_FRONT) * (i + 1) / N_T
    # T planks run the other way: along u, stacked across v
    out.append(poly(quad(WALK_END, 1.0, v0, v1), PLANKS[i % len(PLANKS)]))
    if i:
        a, b = P(WALK_END, v0), P(1.0, v0)
        out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{SEAM}" stroke-width="{max(0.6, 0.03 * scale_at(0.92)):.2f}"/>')

# Walkway: front fascia, then cross planks, uniform in world so perspective shrinks them.
out.append(fascia_along_u(0.0, WALK_END, 0))
N = 26
for i in range(N):
    u0, u1 = WALK_END * i / N, WALK_END * (i + 1) / N
    out.append(poly(quad(u0, u1, 0, 1), PLANKS[i % len(PLANKS)]))
    a, b = P(u1, 0), P(u1, 1)
    out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{SEAM}" stroke-width="{max(0.6, 0.035 * scale_at(u1)):.2f}"/>')

# Bollards: square posts rising above the deck, as in the close-up. Back edge first (further
# from the camera), then the front edge, so front bollards overlap the deck.
for u in (0.0, 0.28, 0.56):
    out += post(u + 0.01, 1.0, below=0.0, above=0.55, width=0.24)
out += post(0.995, T_BACK, below=0.0, above=0.5)
for u in (0.0, 0.28, 0.56):
    out += post(u + 0.01, 0.0, below=0.0, above=0.55, width=0.24)
out += post(0.995, T_FRONT, below=0.0, above=0.5)
out += post(WALK_END + 0.01, T_FRONT, below=0.0, above=0.5)

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<g shape-rendering="geometricPrecision">', *out, '</g></svg>']
Path(__file__).with_suffix('.svg').write_text('\n'.join(svg) + '\n')
print('bbox check: near-front', P(0, 0), 'T far corners', P(1, T_FRONT), P(1, T_BACK))
