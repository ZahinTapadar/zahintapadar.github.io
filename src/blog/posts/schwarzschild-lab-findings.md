---
title: Schwarzschild Lab — Findings
subtitle: the numbers, and where they come from
date: 2026-10-30
tags: physics, astronomy, findings
project: https://zahintapadar.github.io/schwarzschild-lab/
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: Checkable results from Schwarzschild Lab and the Schwarzschild Observatory: geodesic validation, star counts, scene scales, photometry, performance, and what is still approximate.
cover: /blog/schwarzschild-lab/obs-einstein-ring-structured.webp
---

The measured side of [Building a Black Hole Simulator](/blog/building-a-black-hole-simulator/). Every number here comes from the code, from a measurement recorded in the project's READMEs, or from a check I re-ran on 30 October 2026. The reasoning behind them is in the [research log](/blog/schwarzschild-lab-research-log/). The complete version, with every table and its source, is [`docs/findings.md`](https://github.com/ZahinTapadar/schwarzschild-lab/blob/main/docs/findings.md) in the repository.

# Tests

`cargo test --release` in the Observatory, re-run on 30 October: 60 unit tests pass, 2 benchmarks are ignored, and the fixture test that re-renders all nine presets at 128 px passes.

# Geodesics

| Check | Result |
| --- | --- |
| Shadow edge vs $\sin\alpha_{sh} = 3\sqrt{3}\sqrt{1 - 2/r_0}/r_0$ | within $10^{-6}$ for $r_0$ = 50 to $10^6$ |
| Shadow-edge impact parameter | $3\sqrt{3}\,M$ to $10^{-6}$ |
| First integral drift | below $10^{-8}$ |
| Strong field | matches Bozza's limit at $b/b_c - 1 = 10^{-4}, 10^{-6}, 10^{-8}$ |
| Einstein angle | $2/\sqrt{r_0}$ within 2% |
| Extended source at $\beta = 0.5\,\theta_E$ | image positions within 5%, flux ratio 2.69 within 10% |
| Lab RK4 vs Observatory | escape directions agree to $3 \times 10^{-4}$ rad |

# Scene scales

Recomputed from the formulas for a $4.3 \times 10^6\,M_\odot$ hole:

| Scene | $r_0$ | Distance | Shadow radius | Einstein radius |
| --- | ---: | ---: | ---: | ---: |
| First Light | $2 \times 10^4$ | 849 AU | 53.6″ | 48.6′ |
| Lensed nebula scenes | $1.18 \times 10^5$ | 0.024 pc | 9.1″ | 20.0′ |
| Deep Field | $10^6$ | 0.21 pc | 1.1″ | 6.9′ |
| Critical Curve Study | 30 | local | 9.6° | — |

# Star counts

All-sky counts brighter than V, from a JavaScript port of the shader's sky model:

| V | Model | Real sky |
| ---: | ---: | ---: |
| 0 | 4.6 | ~4 |
| 3 | 179 | ~170 |
| 6 | 4,640 | ~5,000 |
| 9 | 165,000 | ~120,000 |
| 12 | 2.36 million | ~2.3 million |
| 15 | 30.1 million | ~32 million |

Within about 30% over 15 magnitudes; the worst point is V = 9, 38% high. The same seed rebuilds the same sky to within 2/255 per pixel (the film-grain dither).

# First Light

At 1% of the Eddington rate: $\dot{M} = 1.7 \times 10^{-3}\,M_\odot$ per year, peak $T_{eff}$ = 86,700 K at $9.55\,M$, $H/r \le 0.0065$. At 550 nm the disk is about 70 times brighter than the Sun's surface, which takes ND 6 and 20 µs to stay below full well, at which point the stars are about $10^{12}$ too faint.

# Deep Field photometry

Peak-pixel signal-to-noise, 30 cm telescope:

| Filter | Sky (e⁻/s/px) | m = 22, 1 × 3600 s | m = 22, 36 × 300 s |
| --- | ---: | ---: | ---: |
| L | 0.117 | 60 | 103 |
| R | 0.035 | 35 | 59 |
| G | 0.043 | 36 | 61 |
| B | 0.036 | 31 | 51 |

The old 10 cm setup already gave m = 22 an S/N of 18 in an hour. The first Deep Field's problem was the display.

# Nebula

The grid-noise index went from Hα 0.42 and [S II] 0.97 to 0.078 and 0.19 after one [1, 2, 1]/4 filter pass. The Strömgren radius in uniform gas matches the analytic value within 8%. The volume march converges to 0.3% at a quarter-voxel step.

# Performance

Native CLI, 10 threads, fanless MacBook Air M4, which throttles by up to 2× between runs:

| Render (1024 × 640) | spp | Samples/s | Time |
| --- | ---: | ---: | ---: |
| First Light, single exposure | 256 | 2.94 M | 57 s |
| Lensed H II region | 256 | 0.44 M | 380 s |
| Einstein Ring, exact | 256 | 0.26 M | 651 s |
| Deep Field, stacked | 512 | 3.92 M | 86 s |

Renderer noise halves for every 4× samples: 0.110%, 0.055%, 0.028% at 256, 1,024 and 4,096 spp. A checkpointed render resumes to a bit-identical EXR.

# What is approximate

- A hypothetical telescope hundreds of AU to 0.2 pc from the hole, with a static observer.
- A thin, colour-corrected blackbody disk, with no corona or jet, and ideal optics in First Light.
- A nebula with first-order advection, no energy equation, empirical line ratios and a reconstruction filter.
- A sky that is one statistical realisation, not a map.
- No Kerr.

# Not measured

- The real-time Lab's frame rate, on any device.
- The star-count calibration script is not in the repository yet, so that table cannot be regenerated from it.
