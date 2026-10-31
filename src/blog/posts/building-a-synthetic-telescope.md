---
title: Building a Synthetic Telescope
subtitle: the Schwarzschild Observatory devlog
date: 2026-11-01
tags: physics, astronomy, rendering, rust, webassembly
project: https://zahintapadar.github.io/schwarzschild-lab/observatory/
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: A devlog on the Schwarzschild Observatory, a slow, progressive synthetic telescope beside the real-time black hole simulator: physically scaled scenes, a validated geodesic integrator, a disk whose brightness comes from its accretion rate, a lensed nebula, a deep field, and an image pipeline that says what every picture is.
cover: /blog/schwarzschild-lab/obs-first-light-hdr.webp
---

The [real-time simulator](/blog/building-a-black-hole-simulator/) answers one question: *what does this look like right now?* It answers it 60 times a second, and every choice in it, from the disk's brightness to the bloom to the camera parked 26 M from the hole, is there to make the picture look good.

After a while I kept wanting the answer to a different question:

> If you pointed a real camera at this, what would it actually record?

That question turned into the [Schwarzschild Observatory](https://zahintapadar.github.io/schwarzschild-lab/observatory/). It is a progressive synthetic telescope: it renders one image slowly, refines it sample by sample, and exports files a real observatory would recognise (FITS, EXR, PNG with metadata, a JSON sidecar). It lives in its own folder, shares no code with the real-time renderer, and runs the same Rust core natively from a CLI and in the browser through WebAssembly.

![First Light: a thin disk around a 4.3 million solar-mass black hole, seen from 20,000 gravitational radii. A synthetic HDR composite of six registered exposures, not a single frame](/blog/schwarzschild-lab/obs-first-light-hdr.webp)

It took three rounds. The first one worked and looked bad. The second one fixed the physics. The third one fixed the pictures, and most of that turned out to be about honesty, not about maths.

# Round one: a telescope that works

The first version had the pieces you would expect:

- a geodesic integrator for every ray,
- a spectral renderer instead of RGB,
- a sensor model with quantum efficiency, filters, a point-spread function and Poisson noise,
- a progressive loop that can stop, checkpoint and resume.

## Spectra, not colours

Every sample carries 26 channels of photon radiance: 20 continuum bins from 350 to 1000 nm, plus six emission lines (Hα, Hβ, [O III] 495.9/500.7, [N II], [S II]). Colour only happens at the very end, when a filter curve and a quantum efficiency curve turn photons into electrons.

That matters near a black hole, because light gets shifted. A frequency shift $g = \nu_{obs}/\nu_{emit}$ moves a whole spectrum, so a continuum transforms as

$$N_{obs}(\lambda) = g^4\, N_{emit}(g\lambda)$$

for photon radiance, and a line, which is a delta function in wavelength, as $g^3$. In RGB you would have to fake that. In 26 channels it is a resample and a multiply.

## It worked, and it looked worse than the toy

The first renders were correct and boring. The disk was a grey smear, the stars were a few dots, the nebula was noisy, and side by side with the real-time simulator it lost badly.

Which was the point of the next two rounds: make the slow, careful renderer *beat* the fast one, without cheating.

# Round two: give every scene a size

The real-time simulator has no sense of scale. The camera is "26 M away" and the stars are "far". There is no answer to "how many arcseconds is the shadow?"

So the first rule of the repair was that every scene declares a mass and a distance.

## Telescope mode

The hole is $4.3 \times 10^6\,M_\odot$, roughly Sagittarius A*. Its gravitational radius is

$$r_g = \frac{GM}{c^2} \approx 6.35 \times 10^{9}\,\text{m}$$

and a telescope at distance $D$ sits at $r_0 = D/r_g$. A static observer there sees the shadow at an exact angular radius,

$$\sin\alpha_{sh} = \frac{3\sqrt{3}\,\sqrt{1 - 2/r_0}}{r_0}$$

and a source at distance $D_{ls}$ behind the hole has an Einstein radius

$$\theta_E = \sqrt{\frac{4\,r_g\,D_{ls}}{D_{ol}\,D_{os}}} \;\to\; \frac{2}{\sqrt{r_0}} \quad (D_{ls} \gg D_{ol})$$

For First Light the telescope is 850 AU away. The shadow is 53.6″ in radius and the Einstein radius is 48.6′. The real Sgr A* is 8 kpc away and its shadow is about 26 *micro*arcseconds, so this is a hypothetical telescope parked very close to the hole. Every scene says that in its metadata.

There is one exception: the Critical Curve Study puts the camera at 30 M, like the real-time renderer. It is the scene for checking the integrator, so it is labelled a diagnostic and never shown as a picture of anything.

![Left: the real-time simulator, a camera 26 M away with an artistically lit disk. Right: the Observatory at 20,000 M with a physical disk](/blog/schwarzschild-lab/obs-comparison.webp)

## An integrator that knows how wrong it is

The real-time shader uses RK4 with a step size I picked by feel. It has no idea how big its error is.

The Observatory rotates each ray into its orbital plane and integrates the orbit equation in $u = 1/r$:

$$\frac{d^2u}{d\phi^2} = 3Mu^2 - u$$

with an adaptive Dormand–Prince 5(4) scheme. Each step estimates its own error, and a step that misses the tolerance is rejected and retried smaller.

Working in $u$ has two nice side effects:

- **Escape is exact.** A ray reaches infinity at $u = 0$, which happens at a finite angle $\phi_\infty$. Its final direction on the sky is the plane rotated by $\phi_\infty$, with no "far enough" cutoff.
- **Disk crossings are free.** In the orbital plane, the equatorial disk is crossed at $\phi_c + k\pi$, so every photon order (direct image, the image wrapped under the hole, the photon ring) is found by checking angles, not by marching.

The camera is a static observer, so a pixel at angle $\alpha$ from the hole maps to an impact parameter

$$b = \frac{r_0 \sin\alpha}{\sqrt{1 - 2/r_0}}$$

## Testing it against answers I already had

The geodesic module has ten validation tests against analytic results:

| Check | What it compares |
| --- | --- |
| Shadow | capture boundary vs $b_c = 3\sqrt{3}M$, to $10^{-6}$ |
| Photon orbit | a ray at $b_c$ stays near $r = 3M$ |
| Weak field | deflection vs $4M/b + \tfrac{15\pi}{4}(M/b)^2$ |
| Strong field | Bozza's logarithmic divergence near $b_c$ |
| Einstein angle | ring radius vs $\theta_E$ |
| First integral | drift of $(du/d\phi)^2 + u^2 - 2Mu^3$ along the ray |

It also gave me a number I had wanted for a while. The real-time simulator's RK4 and this integrator agree on where rays go to within $3 \times 10^{-4}$ radians. The toy was more honest than I had any right to expect.

![Critical Curve Study, a diagnostic: ray fate with hatched low-confidence pixels, and image parity](/blog/schwarzschild-lab/obs-critical-curve-1.webp)

The Critical Curve Study shows the integrator itself. Ray fate (escaped, captured, hit the disk) uses majority classification across the samples in a pixel, never an averaged colour, and pixels without a 95% majority are hatched. Parity is the sign of the Jacobian of the screen-to-sky map, measured with three rays a quarter-pixel apart. Inside the Einstein ring the image is mirrored. The thin band hugging the shadow flips back: that is the third-order image.

![The same frame: orbital angle swept, first-integral drift, and disk redshift g, each on a fixed scale](/blog/schwarzschild-lab/obs-critical-curve-2.webp)

# The disk is far too bright

In the real-time simulator I chose the disk's brightness. In the Observatory it has to come from somewhere.

The disk uses the Page–Thorne thin-disk solution with real units. The accretion rate is a fraction $\lambda$ of the Eddington rate,

$$L_{Edd} = 1.257 \times 10^{31}\,\text{W} \times \frac{M}{M_\odot}, \qquad \dot{M} = \frac{\lambda L_{Edd}}{\eta c^2}$$

with $\eta = 0.0572$, the efficiency of a disk that ends at the innermost stable orbit. The flux at each radius is the dimensionless Page–Thorne profile scaled by $\dot{M}c^2/r_g^2$, the local temperature follows from $\sigma T^4 = F$, and the emitted spectrum is a colour-corrected blackbody ($f_{col} = 1.7$) to account for electron scattering in the disk's atmosphere.

Each disk element orbits at Keplerian $\Omega$, so a photon reaching the camera is shifted by

$$g = \frac{1/\sqrt{1 - 2/r_0}}{u^t\,(1 - \Omega\lambda)}$$

where $\lambda$ here is the photon's angular momentum about the axis and $u^t$ the orbiting gas's time component. That one number is where the gravitational redshift and the Doppler beaming both live.

At 1% of Eddington the code reports $\dot{M} = 1.7 \times 10^{-3}\,M_\odot$ per year, and a peak temperature of 86,700 K at $9.55\,M$.

![Diagnostics of the single exposure: disk frequency ratio g (blueshift blue, redshift red) and ray fate](/blog/schwarzschild-lab/obs-first-light-diagnostics.webp)

And then the awkward part. At 550 nm the disk is about 70 times brighter than the surface of the Sun. To keep it under full well, a real camera would need an ND 6 solar filter and a 20 µs exposure. At that exposure, the stars behind it are about $10^{12}$ times too faint to register a single electron.

So there is no single photograph of this scene that shows both the disk and the sky. That is not a rendering problem. It is what the scene is like.

## Two First Lights

The fix was to stop pretending there is one picture. First Light comes in two versions:

![Left: the physical single exposure, 20 µs through ND 6, with a black sky. Right: the HDR composite of six registered frames](/blog/schwarzschild-lab/obs-first-light-pair.webp)

The single exposure is the honest detector frame: a disk on black. The composite is a six-frame exposure ladder, from 20 µs through ND 6 up to 120 s with no filter, each about $10^3$ apart so their unsaturated ranges overlap.

![The six registered frames: the disk goes from the only thing visible to completely saturated while the stars appear](/blog/schwarzschild-lab/obs-first-light-frames.webp)

They are merged in linear units, the way an astronomer would:

$$R = \frac{\sum_k \left(S_k - n_k\,d\,t_k\right)}{\sum_k n_k\, g_k}$$

summing only unsaturated frames, where $S_k$ is the frame's signal in electrons, $d$ the dark current, $t_k$ the exposure and $g_k$ its effective gain (exposure × filter transmission). The result is a rate in electrons per second, valid across about 14 decades.

Then one global display curve maps it to a screen. My first attempt was plain logarithmic, and it was useless: the disk came out as a flat white shape and the stars were dark grey. The curve that worked has three segments:

1. a log segment for the sky and stars, lifted by a power of 0.35,
2. an empty gap between the brightest star and the faintest part of the disk, detected automatically and squeezed to a sliver,
3. a disk segment that is linear in displayed brightness, so the Doppler asymmetry survives.

No local tone mapping, no bloom. And the file says it is a composite: in the PNG text chunks, in the FITS header (`COMPOSIT = T`, `NFRAMES = 6`), and in the JSON sidecar, which also lists every frame.

# Lensing a nebula

The image I most wanted was a nebula behind the hole.

## Making the nebula

Painting one would have defeated the point, so the Observatory generates one. It is a 24 pc box of gas at 96³ voxels:

- a turbulent density field with a lognormal distribution,
- three massive stars whose ionising photons are cast through it to find the Strömgren boundary (where recombinations use up the ionising photons),
- a simple donor-cell Euler solver that lets the hot ionised gas push into the cold gas for a while,
- a two-phase temperature (about 10⁴ K ionised, 100 K neutral) and dust that follows the gas.

Emission lines come from that state: Hα and Hβ from recombination, [O III] where the gas is highly ionised, [S II] and [N II] at the ionisation front. Dust scatters the stars' light and absorbs everything behind it.

![Orthographic previews of the generated volume before lensing: column density, ionised fraction, temperature, dust, Hα, [O III], [S II] and scattered starlight](/blog/schwarzschild-lab/obs-volume-inspect.webp)

Rays that escape the hole are marched through the box with exact transfer for piecewise-constant emission $j$ and absorption $\alpha$:

$$I \leftarrow I\,e^{-\Delta\tau} + \frac{j}{\alpha}\left(1 - e^{-\Delta\tau}\right)$$

Two small things there took a while. Below $\Delta\tau = 10^{-2}$, $1 - e^{-\Delta\tau}$ in single precision loses most of its digits, so the weight switches to its series. And the fields fade to zero over the outer three voxels, so the edge of the box never shows up as a line.

## The checkerboard

This was my favourite bug.

The nebula looked grainy, and not in the "needs more samples" way. So I wrote a noise index, the energy at the grid's Nyquist frequency relative to the total, and measured it. Hα came out at 0.42. [S II] came out at 0.97, which is worse than pure noise.

The donor-cell solver leaves a checkerboard at the grid scale. Density is fine to look at. But line emission goes as density squared, and [S II] lives at a thin front, so the pattern gets amplified exactly where the eye looks.

I tried fixing it inside the solver twice:

- **Rusanov fluxes** are more diffusive. They smeared the neutral shell into the ionised gas until the whole H II region recombined. The ionised fraction went to 0%.
- **Fourth-order hyperdiffusion** removed the checkerboard and the turbulence along with it, and it was not mass-conserving at the boundaries.

Neither was kept. What worked was leaving the solver alone and filtering its output once with a binomial [1, 2, 1]/4 kernel on each axis. That kernel has an exact zero at the Nyquist frequency, so it removes the checkerboard completely and barely touches anything larger. Afterwards the indices were 0.078 and 0.19.

## Arcs and counter-images

The nebula sits 2.5 kpc behind the hole and a few arcminutes off axis. The lensing gives a bright outer arc and a fainter, mirrored counter-image inside the Einstein ring.

![Lensed H II Region, offset source: a bright outer arc and a mirrored counter-image. Single 300 s exposure](/blog/schwarzschild-lab/obs-lensed-hii-offset.webp)

![Left: lensing off. Right: lensed, an outer arc and a mirrored counter-image carrying the same dust lanes](/blog/schwarzschild-lab/obs-lensed-pair.webp)

I did not want to just trust that the arc and counter-image were the same gas, so there is a debug overlay. The renderer picks the five brightest Hα knots at least 3 pc apart, tags any ray that passes near one, and colours it. With lensing off you see five dots. With lensing on, the same five colours land in the arc and again, mirrored, in the counter-image.

![Debug: the five landmarks with lensing off, and the same landmarks in the lensed arc and counter-image](/blog/schwarzschild-lab/obs-correspondence.webp)

![Diagnostics of the offset nebula: dust optical depth, image parity (the counter-image is mirrored), and line radiance](/blog/schwarzschild-lab/obs-lensed-diagnostics.webp)

## Two Einstein rings

A source exactly behind the hole makes a perfect ring. That is a good test and a boring picture, so there are two presets. The exact one is labelled as a symmetry test. The structured one moves the nebula a quarter of an Einstein radius off axis, which gives a nearly complete but uneven ring that repeats the source's knots.

![Exact alignment: lensing off, the symmetric ring, and its dust optical depth](/blog/schwarzschild-lab/obs-einstein-exact.webp)

![Einstein Ring, structured alignment: the nebula off axis, a mostly complete but uneven ring](/blog/schwarzschild-lab/obs-einstein-ring-structured.webp)

These are checked against point-lens theory too. For a source at offset $\beta$, the two images have magnifications

$$\mu_\pm = \frac{u^2 + 2}{2u\sqrt{u^2 + 4}} \pm \frac{1}{2}, \qquad u = \beta/\theta_E$$

and a test renders a uniform disc at several offsets and checks the flux ratio of the images.

![A uniform disc, right half twice as bright, behind the hole at β = 0, 0.1, 0.3, 0.7 and 1.5 θ_E](/blog/schwarzschild-lab/obs-validation-discs.webp)

![Volume step convergence: line radiance at march steps of 1, 0.5 and 0.25 voxel](/blog/schwarzschild-lab/obs-validation-step.webp)

# Narrowband, and why the nebula is teal

The Narrowband Nebula preset shoots the same nebula through three filters, [S II], Hα and [O III], and maps them to red, green and blue. That is the "Hubble palette", and it is false colour.

![The raw [S II], Hα and [O III] planes](/blog/schwarzschild-lab/obs-narrowband-planes.webp)

My first SHO composite was a saturated mess, because each channel was stretched on its own. The version that stuck normalises each line, then applies one shared colour-preserving stretch to all three, and pulls saturation back to 0.55.

The surprising part came from the visible-light version of the same spectra. It is teal, not red. The eye is about four times more sensitive at [O III] 501 nm than at Hα 656 nm, so a nebula that a camera records as red can look blue-green to a person at the eyepiece. Both are right for their detectors. The false-colour one says so in its caption.

![Left: the SHO composite, labelled FALSE COLOUR. Right: the visible-light rendering of the same spectra](/blog/schwarzschild-lab/obs-narrowband-visible.webp)

# The deep field that was dark for the wrong reason

The Weak-Lensing Deep Field points away from everything bright and stares. It reuses the synthetic Milky Way model from the real-time simulator, plus a deep in-field catalogue: about 17,800 stars to V = 22 and 6,900 galaxies within half a degree, laid out on a square gnomonic patch so the edge of the catalogue never falls inside the frame.

The first version was dark and noisy, and I assumed the photon counts were wrong. So instead of tuning the picture, I wrote a `photometry` command that traces one source from magnitude to electrons and prints every term: zero point, filter, quantum efficiency, aperture, PSF, sky, read noise. The zero point checks out against the AB system within 5%.

The counts were fine. A 22nd-magnitude galaxy already had a signal-to-noise of 18 in an hour.

The problem was the display:

- the white point sat on bright stars that saturate, so the faint galaxies came out at about 3% grey;
- the black point sat far below the sky, so the sky's own shot noise filled the frame.

Fixing the display, and moving to a 30 cm telescope so galaxies are resolved, was the whole fix. The physics had been right all along. I would have "fixed" it by turning the sky brightness down if I had not measured first.

![Left: one 3600 s detector frame. Right: 36 registered 300 s frames](/blog/schwarzschild-lab/obs-deep-field-pair.webp)

There were two smaller sky bugs on the way:

- **A bright disc in the middle.** The deep catalogue only covered a cone, and the unresolved-light map outside it was computed to the shallow limit. So the sky inside the cone was brighter. Now there is one unresolved-light map, computed to the deep limit, used everywhere.
- **A seam at the pole.** The original field was at galactic latitude −90°, where the sky's grid has a singularity. The poles now blend toward a mean, and the field moved to −57°.

The stacked version simulates 36 frames. Stacking $n$ frames is drawn as Poisson($n\mu$) plus $\sqrt{n}$ times the read noise, and a test checks that the noise falls as $1/\sqrt{N}$.

![Weak-Lensing Deep Field, stacked survey composite: galaxies near the Einstein radius are stretched tangentially](/blog/schwarzschild-lab/obs-deep-field-stack.webp)

# Round three: every image says what it is

By the end of round two the physics was in good shape and the pictures still were not. Some were rendered at 320 pixels and scaled up. Some were composites without saying so. Diagnostics and presentation images were mixed together.

So the last round was mostly about labelling.

## Output classes, earned by resolution

Every image belongs to one class:

| Class | Size | Use |
| --- | --- | --- |
| Fixture | 128 px | regression tests only |
| Validation | 512 px | checks against theory |
| Presentation | ≥ 1024 × 640 | anything shown as a picture |
| High quality | 1600 × 1000 | the same, bigger |

The class is decided by the resolution actually rendered. Nothing is ever upscaled. If you ask for a presentation image and render at 512, you get a validation image, and the file says so.

![The same patch around the shadow rendered natively at 640, 1024 and 1600 px, shown as nearest-neighbour crops](/blog/schwarzschild-lab/obs-resolution.webp)

There is a test for this too: rendering the same scene at different resolutions keeps angles, total flux and the PSF in arcseconds fixed. Only the sampling changes.

## Kinds of picture

Separately from the class, every image says what kind of picture it is:

- a physical single exposure,
- a registered composite (with its frames saved alongside),
- a stacked survey,
- a diagnostic,
- false colour.

That goes into the PNG's text chunks, the FITS header (`OUTCLASS`, `PRESMODE`, `COMPOSIT`, `NFRAMES`, `BUNIT`) and the JSON sidecar, along with the display curve, the black and white points and the exposures. Diagnostics get their legends baked into the image, with a tiny 5×7 bitmap font, so a cropped screenshot still says what its colours mean.

## The output tree

A render writes into a fixed tree:

```
out/presentation/   pictures, ≥ 1024 × 640
out/diagnostics/    fate, parity, redshift, τ, line radiance, with legends
out/data/           FITS, EXR, JSON sidecars
out/validation/     checks against theory
out/debug/          landmark correspondence and other overlays
out/benchmarks/     timing runs
out/fixtures/       128 px regression renders
```

The README and this post only use `presentation`, `diagnostics` and `validation`. I wrote that down as a rule after catching myself putting a 320 px render in the README because it looked fine at thumbnail size.

# Sensor details I did not expect to care about

- **PSF.** The core is a Gaussian whose width combines the optics and the Airy disk in quadrature. A Moffat halo goes on top, on a tapered circular support, because a square kernel left a visible square around every bright star. First Light uses ideal optics with no halo, because the disk's halo buried every star in the frame. That is stated in its metadata.
- **Frozen noise.** The Poisson draw for each pixel is seeded by the pixel and the frame, so the noise does not flicker while the renderer refines. Renderer noise falls as $1/\sqrt{N}$ with samples; sensor noise stays fixed once the exposure is complete.
- **Display.** Linear, asinh, filmic, narrowband and HDR curves, all with a colour-preserving (Lupton) stretch and a G2V white balance, so a Sun-like star comes out white. Every setting is recorded in the file.

# How slow it is

All on a fanless MacBook Air M4, CPU only, 10 threads:

| Render (1024 × 640, 256 spp) | Time |
| --- | --- |
| First Light, single exposure | 57 s |
| First Light, HDR composite | 65 s |
| Lensed H II region | 380 s |
| Einstein ring, structured | 582 s |
| Narrowband nebula | 396 s |
| Deep field, stacked (512 spp) | 86 s |

The nebula scenes are slow because every ray that passes the hole then marches 100 to 160 steps through the gas. Memory peaks around 600 to 760 MiB, almost all of it per-pixel accumulators: 26 spectral channels and 18 diagnostics.

A render to 64 samples in one go and a render to 32 followed by a checkpoint resume to 64 produce bit-identical EXR files. 60 unit tests and a fixture test for all nine presets pass.

# What it still gets wrong

- **A hypothetical vantage point.** The telescopes sit hundreds of AU to 0.2 pc from the hole.
- **A static observer** and a stationary scene.
- **A thin disk** with a colour-corrected blackbody: no corona, no jet, no atmosphere.
- **The nebula's physics** is a two-phase temperature, first-order advection with a reconstruction filter, empirical line ratios and single scattering.
- **The sky is one realisation of a model**, not the real sky.
- **No Kerr.** A spinning hole needs its own validated integrator. Until it has one, nothing in this project gets called Kerr.

The display curves are presentation choices, and the SHO palette is false colour. Both are written into every file that uses them.

# What I took away

I expected the hard part to be the geodesics. It was not. The integrator was done in a day and passed its tests.

The hard part was everything after the physics: finding out that the deep field was dark because of a black point, that the nebula was grainy because of a solver's Nyquist mode, that a "picture of the disk" cannot exist without a composite. Every one of those was found by measuring something instead of adjusting the picture until it looked right.

The [live Observatory](https://zahintapadar.github.io/schwarzschild-lab/observatory/) runs the same core in the browser, more slowly. The next part points instruments other than an optical camera at generated pillars and a supercluster: [Pillars and Superclusters in Every Band](/blog/pillars-and-superclusters-in-every-band/). The full method, every number and the list of approximations are in the [Observatory README](https://github.com/ZahinTapadar/schwarzschild-lab/tree/main/observatory), and the reasoning in order is in the [research log](/blog/schwarzschild-lab-research-log/).
