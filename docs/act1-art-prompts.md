# Act 1 — art prompt set (9 assets)

Queued for the next image-generation window. Order matters: the **four POV plates first** —
they are full-bleed and carry the most screen time, so they are the biggest fidelity win.
The five props are smaller and the current vectors are serviceable in the meantime.

Every prompt below is meant to be sent with the **Shared spec** block prepended verbatim.
Do not paraphrase the hex values — see `feedback-read-locked-art-specs-first`.

---

## Shared spec — prepend to all nine

```
STYLE
Flat vector illustration. Solid fills and simple two-to-three-step shading only.
No gradients, no photographic texture, no line art or outlines, no cel-shade rim light,
no drop shadows baked into the subject. This must sit beside existing assets in the same
project (Check-Gums-Art.jpg, Tay-LayingLateralPanting.png, Clinic-TreatmentRoom-BG.jpg)
without reading as a different hand.

PALETTE — sampled from the scene plate these assets share (Lake-Blank.jpg)
  sky                 #74C9F7
  far hills           #ABE0F8
  lake water          #90B4B8
  sand                #EDC297
  grass, sunlit       #728452
  grass, in shade     #536340
  foliage             #40635A
Warm project palette for built objects: #F6D6C4, #E4BAA3, #5E3D2A, #382418, #8D6B53,
sage #6B8E6D, muted teal #366B77.
Stay inside these families. Do not introduce saturated primaries — the current placeholder
props use stock Tailwind blues and ambers and that mismatch is the whole reason for this
pass.

LIGHT
Single source, high and to the upper RIGHT. Every cast shadow falls down and to the LEFT.
Midday summer, ~96°F — the scene's premise is heat, so the light is hard and the shadows
are short and dense, not long and soft.

OUTPUT
No text, no numbers, no labels, no UI, no watermarks, no emoji, no borders or frames.
```

---

## A. The four POV close-up plates

These replace hand-coded inline SVG in `renderPovScene()` — currently ~16 primitives each,
which is the lowest-fidelity art anywhere in the module. Each is what **Tay** sees when she
investigates that lead, at a dog's eyeline, roughly 12–18 inches off the ground.

**Format for all four:** 1376 × 768 JPG, 16:9, full-bleed, no transparency.
**Tay is never in frame** — this is her point of view.
**Callie is never in frame** — Act 1 keeps her off-screen by design.

Each scene has to *sell its heat fact* without any text, because the truth stamp lands over
it a beat later.

### 1. `Lake-POV-Cooler.jpg` — "The Vault"
> Low dog's-eye view of a closed hard-sided picnic cooler standing in open grass, in full
> unbroken sun. The camera is close and low: the cooler fills the middle third of the
> frame and we look slightly UP at its lid, which is latched shut. Its cast shadow is a
> tight, dense pool on the grass immediately to its lower left — the sun is nearly
> overhead, so there is almost no shade to be had beside it. Blades of sunlit grass
> cross the bottom of frame. Behind it, out of focus in flat shapes only: a strip of dry
> sand and the lake's edge. Nothing in this frame is in shade. The point of the image is
> that the cold thing is sealed and the spot in front of it is baking.

### 2. `Lake-POV-Dock.jpg` — "High Ground"
> Low dog's-eye view along the top surface of a sun-bleached wooden dock, from standing on
> the sand at its landward end. Weathered gray-brown planks run away from the camera and
> narrow sharply toward a vanishing point on the lake's horizon. The boards are pale, dry
> and hot — visibly sun-scorched, with fine checking and knots, a much lighter and grayer
> wood than fresh timber. Heat shimmer distorts the air just above the deck surface.
> Simple dark posts drop away at the sides into still water. The horizon is high in frame
> and the water beyond is flat and glaring. No people, no boats, no shade anywhere.

### 3. `Lake-POV-Bowl.jpg` — "The Water One"
> Very low, very close dog's-eye view of a stainless steel dog bowl sitting in grass in
> direct sun. The camera is right down at rim height. The bowl is well below half full —
> the waterline sits low enough that a wide band of dry, bright inner wall shows above it,
> which is the whole point: it has been evaporating since noon. The water is dead still,
> with one hard specular highlight, and reads warm rather than cool. A few bits of grass
> and dust float on the surface. Tight dense shadow under the bowl's left side. Grass
> fills the rest of frame, sunlit and slightly parched.

### 4. `Lake-POV-Lake.jpg` — "The Biggest Bowl"
> Low dog's-eye view out across open lake water from the sand at the shoreline. Wet sand
> and a shallow lapping edge occupy the bottom quarter of frame; beyond that, a broad
> expanse of flat, still, glaring water running to a far shore of low soft hills near the
> top of frame. Shore-parallel ripples catch the light in thin bright lines, tighter and
> closer together toward the horizon. Big, empty and bright — enormous and useless. No
> boats, no swimmers, no dock, no shade.

---

## B. The five scene props

These replace the inline SVGs in `renderSceneLayer()` and sit on `Lake-Blank.jpg`.

**Format for all five:** PNG with true alpha transparency. No checkerboard painted into the
pixels — the last batch came back with a fake transparency pattern baked in and had to be
keyed out by hand. No ground shadow baked into the subject *except* where stated, because
the CSS composites shadows separately.

Each is viewed from a **low, near-level camera** — Act 1's hub is a dog's eyeline, not a
three-quarter overhead. Keep the horizon implied at roughly the vertical middle of each
asset so it seats correctly on the plate.

### 5. `Lake-Prop-Cooler.png` — 520 × 360
> A hard-sided wheeled picnic cooler, closed and latched, seen from a low near-level angle
> slightly to its left. Muted, slightly sun-faded body — a dusty blue-gray, not a saturated
> primary. Lighter lid, dark recessed wheels, a simple side handle. Subtle wear: a scuff or
> two, a slightly dulled lid edge. It is a well-used family cooler, not new product art.
> No shadow on the ground beneath it — that is composited separately.

### 6. `Lake-Prop-Dock.png` — 760 × 420
This one has hard geometry — the placeholder was rebuilt to exact measurements and the
replacement must match, or it will not seat on the shoreline.

> A short wooden jetty seen **broadside**, running from the sand at the LEFT of frame out
> into shallow water toward the RIGHT, receding and tapering as it goes. Weathered
> gray-brown planks laid crosswise. Simple square posts drop from the front edge into the
> water — posts only where the deck is over water; the left-hand end rests on sand and has
> none. The deck's front edge shows its thickness as a dark fascia band. Sun-bleached,
> dry, hot-looking wood.
>
> GEOMETRY — must hold:
> - The deck's two long edges converge on a single vanishing point that sits ON the water's
>   horizon, level with the far shoreline. They must not converge above it.
> - The near (left) end is roughly **2.1×** the scale of the far (right) end.
> - Cross-plank widths shrink from near to far by about **3.4×** — a near plank subtends
>   far more image than a far one. Evenly spaced planks are the single most common way this
>   reads wrong; it flattens the deck into a ramp.
> - Where each post enters the water, show a wet line and a short soft reflection. This is
>   the cue vector art cannot fake and is the main reason this asset is being redrawn.
> - The left-hand ~15% of the deck is over sand; the rest is over water.

### 7. `Lake-Prop-Bowl.png` — 300 × 220
> A stainless steel dog bowl on the ground, low near-level view. Well below half full — a
> wide band of dry bright inner wall above a low, still waterline. One hard highlight on
> the water. Slightly dulled, used metal, not mirror-bright. No ground shadow.

### 8. `Lake-Prop-Canopy.png` — 900 × 700
> A pop-up shade canopy: four legs and a square peaked fabric top, seen from a low
> near-level angle. Cream/oatmeal canvas with a visible seam from the peak down each face
> and a slight natural sag between corners — fabric, not a rigid pyramid. Simple dark wood
> or powder-coated metal legs that reach the bottom of frame and terminate squarely, so
> they can meet the ground. Soft ambient shading under the canopy top.
>
> Legs must be fully drawn to frame bottom — the placeholder's legs stop in mid-air, which
> is one of the defects this pass is fixing. **No cast shadow in this file** (see #9).

### 9. `Lake-Prop-Canopy-Shadow.png` — 900 × 400
> ONLY the cast shadow the canopy in #8 throws onto grass: a soft-edged quadrilateral of
> shade, no object in frame. Transparent everywhere else. Dark desaturated green-black at
> roughly 35–40% opacity, edges slightly soft but not blurred to mush.
>
> This is a separate file because the CSS slides it independently of the canopy as the sun
> moves through the act (`--act1-shade-shift`). It must tile/translate horizontally without
> revealing a hard edge, so keep the left and right extremes feathered.

---

## Review checklist — run before accepting any of these

1. **Coat colours, if any character sneaks in.** Sample actual pixels, do not eyeball.
   Tay: coat `#34383B`, blaze `#FFFFFF`, inner ear `#DC7F77`, pads `#43484B`, eyes flat
   `#000000` with **no catchlight**. A generated asset that drifts is wrong even when it
   looks fine alone — the damage only shows beside the others.
2. **Alpha is real.** Open the PNG and check the alpha channel, not the preview. Reject any
   file with a transparency checkerboard painted into RGB.
3. **Light direction.** Every shadow down and to the left. Any asset lit from the left goes
   back.
4. **Saturation.** Hold it beside `Lake-Blank.jpg`. If it pops, it is wrong — that is the
   exact failure mode of the placeholders being replaced.
5. **Dock only:** check the two long edges actually converge on the horizon and the plank
   widths shrink. Both were wrong in the original and are easy to reintroduce.
6. **No text or emoji anywhere**, per design-language §3.3.
