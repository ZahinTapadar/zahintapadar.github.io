---
title: Schwarzschild Lab — Research Log
subtitle: what I looked into, and why
date: 2026-10-30
tags: physics, astronomy, research-log
project: https://zahintapadar.github.io/schwarzschild-lab/
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: The research log behind Schwarzschild Lab and the Schwarzschild Observatory: the physics each part rests on, the approaches I tried and dropped, and the questions still open.
cover: /blog/schwarzschild-lab/obs-critical-curve-1.webp
---

This is the research side of [Building a Black Hole Simulator](/blog/building-a-black-hole-simulator/): what I investigated, in order, and why. The concrete numbers are in the [findings log](/blog/schwarzschild-lab-findings/). The full version, with every formula and reference, lives in the repository as [`docs/research-log.md`](https://github.com/ZahinTapadar/schwarzschild-lab/blob/main/docs/research-log.md).

Units are geometric, $G = c = 1$, with lengths in black-hole masses $M$.

# 18 October: light around a Schwarzschild hole

**The question.** Can a browser show a black hole whose image comes from traced light paths, at interactive frame rates?

**What it rests on.**

- The Schwarzschild metric: horizon at $2M$, photon sphere at $3M$, innermost stable orbit at $6M$.
- Light as a force law. A photon obeys $\ddot{\mathbf{x}} = -3Mh^2\mathbf{x}/r^5$ with $h = \lvert \mathbf{x} \times \dot{\mathbf{x}} \rvert$ constant along the ray. One vector and one constant per ray is cheap enough for a fragment shader.
- The critical impact parameter $b_c = 3\sqrt{3}\,M \approx 5.196\,M$, which makes the shadow bigger than the horizon.
- Massive bodies follow $d^2\mathbf{x}/d\tau^2 = -(M\mathbf{x}/r^3)(1 + 3L^2/r^2)$, integrated in a Rust/WebAssembly engine. The Killing energy converts proper time into a distant observer's time, which is why bodies freeze at the horizon.
- A thin disk with the Newtonian-limit Novikov–Thorne flux, and a redshift $g = \sqrt{1 - 3M/r}\,/\,(1 - \Omega L_z)$ for a circular orbit, with intensity scaled by $g^4$.
- Blackbody colours from a Planck spectrum against the CIE 1931 colour-matching functions (the Wyman, Sloan and Shirley fit).

**Why plain RK4.** A shader has no room for step rejection, so the step is a heuristic: coarse far away, fine near the photon sphere. How much that costs was only measured later, against the Observatory.

Later that day the camera started moving: a free-fall orbit, with relativistic aberration on every ray and the observer's Doppler factor on the sky and disk.

# 23 October: the sky

**The question.** Why does every procedural deep-space background look procedural?

Two approaches were dropped:

1. **Five hand-placed landmarks.** Lensing worked, but the sky was authored.
2. **Seeded noise.** The seed changed *where* things were, never *why*. It also showed a float hash lining stars up in rows (replaced with PCG3D) and lensing stretching tiny galaxies into streaks (now drawn as points through the PSF).

The one that stayed was **population synthesis**, after the Besançon model and the Gaia Universe Model: four stellar populations in 3D, a Kroupa mass function, a mass–luminosity law, an exponential dust disc with lognormal clouds, integrated along each line of sight in 10 distance shells and sampled with Poisson draws on a cube-sphere grid. Nebulae only appear around young clusters that meet physical conditions; galaxies follow Euclidean number counts.

It was checked by porting the equations to JavaScript and integrating star counts over the whole sky. The first normalisation was 2.5 times too high with the right shape. The first nebulae were invisible because their surface brightness was 3 magnitudes too faint. Both were found by checking, not by looking.

# 25 October: the Observatory

**The question changed.** Not "what does it look like?", but "what would a camera record, and how much of that can I justify?"

- **Scale.** A $4.3 \times 10^6\,M_\odot$ hole at a stated distance, seen by a static observer, so the shadow and Einstein radius have real angular sizes. One local-observer scene exists only for validation, and says so.
- **Integration.** The orbit equation $d^2u/d\phi^2 = 3Mu^2 - u$ with an adaptive Dormand–Prince 5(4) scheme. Escape is exact at $u = 0$. Validated against the exact shadow, weak-field deflection, Bozza's strong-field limit, the Einstein angle and point-lens theory.
- **The disk.** Page–Thorne, with absolute brightness from the accretion rate and a colour correction $f_{col} = 1.7$. The result is a disk 70 times brighter than the Sun's surface, which is why First Light needs an HDR composite and says so.
- **The nebula.** A generated H II region: lognormal turbulence, Strömgren ionisation against case-B recombination, a first-order Euler solver. The solver left a grid-scale checkerboard. Rusanov fluxes and fourth-order hyperdiffusion were both tried and dropped; one binomial filter pass was kept.
- **The deep field.** The first one was dark and noisy. A photometry audit from magnitude to electrons showed the counts were right and the display was wrong.
- **The sensor.** Filters, quantum efficiency, PSF, Poisson shot noise, read noise, dark current, saturation. Colour uses the Lupton et al. asinh stretch.
- **Labels.** Every output is classed by the resolution actually rendered and by what kind of image it is.

# Open questions

- Kerr. A spinning hole needs its own validated integrator first.
- The Observatory's observer is static; the Lab's orbits.
- No disk atmosphere, corona or jet. Scattered-light glare is left out of First Light on purpose, and that is an idealisation.
- The nebula solver has no energy equation; the filter treats a symptom.
- The sky has no 3D spiral arms, isochrones or Local Group galaxies.
- The Lab's RK4 and the Observatory differ by $3 \times 10^{-4}$ radians. I have not checked where that comes from.
- The Lab's frame rate has never actually been measured.
