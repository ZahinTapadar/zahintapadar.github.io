---
title: Pillars and Superclusters in Every Band
subtitle: a multiwavelength survey devlog
date: 2026-11-01
tags: physics, astronomy, cosmology, rendering, rust, webassembly
project: https://zahintapadar.github.io/schwarzschild-lab/observatory/survey.html
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: A devlog on the Schwarzschild Observatory's Multiwavelength Survey: generated pillars and a supercluster, observed in optical, near- and mid-infrared, sub-millimetre, radio, X-ray, microwave and weak lensing, with every band computed from the same physical state.
cover: /blog/schwarzschild-lab/survey-pillars-nircam.webp
---

The [Observatory](/blog/building-a-synthetic-telescope/) answers one question very carefully: what does a camera record when it points at a black hole?

But it is one camera. Most of what we know about nebulae and galaxy clusters comes from comparing cameras. Hubble's Pillars of Creation and Webb's are the same object. They look different because they measure different things, not because someone chose different colours. And a galaxy cluster in X-rays and the same cluster in visible light barely look like the same object at all.

So this round asks a new question:

> If several very different instruments looked at the same object, what would each one see, and why would they disagree?

![The same generated pillars through six instruments: optical narrowband, near-infrared, mid-infrared, 850 µm, 5 GHz radio and X-rays](/blog/schwarzschild-lab/survey-pillars-montage.webp)

That became the [Multiwavelength Survey](https://zahintapadar.github.io/schwarzschild-lab/observatory/survey.html), a new part of the Observatory with two generated scenes, pillars and a supercluster, and eight kinds of instrument.

# Instruments, not telescopes

The black-hole scenes are about one telescope pointed somewhere unusual. Here the interesting part is the *instrument*: what physics a band is sensitive to.

| Instrument | Modelled on | What it actually measures |
| --- | --- | --- |
| Optical narrowband | Hubble WFC3 class | Recombining hydrogen, ionised oxygen and sulphur |
| Near-infrared | Webb NIRCam class | Starlight through dust, Paschen-α, PAH 3.3 µm |
| Mid-infrared | Webb MIRI class | PAHs, warm dust |
| Sub-millimetre | JCMT SCUBA-2 class | Cold dust, the mass of the cloud |
| Centimetre radio | VLA class | Free–free emission from ionised gas |
| X-ray | Chandra / eROSITA class | Million-degree plasma, stellar coronae |
| CMB receiver | ACT / SPT class | Hot electrons scattering the microwave background |
| Weak lensing | DES / HSC class | All mass, dark or not |

Each one is *modelled on* a real facility class, so its aperture, band edges, beam, background and exposure are plausible. None claims to be that facility's calibrated response.

The rule I set myself was simple: **no band is painted.** The scene is stored as physical state per cell: hydrogen density, ionised fraction, gas temperature, starlight intensity, dust and PAH abundance, hot-plasma density and temperature. Every band computes its own emissivity $j_\nu$ and absorption $\alpha_\nu$ from that state and integrates them along the same rays:

$$I \leftarrow I\,e^{-\Delta\tau} + \frac{j_\nu}{\alpha_\nu}\left(1 - e^{-\Delta\tau}\right)$$

If the infrared shows stars that the optical hides, it has to be because the dust along those rays is thin at 2 µm. Not because I decided it should.

# Making pillars

The Pillars of Creation are columns of cold gas and dust a few light-years tall, sticking out of a molecular cloud, pointing at the young cluster that is destroying them. They are not built. They are what is left.

So I did not want to model columns. I wanted to model the destruction and let the columns appear.

## The photon budget

A cluster of hot stars pours out ionising photons, $Q \approx 2 \times 10^{50}$ per second. When those photons hit a cloud, they ionise its surface, and the ionised gas boils off as a photoevaporation flow. That flow is the clever bit: it gets in the way of the photons. Recombinations in the flow absorb most of them, so the front shields itself.

Bertoldi worked out the balance in 1989. The flow's base density settles where recombinations use up the incoming flux $F$ over a length $\ell$:

$$n_{IF} = \sqrt{\frac{F}{\alpha_B\,\ell}}$$

and the front eats atoms at $n_{IF}\,c_s$ per unit area, where $c_s$ is the flow speed. Over an age $t$ it has removed a column

$$N_{erode} = n_{IF}\,c_s\,t$$

That gives a rule for every cell in the cloud: it is ionised if the column of gas between it and the cluster is smaller than $N_{erode}$.

Dense clumps hold a huge column in a small space. The front stops in them, and everything behind them, in their shadow, survives. That is what a pillar is: the shadow of a dense core, pointing back at the cluster.

There is a test for this. In a uniform cloud with no turbulence, the front has to sit where $n \cdot \text{depth} = N_{erode}$, and the generator gets it to within 2.5 cells.

![Slices through the generated state: hydrogen density, ionised fraction, starlight intensity and hot plasma](/blog/schwarzschild-lab/survey-pillars-state.webp)

On top of that:

- **The diffuse field.** Recombinations to the ground state make ionising photons in every direction. They eat a little more from every surface, which is why pillars are thinner than the cores at their tips.
- **Ionised flows.** Every surface has a flow of density $n_{IF}\,(\ell/(\ell + d))^2$ at distance $d$. Surfaces in shadow only get the diffuse field, so they are dimmer.
- **A hot cavity.** Away from the surfaces, the cavity fills with wind-shocked gas at 7 million kelvin. That part is prescribed, not computed.
- **Starlight.** The far-ultraviolet intensity at each cell comes from the cluster through the dust column. It sets the dust temperature, $T = 18\,\text{K}\,U^{1/5.8}$, and how brightly the PAHs glow.
- **Stars.** Young stars form in the dense heads. Field stars come from the same Galactic model as the black-hole deep field, at their real distances, so the ones behind the cloud get extinguished by it.

## Four wrong clouds

The first cloud was too thin. The front ate 99% of the box and left a few blobs floating in plasma.

The second one was blocky. Every cell was either ionised or not, and the jump in emission between neighbouring cells showed up in every image as little cubes.

![Before: an early 64³ test render, with voxel-sized blocks in every band (a 512 px debug render, not a presentation image)](/blog/schwarzschild-lab/survey-before-blocky.webp)

Softening that edge took two changes. The shadow became a gradient, falling off as $e^{-N/10^{21}}$ across the shadow's edge. And a single [1, 2, 1] smoothing pass went over the density, the same reconstruction filter that fixed the [nebula's checkerboard](/blog/building-a-synthetic-telescope/) in the black-hole scenes.

The third cloud looked like a cloudscape, not pillars. The cluster was in front of the cloud, so I was looking straight at the lit faces through the glowing cavity. In the real Eagle Nebula, much of the glowing gas is *behind* the pillars, so they stand out as dark silhouettes with bright edges. Moving the cluster 1.6 pc behind the box centre fixed it.

The fourth had too many short pillars, because every turbulent clump acted as a core. Less turbulence, fewer and bigger cores, and an older front (4 million years) gave the long columns.

# What each band sees

![The near-infrared composite: F090W, F187N, F200W, F335M and F444W in chromatic order](/blog/schwarzschild-lab/survey-pillars-nircam.webp)

## Dust is the whole story

The single most important number in this project is how fast dust extinction falls with wavelength. At 2 µm it is about 11% of the visible extinction, and at 4.4 µm about 4%.

![The same field in H-alpha, F200W and F444W: the pillars become translucent and stars appear inside and behind them](/blog/schwarzschild-lab/survey-pillars-dust.webp)

That is why Webb's pillars look ghostly and full of stars while Hubble's are dark. A test makes sure the code respects it: for an embedded star, the optical depth at 2 µm divided by the optical depth at Hα has to match the dust law (to 15%). In other words, every band sees the same column.

## The lines

The optical image is recombination physics. Hα follows the case-B rate,

$$j_{H\alpha} = \frac{n_e\,n_p\,\alpha_{eff}(T)\,h\nu}{4\pi}, \qquad \alpha_{eff} = 1.17\times10^{-13}\,T_4^{-0.942}\ \text{cm}^3\,\text{s}^{-1}$$

and Paschen-α in the near-infrared is a fixed fraction of it. [O III] and [S II] are where I had to be honest. Their ratios come from the local ionisation parameter and how close the gas is to the front, using observed ranges. That is *empirical*, not a photoionisation calculation, and the code says so.

![Optical narrowband in the Hubble palette: [O III] blue, Hα green, [S II] red](/blog/schwarzschild-lab/survey-pillars-optical.webp)

The [S II] edges are a nice detail I did not plan. Sulphur emission is strongest in partly ionised gas, right at the front, so the pillar tips get gold rims for free.

## PAHs and warm dust

![Mid-infrared composite: PAH 7.7 and 11.3 µm, warm dust at 15 and 21 µm](/blog/schwarzschild-lab/survey-pillars-miri.webp)

PAHs are big flat molecules that absorb one ultraviolet photon and glow at 3.3, 7.7 and 11.3 µm. They are destroyed in ionised gas and survive in the thin layer just inside each surface, which is why mid-infrared images of pillars look like glowing skins. Their emission is linear in the starlight, $1.2 \times 10^{-24}\,U$ erg s⁻¹ per hydrogen atom, spread over Drude profiles.

Behind that, the big grains sit at their equilibrium temperature. There is a test that the dust model absorbs and re-emits the same 5 × 10⁻²⁴ erg s⁻¹ per hydrogen atom in the ordinary interstellar starlight at 18 K. Without it, the dust temperatures would be off.

## The bands that do not care about dust

![5 GHz free–free (cyan) and 850 µm cold dust (orange)](/blog/schwarzschild-lab/survey-pillars-radio-submm.webp)

Radio free–free emission comes from electrons swinging past protons. Dust does not touch it. So the 5 GHz map shows *every* ionised surface, front and back, including the ones hidden in every other image. A test checks its brightness against the Mezger–Henderson formula radio astronomers use.

The 850 µm map is the opposite: cold dust, glowing at about 20 K, optically thin, so it weighs the cloud. It peaks on the dense cores that made the pillars in the first place.

## X-ray shadows

![Soft X-rays, hard X-rays and 850 µm](/blog/schwarzschild-lab/survey-pillars-xray.webp)

The X-ray image was the one I expected to be boring, and it turned out to be my favourite. A 300 ks exposure collects about 0.09 counts per pixel from the hot cavity. It is honest and sparse. But the pillars show up anyway, as *shadows*: $10^{22}$ hydrogen atoms per cm² absorbs soft X-rays almost completely,

$$\sigma_{pe} \approx 2.0\times10^{-22}\,(E/\text{keV})^{-8/3}\ \text{cm}^2$$

so the cold columns block the glow behind them. The hard band, which goes straight through, shows nothing at all: the embedded stars are too faint.

![X-rays (blue), Hα (green) and F200W (red) in one composite](/blog/schwarzschild-lab/survey-pillars-xray-optical-ir.webp)

# A supercluster

The second scene is about a billion times bigger: a 120 megaparsec box of the universe, 200 megaparsecs away.

A supercluster cannot be built from a cloud and a lamp. It grows from tiny density fluctuations over 13 billion years. So the generator starts where cosmology starts.

## From fluctuations to clusters

1. **A random universe.** A Gaussian random field with the standard ΛCDM power spectrum (the BBKS fitting function), normalised so the fluctuations in 8 Mpc/h spheres are $\sigma_8 = 0.81$. A test checks that to $10^{-3}$.
2. **A guaranteed supercluster.** A random box rarely has one in the middle. The Hoffman–Ribak construction imposes a single peak, 3.2 σ high at 10 Mpc, at the centre, and leaves every other statistical property alone. It is the standard way to make a "constrained realisation".
3. **Structure.** The Zel'dovich approximation moves each bit of matter in a straight line along its initial gravitational pull, $\mathbf{x} = \mathbf{q} + \boldsymbol{\psi}(\mathbf{q})$. Smoothing the field at the non-linear scale first (the "truncated" version) stops matter flying through the walls it should collapse into.
4. **Clusters.** Zel'dovich cannot form bound clusters, so clusters come from an excursion set. Going from 20 Mpc top-hats down to 3.4 Mpc, every peak in the linear field above the spherical-collapse threshold $\delta_c = 1.686$, not already inside a bigger one, becomes a halo. This run made 608, the largest $1.4\times10^{15}\,M_\odot$.

![Redshift-survey wedge: the same galaxies in real space and in redshift space, where the central cluster stretches into a finger of god](/blog/schwarzschild-lab/survey-supercluster-wedge.webp)

Then galaxies. Each halo gets a central galaxy from the Moster stellar-to-halo relation and satellites on NFW orbits. The rest of the 26,000 galaxies sit on matter particles, a bit more often in dense regions. Each has a stellar mass, a star-formation rate, a size and a spectrum from old stars, young stars, dust, PAHs and radio. Ellipticals cluster in the middle, spirals in the field.

The redshift wedge is the most classic picture in this whole project. Astronomers find superclusters by measuring redshifts, not by looking. In redshift space, the central cluster's galaxies, swarming at 1,000 km/s, stretch along the line of sight into a "finger of god" pointing at us.

## The merging cluster

![The cluster core: galaxies (white), hot gas in X-rays (magenta), radio (orange) and lensing mass (blue)](/blog/schwarzschild-lab/survey-cluster-bullet.webp)

The biggest cluster is set up as a merger: a quarter-mass subcluster 0.7 Mpc along an axis, shock-heated gas, a radio halo, and two radio "relics", arcs of synchrotron emission where the merger shocks run outward. Its gas follows a β-model with 12% of the mass in gas and a temperature from the observed mass–temperature relation (8.4 keV here).

![The SZ effect at 90, 150 and 220 GHz](/blog/schwarzschild-lab/survey-cluster-sz.webp)

The SZ strip is the one I am proudest of, because the physics is so clean. Hot electrons scatter cosmic microwave background photons to higher energies. Below 217 GHz the cluster casts a *shadow* in the microwave sky, and above it a glow:

$$\frac{\Delta T}{T} = y\left(x\coth\frac{x}{2} - 4\right), \qquad x = \frac{h\nu}{kT_{CMB}}$$

At 90 and 150 GHz the cluster is a deep blue hole elongated along the merger axis. At 220 GHz, near the null, it is simply gone. The background blobs are the primary CMB, a Gaussian field from an approximate power spectrum. The bright spot in the middle is a radio galaxy leaking into the microwave band, which is a real headache in real SZ surveys too.

## The surprise: lensing barely works here

![Lensing convergence: noise across 40 degrees, a clear mass peak around the cluster core](/blog/schwarzschild-lab/survey-lensing.webp)

I expected weak lensing to show the dark-matter skeleton of the supercluster. It does not. At redshift 0.047 the cluster is so close that it bends background light very little, so the lensing signal is tiny. Across the 40° field the peak convergence is 0.005, below twice the noise from galaxy shapes.

Only the zoomed-in cluster core, with a deeper survey of 30 galaxies per arcmin², recovers the mass: $\kappa = 0.17$ against 0.013 noise. Real lensing surveys look at clusters much farther away for exactly this reason. I left the wide-field noise in, because it is the honest result.

![Wide field: X-rays, the SZ decrement (high-pass filtered) and radio across 40 degrees](/blog/schwarzschild-lab/survey-supercluster-gas.webp)

The same thing happens with the warm–hot gas in the filaments. It holds a large share of the universe's ordinary matter, and in this simulation, as in reality, it is below the noise of every instrument.

# Honest colour

All of the multi-band images are false colour, and every one says so in its legend. A few rules kept them honest:

- **Chromatic order.** In one instrument's composite, the shortest wavelength is bluest, as in most observatory releases.
- **Shared stretch for lines.** The optical composite uses one black and white point for all three lines, so line ratios survive. My first version stretched each band on its own, which turned the nebula grey.
- **Smoothing is labelled.** X-ray images are smoothed for display, like most X-ray press images, and the legend gives the kernel size.
- **Composites across instruments add their colours as given.** My first version normalised every channel, which quietly turned a gold layer green.

# Bugs worth remembering

- **A 2.4% flux deficit** in the free–free test. The jittered ray march started half a step inside the box and skipped the first sliver of every ray.
- **A honeycomb in the radio maps.** Smoothing the ionised fraction mixed neutral density (10⁴ cm⁻³) into the plasma at every surface, giving bright one-cell dots. The fix was to store electron density as its own field.
- **A radio relic drawn as a full ring.** The arc's angular Gaussian was correct, but an asinh stretch shows 3% of white as bright, so its tails closed the circle. Relics now use a compact window.
- **A crash at 192³.** The turbulence uses an FFT, so the grid must be a power of two. Grids are now rounded up.

# In the browser

The survey runs in the browser with the same code. One worker generates the scene and composes the images. The others each ray-march every n-th row of the current instrument's band grids. Because the seeds are the same, a browser render matches the command-line render of the same grid and size to float precision.

| Run (MacBook Air M4) | Time |
| --- | --- |
| Pillars, 256³ grid, 1024 × 640, six instruments, CLI | 224 s |
| Supercluster, four instruments, CLI | 27 s |
| Cluster core, six instruments, CLI | 67 s |
| Pillars, 64³, 512 × 320, browser | 16 s |
| Cluster core, 128³, 1024 × 640, browser | 51 s |

There are 18 new tests, on top of the Observatory's 60. All of them, and the fixture test, pass.

# What it still gets wrong

- The pillar front is a column rule, not radiation hydrodynamics. Gas is not conserved in the compressed layer, and the hot cavity is prescribed.
- Line ratios are empirical. Dust is one grain mix, and scattering is single and isotropic.
- Zel'dovich structure has no bound haloes (the excursion set supplies them), cluster gas is smooth β-models, and galaxy spectra are templates. There is no light-cone evolution across the box.
- Neither scene is a real object. The pillars are *like* the Eagle Nebula and the supercluster is *like* Shapley. Neither is a map.

# What I took away

The black-hole Observatory taught me to measure instead of adjusting the picture. This one taught me something slightly different: **the differences between bands are the science.** Every time two instruments disagreed, the disagreement had one physical cause that I could name and test: a dust column, a line ratio, a photoelectric cross-section, a lensing kernel.

The [survey runs in the browser](https://zahintapadar.github.io/schwarzschild-lab/observatory/survey.html), and every formula, number and approximation is in the [Observatory README](https://github.com/ZahinTapadar/schwarzschild-lab/tree/main/observatory#multiwavelength-survey).
