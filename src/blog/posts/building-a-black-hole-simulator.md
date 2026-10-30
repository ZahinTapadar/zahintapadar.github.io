---
title: Building a Black Hole Simulator
subtitle: not a tutorial, just a devlog
date: 2026-10-23
tags: graphics, physics, rust, webassembly, webgl
project: https://zahintapadar.github.io/schwarzschild-lab/
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: A devlog on Schwarzschild Lab, a real-time black hole simulator in the browser (per-pixel light-ray tracing in WebGL2 and a Rust/WebAssembly orbit engine), and the Schwarzschild Observatory, a slow synthetic telescope beside it.
cover: /blog/schwarzschild-lab/gargantua.webp
demo_cmd: ./schwarzschild-lab
demo_note: loads a live WebGL2 ray tracer · drag to orbit, scroll to zoom
---

I wanted to make a black hole simulation that looks beautiful, but also does not completely lie about the physics.

A lot of black hole visuals are basically a dark circle with a glowing ring around it. That can look cool, but the part that makes a black hole actually interesting is that light itself bends around it. The image should not be painted around the black hole — it should emerge from tracing where each ray of light would go.

So this project became [Schwarzschild Lab](https://zahintapadar.github.io/schwarzschild-lab/): a real-time black hole simulator in the browser.

::simulator

The graphics are written in WebGL2 shaders, while the movement of planets, stars, and debris is handled by a Rust physics engine compiled to WebAssembly.

# The main idea

The black hole uses the Schwarzschild metric, which describes spacetime around a non-rotating black hole.

I use geometric units:

$$G = c = 1$$

This makes the equations much less painful to work with. The black hole mass becomes $M$, and the event horizon is at:

$$r_s = 2M$$

The photon sphere — where light can orbit the black hole — is at:

$$r_{ph} = 3M$$

And the visible black-hole shadow is larger than both of those. Its critical radius is:

$$b_c = 3\sqrt{3}\,M \approx 5.2\,M$$

Here $b_c$ is an *impact parameter*: how far off-centre a ray of light is aimed. Any ray aimed closer than $b_c$ falls in, so the shadow looks bigger than the horizon itself.

That is why a black hole does not just look like a perfectly sized dark disk. Light from behind it is bent, captured, or sent back toward the camera.

# Ray tracing light instead of drawing a black hole

The renderer begins with one ray for every pixel on screen.

Normally, a ray tracer would send a ray in a straight line:

```js
position += direction * stepSize;
```

But that obviously does not work near a black hole.

Instead, the ray is continuously accelerated toward the black hole. In the shader, I integrate the ray path with RK4 — Runge–Kutta fourth order integration.

For light, the Schwarzschild geodesic can be written as an ordinary acceleration on a straight-line ray, where $h$ is the ray's angular momentum ($h = \lvert \mathbf{x} \times \dot{\mathbf{x}} \rvert$, which stays constant along the ray):

$$\ddot{\mathbf{x}} = -\frac{3 M h^2}{r^5}\,\mathbf{x}$$

In the shader it looks like this:

```glsl
vec3 accel(vec3 x, float angularMomentumSquared) {
    float r2 = dot(x, x);
    float r = sqrt(r2);

    return -3.0 * mass * angularMomentumSquared * x
         / (r2 * r2 * r);
}
```

The renderer advances the ray through spacetime step by step. Far away from the black hole, it can take large steps. Near the horizon and photon sphere, it takes much smaller ones.

That adaptive step size matters a lot. Without it, the simulation either becomes too slow or completely misses the interesting light paths near the black hole.

# The first result

At first, it was mostly a dark sphere with a thin ring.

![Just the shadow: a dark disk, a faint photon ring, and stars bent around the edge](/blog/schwarzschild-lab/shadow.webp)

Not terrible, but it did not really feel like space.

The important realization was that the black hole itself is not the only thing being rendered. The black hole is mostly visible because it changes everything behind it.

Stars behind the black hole get bent into arcs. The accretion disk can appear above and below the shadow. A distant galaxy can, in theory, wrap into multiple images around the critical curve.

> The black hole is not an object being drawn on top of the sky. The sky is being seen through curved spacetime.

# The accretion disk

The next thing I added was an accretion disk.

This is a thin disk of matter orbiting the black hole. Matter closer to the black hole moves faster and becomes hotter, so the inner region should be brighter.

For the temperature profile, I use a Novikov–Thorne-inspired disk model. The energy the disk radiates per unit area at radius $r$ goes as

$$F(r) \propto \frac{1}{r^3}\left(1 - \sqrt{\frac{r_{in}}{r}}\right)$$

which is zero at the inner edge $r_{in}$, peaks at $r = \tfrac{49}{36}\,r_{in}$, and falls off outside. A blackbody's flux grows as $T^4$, so the local temperature is

$$T(r) = T_{peak} \left(\frac{F(r)}{F_{max}}\right)^{1/4}$$

The important visual effect is that the disk is not uniformly orange. Its local temperature affects its colour, and hotter regions shift toward white or blue.

The shader converts temperature into colour using a blackbody lookup table.

```glsl
vec3 blackbody(float temperature) {
    float u = clamp(
        log(temperature / 800.0) / log(40000.0 / 800.0),
        0.0,
        1.0
    );

    return texture(uBlackbody, vec2(u, 0.5)).rgb;
}
```

This is much nicer than manually choosing a gradient, because the colours at least follow the rough behaviour of thermal radiation.

![The disk seen almost edge-on: the far side is lensed up over the shadow and the underside wraps beneath it](/blog/schwarzschild-lab/gargantua.webp)

# Doppler beaming

A disk around a black hole is moving ridiculously fast.

The side moving toward the observer appears brighter and bluer. The side moving away appears dimmer and redder. This is relativistic Doppler shifting and beaming.

That is why the disk does not look symmetrical, even though the disk itself is circular.

The effect is controlled by a redshift factor:

$$\text{observed colour} = \text{local colour} \times \text{gravitational shift} \times \text{Doppler shift}$$

The result is one of my favourite parts of the whole project. One side of the disk becomes intense and sharp, while the other fades into the darkness.

![Same disk with Doppler beaming on: the approaching side burns white, the receding side fades](/blog/schwarzschild-lab/doppler.webp)

It is the difference between a glowing ring and something that starts to feel alive.

# The physics engine

The ray tracer handles light, but I also wanted objects that could move around the black hole.

Planets, stars, debris clouds, and gas should not simply orbit in perfect circles because I animated them that way. They should follow the black hole’s gravity.

For this, I wrote a small Rust engine and compiled it to WebAssembly.

The engine integrates massive bodies using Schwarzschild timelike geodesics. Written as an acceleration in proper time $\tau$, with $L = \lvert \mathbf{x} \times d\mathbf{x}/d\tau \rvert$:

$$\frac{d^2\mathbf{x}}{d\tau^2} = -\frac{M\,\mathbf{x}}{r^3}\left(1 + \frac{3L^2}{r^2}\right)$$

The first part is ordinary Newtonian gravity. The $3L^2/r^2$ term is the relativistic correction, and it is what makes orbits precess, puts the innermost stable orbit at $6M$, and lets bodies plunge. That means objects can:

- Orbit and precess
- Fall inward
- Escape
- Freeze near the event horizon from a distant observer’s point of view
- Get torn into streams of debris
- Contribute mass to the black hole when swallowed

![Planets on precessing orbits, each one lensed by the same rays as the disk](/blog/schwarzschild-lab/orbits.webp)

The renderer receives a compact packed buffer from WebAssembly:

```
[x, y, z, radius, kind, clockRate, colour, id]
```

Then the shader uses those positions while tracing each light ray.

There is a limit to how many large bodies can be checked inside the ray shader, so the main objects are handled as ray intersections, while thousands of tiny gas/debris particles are drawn in a separate additive pass.

![The spacetime-fabric overlay: the embedding surface sags into the hole, with dents for each body](/blog/schwarzschild-lab/fabric.webp)

# Moving the observer

A static camera looked nice, but it still felt like a poster.

So I added an orbiting observer.

The camera can move around the black hole, with relativistic aberration and Doppler shifting. That means the direction light seems to come from changes when the observer moves quickly.

The sky compresses slightly in the direction of motion. Light ahead of the camera is shifted differently from light behind it.

It is subtle, but it makes the scene feel much less like a model sitting in space.

# Deep space is harder than it looks

The sky background turned out to be its own problem.

At first, procedural stars and noise looked fine from far away. But when I started adding nebulae and galaxies, the result began to look too much like procedural art: repeated fog blobs, evenly scattered stars, obvious feature scales, and shapes that looked generated instead of astronomical.

It took three wrong versions before I understood why.

## Attempt one: a catalogue of pretty things

The first version placed five "landmarks" by hand: an emission nebula, a blue reflection nebula, an edge-on galaxy, a face-on spiral, and a compact galaxy with a cluster. Each one sat at a fixed direction on the sky and was drawn with noise.

Lensing worked perfectly, because they were looked up on the escaped ray direction. But they were obviously authored. Turn the camera and there they were, the same five objects, always.

## Attempt two: seeded noise

So I made the sky generate itself. A seed picked the tilt of the galaxy, and hashed grid cells on the sphere decided whether they held a nebula or a galaxy.

It was still art. Every nebula was a rounded puff the size of its grid cell. The stars were sprinkled with the same density everywhere. The galactic band was grey fog painted on top. Changing the seed changed *where* things were, but never *why* they were there.

It also had two bugs that taught me something:

- **Rows of stars.** The cheap float hash I used correlates on an integer lattice, so stars lined up in faint diagonal rows. Switching to an integer hash (PCG3D) fixed it.
- **Streaked galaxies.** Tiny background galaxies were drawn as little ellipses in sky space. Near the black hole the lensing stretched those ellipses into long streaks. A galaxy that small should be a point of light, not a shape, so it now goes through the same point-spread function as a star.

## Attempt three: a synthetic sky

The fix was not "more noise." It was to stop drawing the sky and start *counting* it.

Astronomers already do this. The Gaia mission uses a Universe Model, and the Besançon model has been around for decades: describe where the stars in the Milky Way are in 3D, what masses they have, how much dust is in the way, and then work out what a telescope would see. I built a tiny version of that idea that runs inside the fragment shader.

The result is still procedural. It is not a map of the real sky, it uses no catalogue, and it is not an N-body simulation. But every star now exists because a density model says a star should be there.

# The synthetic sky model

## The Milky Way in 3D

The galaxy is four populations of stars, each with a density in galactocentric coordinates (kiloparsecs, with the Sun at $R_0 = 8.2$, $z_\odot = 0.02$):

| Component | Density |
| --- | --- |
| Thin disc | $\rho \propto e^{-(R-R_0)/2.6}\, e^{-\lvert z\rvert/0.30}$, with a central hole $1 - e^{-(R/3)^2}$ |
| Thick disc | $0.12\, e^{-(R-R_0)/2.0}\, e^{-\lvert z\rvert/0.9}$ |
| Bar / bulge | $120 \exp\!\left(-\tfrac{1}{2}\left[(x/1.2)^2 + (y/0.45)^2 + (z/0.35)^2\right]\right)$, rotated 27° |
| Stellar halo | $0.0015 \left(\dfrac{R^2 + (z/0.7)^2 + 0.5^2}{R_0^2 + 0.5^2}\right)^{-1.25}$ |
| Dust | $\tau_V = 0.74\,\text{kpc}^{-1}\, e^{-(R-R_0)/3.2}\, e^{-\lvert z\rvert/0.12}\, C$ |

Everything is relative to the local thin disc, normalised to $N_0 = 4.2 \times 10^7$ stars per cubic kiloparsec near the Sun.

$C$ is the interesting one. Real dust is clumpy: it sits in molecular clouds, not a smooth sheet. So the dust density is multiplied by a lognormal field, $C = \exp(\sigma G - \sigma^2/2)$, where $G$ is smooth, domain-warped noise. The $-\sigma^2/2$ keeps the *average* dust the same while letting individual clouds get very thick. The contrast $\sigma$ is high near the galactic plane and small at high latitude, because that is where clouds live.

This is the only place noise is allowed in the whole sky. It perturbs a physical density; it never draws anything by itself.

## How bright is each star?

Positions are only half the problem. The other half is the luminosity function: how many stars of each brightness there are.

I used a Kroupa mass function, the standard description of how many stars form at each mass:

$$
\frac{dN}{dm} \propto
\begin{cases}
m^{-1.3} & 0.08\text{–}0.5\,M_\odot \\
m^{-2.3} & 0.5\text{–}1\,M_\odot \\
m^{-4.8} & 1\text{–}60\,M_\odot \quad \text{(thin disc only)}
\end{cases}
$$

The steep $m^{-4.8}$ tail is the thin disc's *present-day* mass function: it keeps forming stars, but massive stars die young, so few of them are around at any moment. The old populations (thick disc, bulge, halo) simply stop at a $0.95\,M_\odot$ turn-off; everything heavier burnt out long ago.

Mass becomes absolute magnitude through a main-sequence mass–luminosity law, $L \propto m^{3.5}$, which gives $M_V = 4.83 - 8.75 \log_{10} m$. On top of that, 0.3–0.6% of stars are giants with $M_V$ between $-1.5$ and $1.5$, because a few bright giants dominate what you see at large distances.

## Following one line of sight

For each pixel, after its ray escapes the black hole, the shader walks outward along that direction through 10 logarithmic distance shells, from 5 pc to 40 kpc:

```glsl
for (int k = 0; k < NSHELL; k++) {
    float r  = SHELL_R0 * exp((float(k) + 0.5) * SHELL_DLN);
    float dr = r * SHELL_DLN;
    vec3  P  = galPos(g, r);                      // galactocentric position
    float dtau = KAPPA_V * uDust * rhoDust(P) * cloudC * dr;

    shMu[k] = 5.0 * log10(r) + 10.0;               // distance modulus
    shA[k]  = 1.086 * (tau + 0.5 * dtau);          // extinction to the shell centre
    tau += dtau;

    float w = N0 * r * r * dr;                     // stars per steradian in this shell
    shWy[k] = w * rhoThin(P);                      // young population
    shWo[k] = w * (rhoThick(P) + rhoBulge(P) + rhoHalo(P));
}
```

That gives everything needed to answer one question: *how many stars per steradian are brighter than magnitude m in this direction?* Add up every shell, shift the luminosity function by that shell's distance modulus and extinction, and read off the cumulative count. The $r^2$ is why distant parts of the galaxy matter: a thin shell far away covers a lot of volume.

## Checking it against the real sky

This is the part I did not expect to work.

Because the whole model is a handful of equations, I ported them to JavaScript and integrated star counts over the entire sky. The first run used a guessed normalisation and came out about 2.5× too high at every magnitude. The *shape* was already right, though, so the only fix was the overall number of stars per cubic kiloparsec. With $N_0 = 4.2 \times 10^7$:

| Brighter than | Model | Real sky |
| --- | --- | --- |
| V = 0 | 4.6 | ~4 |
| V = 1 | 16.5 | ~15 |
| V = 3 | 179 | ~170 |
| V = 6 | 4,640 | ~5,000 |
| V = 9 | 165,000 | ~120,000 |
| V = 12 | 2.36 million | ~2.3 million |
| V = 15 | 30.1 million | ~32 million |

Within about 30% over fifteen magnitudes, a factor of a million in brightness, from a model that fits in a shader. The naked-eye sky (V < 6) has the right number of stars in it.

![Expected star counts per steradian toward the galactic centre: dense in the plane, broken up by dust clouds](/blog/schwarzschild-lab/star-counts.webp)

## Placing stars without a catalogue

Knowing *how many* stars there should be is not the same as knowing *where* they are. For that, the sky is covered by a cube-sphere: the six faces of a cube projected onto the sphere, with an equal-angle mapping so every cell has roughly the same area.

Stars are drawn in magnitude bins, and each bin gets its own grid level so that each cell expects about one star:

| Magnitudes | Grid level | Cells per face |
| --- | --- | --- |
| −3 to 1.5 | 2 | 16 |
| 1.5 to 4 | 4 | 256 |
| 4 to 6.5 | 6 | 4,096 |
| 6.5 to 8.5 | 7 | 16,384 |
| 8.5 to 10.5 | 9 | 262,144 |
| 10.5 to 12.5 | 10 | 1,048,576 |

For each cell near the pixel, the expected count $\lambda$ comes from the line-of-sight integral above times the cell's solid angle. The actual number of stars is a Poisson draw,

$$P(k \text{ stars}) = \frac{\lambda^k e^{-\lambda}}{k!}$$

done with an inverse CDF so there is no loop:

```glsl
float e = exp(-lam);
int count = int(h.x > e)
          + int(h.x > e * (1.0 + lam))
          + int(h.x > e * (1.0 + lam + 0.5 * lam * lam));
```

That caps a cell at three stars. Any expected stars beyond that are not thrown away; their average brightness is added back as diffuse light.

Each star then picks its own story. Its magnitude is drawn inside the bin from $dN/dm \propto 10^{0.3m}$, and then the shader works backwards: which shell and population most likely produced a star that bright? That gives its distance, its extinction, whether it is a main-sequence star or a giant, its mass and its temperature.

## Seeds that actually reproduce

Every random number comes from a PCG integer hash of `(seed, level, face, cell, index)`. So the same seed rebuilds the exact same sky, star for star, from any camera position, any resolution and any ray-step count. A different seed is a different draw from the same model: same statistics, different stars.

I checked this by rendering seed 1977 twice from cold starts. The images differed by at most 2/255 per pixel, which is just the film-grain dither in the final pass. Seeds 42 and 314159 from the same camera were clearly different skies with the same overall brightness.

![Seeds 1977, 42 and 314159 from the same camera: different stars, same galaxy](/blog/schwarzschild-lab/seeds.webp)

The galaxy's orientation, the density model and every parameter stay fixed. The seed only decides which stars you get.

## Turning stars into pixels

A star's flux is $10^{-0.4(m - 4.5)}$, its colour is a blackbody at its temperature, and dust reddens it by $E(B-V) = A_V / 3.1$.

The tricky part was lensing. Near the photon ring, one pixel can cover a long, thin sliver of sky. If you draw stars in sky space, they smear into streaks. So each star is drawn as a round spot about 1.6 pixels wide in *screen* space, by pushing its sky offset through the inverse of the screen-to-sky Jacobian:

```glsl
vec3 jx = dFdx(skyDir), jy = dFdy(skyDir);   // how the sky moves per pixel
// solve [jx jy] * s = offset for the screen offset s, then
float spot = exp(-dot(s, s) / 0.64) / pixelSolidAngle;
```

Dividing by the pixel's solid angle is what makes magnified stars get brighter, which is exactly what gravitational lensing does to a point source.

Stars fainter than the magnitude limit, or smaller than a pixel, are not lost either. Each shell's remaining light is integrated from the same luminosity function and added as a smooth glow. That is what the Milky Way's milky band actually is: millions of stars too faint to see one by one. It also means changing the resolution changes how sharp the sky is, but not how bright.

## Dust that blocks before it glows

The complete radiance for one direction is:

$$I = I_\text{stars} + I_\text{unresolved}\, e^{-\tau} + I_\text{DGL} + I_\text{emission} + I_\text{scattered} + I_\text{galaxies}$$

Dust appears twice. First as $e^{-\tau}$, dimming everything behind it. Then as diffuse galactic light (DGL): the dust also scatters the galaxy's own starlight back toward you. I computed the mean starlight of the model (2,250 flux units per steradian) once in JavaScript, and the shader uses single scattering, $I \propto 0.3\, J \left(1 - e^{-\tau}\right)$.

That combination is what finally killed the grey fog. Dust lanes are dark because they block, with a faint glow because they scatter, instead of being a flat grey layer painted over the stars.

![Extinction debug view: dust piles up along the galactic plane in clumpy, filamentary clouds](/blog/schwarzschild-lab/extinction.webp)

## Nebulae need a reason to exist

In the old version, nebulae were decoration. In this one, a nebula has to be earned.

Open clusters are drawn from the *young* disc, which is much thinner than the stellar disc (60 pc scale height), with more of them where the clouds are dense. Each cluster gets an age, a number of stars and a distance. Its most massive surviving star comes from the main-sequence turn-off for its age, $m_{max} \approx (10{,}000\,\text{Myr} / \text{age})^{0.4}$. The brightest eight members are drawn as individual stars, and the rest become a soft Plummer-profile glow.

Then the conditions:

- **HII region** (red, glowing hydrogen): only if the cluster has a star above $15\,M_\odot$, is younger than 8 Myr, *and* sits inside a dense cloud ($C > 1.3$). Its size follows the Strömgren radius, which grows with the cluster's ionising output. Its surface brightness is 16.5–19.5 mag/arcsec².
- **Reflection nebula** (blue): needs a B star, a cloud (`C > 1.1`), and *no* ionising star. It is lit with inverse-square falloff from that star and favours blue, because dust scatters blue light more.
- Otherwise: just a cluster of stars.

My first version of this rendered nothing at all. The debug view showed plenty of clusters passing every condition, but their nebulae were invisible. I had set their surface brightness about 3 magnitudes too faint, using the dim end of real nebulae. Once calibrated against real HII regions, they showed up: rare, irregular, and lit by the stars that made them.

![A young cluster's HII region: red filaments lit by its hot stars, with the black hole to the right](/blog/schwarzschild-lab/nebula.webp)

The shapes inside a nebula still come from noise. That part is a visual approximation, and I would rather admit it than pretend otherwise.

## Galaxies are faint, actually

The background galaxies follow Euclidean number counts, $N(<m) = 1500\,\text{sr}^{-1} \cdot 10^{0.6(m - 15)}$, modulated by a lognormal "large-scale structure" field so they cluster. Dust in our own galaxy hides them behind $10^{-0.6 A_B}$, so there are almost none near the plane.

Each one gets a type and shape from its hash: Sérsic $n = 4$ ellipticals, or exponential discs with random inclinations and spiral arms, star-forming knots, and a dust lane that strengthens as the disc turns edge-on. Sizes follow $R \propto L^{0.5}$.

And here the calibration bit back. At realistic counts, a galaxy at 10th magnitude is about one arcminute across: around a third of a pixel at the default zoom. So galaxies render the way they look on the real sky, as faint smudges you only find by zooming in. I left it that way. It is the honest result.

## Debug views

I added a debug selector to the panel, because without it I could not tell which part of the model was wrong:

- **Population density**: which of the four stellar populations dominates each direction
- **Extinction A_V**: how much dust is between you and infinity
- **Star-count expectation**: log stars per steradian down to the magnitude limit
- **Nebula conditions**: where clusters pass or fail the HII and reflection tests
- **Galaxy density field**: the large-scale structure behind the galaxies

The nebula bug above would have taken me much longer to find without them.

## What it still gets wrong

- Only 10 distance shells and up to 3 stars per cell. Spiral arms and young-disc structure are not modelled in 3D.
- Stellar evolution is a single mass–luminosity law plus a fixed giant fraction: no isochrones, no metallicity tracks.
- Large-scale structure is a lognormal field on the sphere, not the result of gravity.
- There are no Local Group objects: no Andromeda, no Magellanic Clouds. So a prominent galaxy almost never appears.

But the randomness now comes from a model of how things are distributed in space, not from putting coloured noise on a sphere. And because the sky is only looked up *after* each ray escapes the black hole, all of it gets lensed for free.

![The galactic centre seen through the black hole: its starlight and dust lane bent into Einstein rings](/blog/schwarzschild-lab/lensed-sky.webp)

# The Observatory

When I wrote the first version of this post, I ended it by saying I did not want a completely accurate scientific observatory simulator, because that would be an enormous project.

Two days later I started building one.

What changed my mind was a simple question the real-time renderer cannot answer: *what would a camera actually record if it pointed at this?* The Lab answers "what does it look like right now?" at 60 frames per second. Every choice in it, the disk brightness, the bloom, the camera 26 M from the hole, is made so the picture looks good. That is fine for a toy. But I kept wanting to know which parts of the picture I could defend.

So [the Schwarzschild Observatory](https://zahintapadar.github.io/schwarzschild-lab/observatory/) is a separate, slow sibling: a progressive synthetic telescope. It lives in its own folder and does not touch the real-time code.

![First Light: a thin disk around a 4.3 million solar-mass hole, seen from 20,000 gravitational radii. A synthetic HDR composite of six registered exposures, not a single frame](/blog/schwarzschild-lab/obs-first-light-hdr.webp)

## Scenes with a real size

The first rule was that every scene has physical scale. The hole has a mass, $4.3 \times 10^6\,M_\odot$ (about Sagittarius A*), and the telescope has a distance. From those two numbers, the observer sits at $r_0 = D / r_g$ gravitational radii, and the shadow and the Einstein ring have definite angular sizes:

$$\sin\alpha_{sh} = \frac{3\sqrt{3}\,\sqrt{1 - 2/r_0}}{r_0}, \qquad \theta_E \to \frac{2}{\sqrt{r_0}}$$

For First Light the telescope is 850 AU away, so the shadow's radius is 53.6″ and the Einstein radius is 48.6′. The real Sgr A* is 8 kpc away and its shadow is 26 microarcseconds, so this is a hypothetical telescope parked very close to the hole. I would rather say that than pretend.

![Left: the real-time Lab, a camera 26 M away with an artistically lit disk. Right: the Observatory at 20,000 M with a physical disk](/blog/schwarzschild-lab/obs-comparison.webp)

## A better integrator

The Lab's shader uses RK4 with a step size I picked by feel. That is fine at 60 fps, but it has no idea how wrong it is.

The Observatory works in the photon's orbital plane instead, with $u = 1/r$:

$$\frac{d^2u}{d\phi^2} = 3Mu^2 - u$$

and integrates it with an adaptive Dormand–Prince 5(4) scheme to a stated tolerance. Working in $u$ has a nice side effect: escaping to infinity is just $u = 0$, which happens at a finite angle, so the ray's final direction on the sky is exact.

Then I tested it against everything I could find an answer for: the exact shadow formula (to $10^{-6}$), the photon orbit, the weak-field deflection $4M/b + \tfrac{15\pi}{4}(M/b)^2$, Bozza's strong-field limit near the critical curve, the Einstein angle, and point-lens theory for extended sources. It also gave me a number I had wanted for a while: the Lab's RK4 and this integrator agree on where rays go to within $3 \times 10^{-4}$ radians.

![Critical Curve Study, a diagnostic: ray fate, with hatched low-confidence pixels, and image parity](/blog/schwarzschild-lab/obs-critical-curve-1.webp)

## The disk is far too bright

In the Lab I chose the disk's brightness. In the Observatory it follows from the accretion rate, using the Page–Thorne thin-disk solution. At 1% of the Eddington rate the code reports $\dot{M} = 1.7 \times 10^{-3}\,M_\odot$ per year and a peak temperature of 86,700 K at $9.55\,M$.

That has an awkward consequence. At 550 nm the disk is about 70 times brighter than the surface of the Sun. A real camera would need an ND 6 solar filter and a 20 µs exposure to keep it under full well, and at that exposure the stars are about $10^{12}$ times too faint to register.

So First Light comes in two versions, and each one says what it is:

![Left: the physical single exposure, 20 µs through ND 6, with a black sky. Right: the HDR composite of six registered frames](/blog/schwarzschild-lab/obs-first-light-pair.webp)

The single exposure is the honest detector frame. The composite merges six frames, from 20 µs through ND 6 up to 120 s unfiltered, in linear units, then applies one global display curve. No local tone mapping, no bloom. It is labelled as a composite in every file it exports.

## Lensing a nebula

The image I most wanted was a nebula behind the hole. So the Observatory generates one: a 24 pc box of turbulent gas, ionised by three massive stars, with the flow evolved by a simple Euler solver, placed 2.5 kpc behind the hole.

![Left: the nebula with lensing off. Right: lensed into an outer arc and a mirrored counter-image carrying the same dust lanes](/blog/schwarzschild-lab/obs-lensed-pair.webp)

The counter-image is mirrored, which the parity diagnostic confirms, and a debug overlay shows the same knots of gas landing in both the arc and the counter-image.

This part had my favourite bug. The gas looked grainy, and a noise index I wrote to measure it said the Hα emission was 0.42 and [S II] was 0.97: worse than noise. The first-order solver leaves a checkerboard pattern at the grid scale, and line emission, which goes as density squared, amplifies it.

I tried two fixes in the solver. Rusanov fluxes smeared the neutral shell into the ionised gas until it recombined. Fourth-order hyperdiffusion erased the turbulence. Neither was kept. What worked was a single [1, 2, 1]/4 filter pass on the stored fields, which removes the checkerboard exactly and leaves real structure almost untouched. Afterwards the indices were 0.078 and 0.19.

![Einstein Ring, structured alignment: the nebula a quarter of an Einstein radius off axis, a nearly complete but uneven ring](/blog/schwarzschild-lab/obs-einstein-ring-structured.webp)

## The deep field that was dark for the wrong reason

The Weak-Lensing Deep Field reuses the synthetic sky from earlier in this post, with a much deeper catalogue in the field of view: 17,800 stars to V = 22 and 6,900 galaxies within a degree.

The first version was dark and noisy, and I assumed the photon counts were wrong. So I wrote a tool that traces every term from magnitude to electrons. The counts were fine. A 22nd-magnitude galaxy already had a signal-to-noise of 18 in an hour.

The problem was the display. The white point sat on bright stars that saturate, so faint galaxies came out at about 3% grey. The black point sat far below the sky, so the sky's own shot noise filled the frame. Fixing the display, and moving to a 30 cm telescope so galaxies are resolved, was the whole fix.

![Left: one hour on a single detector frame. Right: 36 registered 300-second frames](/blog/schwarzschild-lab/obs-deep-field-pair.webp)

## Every image says what it is

The thing I care about most in the Observatory is not a formula. It is labelling.

Every output belongs to one class: fixture, validation, presentation or high quality. The class is earned by the resolution actually rendered, and nothing is upscaled. Every image also says whether it is a physical single exposure, a registered composite, a stacked survey, a diagnostic or false colour, in the PNG, in the FITS header and in a JSON sidecar.

![The same nebula spectra in visible light (left) and as SHO false colour (right)](/blog/schwarzschild-lab/obs-narrowband-visible.webp)

The narrowband image is a good example. The visible-light rendering looks teal, because the eye is about four times more sensitive at [O III] 501 nm than at Hα 656 nm. A camera sees the same nebula as red. Both are correct for their detectors, and the false-colour one says so.

## How slow it is

All on a fanless MacBook Air M4, CPU only. First Light at 1024 × 640 and 256 samples per pixel takes about a minute. The lensed nebula scenes take 6 to 11 minutes, because every ray that passes through the gas has to march through it. 60 unit tests and a fixture test for every preset pass.

The full numbers, and an honest list of what is still approximate, are in the [research log](/blog/schwarzschild-lab-research-log/) and the [findings log](/blog/schwarzschild-lab-findings/).

# What I want the final thing to feel like

The Lab and the Observatory now answer two different questions, and I want both.

The Lab is still the one to play with. It sits in between a fake black hole with nice post-processing and a scientific simulator:

- A black hole whose lensing comes from traced light paths
- A disk whose colour and asymmetry come from relativistic motion
- Objects that really orbit, plunge, and precess
- A sky that feels vast because it is generated from meaningful distributions
- Enough controls that someone can experiment without needing to understand every equation

The Observatory is the one that has to justify itself. It is slow, it labels everything, and it keeps a list of what it still gets wrong: a static observer, a thin disk with no corona or jet, a nebula solver with no energy equation, and no spinning black holes. A Kerr hole needs its own validated integrator, and until it has one, nothing in the project gets called Kerr.

Right now, both are still very much a work in progress.

But the best part is that every new piece makes the black hole feel less like a visual effect and more like a place.
