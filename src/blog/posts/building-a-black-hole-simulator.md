---
title: Building a Black Hole Simulator
subtitle: not a tutorial, just a devlog
date: 2026-10-23
tags: graphics, physics, rust, webassembly, webgl
project: https://zahintapadar.github.io/schwarzschild-lab/
repo: https://github.com/ZahinTapadar/schwarzschild-lab
description: A devlog on Schwarzschild Lab, a real-time black hole simulator in the browser: per-pixel light-ray tracing in WebGL2 and a Rust/WebAssembly orbit engine.
cover: /blog/schwarzschild-lab/gargantua.webp
---

I wanted to make a black hole simulation that looks beautiful, but also does not completely lie about the physics.

A lot of black hole visuals are basically a dark circle with a glowing ring around it. That can look cool, but the part that makes a black hole actually interesting is that light itself bends around it. The image should not be painted around the black hole — it should emerge from tracing where each ray of light would go.

So this project became [Schwarzschild Lab](https://zahintapadar.github.io/schwarzschild-lab/): a real-time black hole simulator in the browser.

::simulator

The graphics are written in WebGL2 shaders, while the movement of planets, stars, and debris is handled by a Rust physics engine compiled to WebAssembly.

# The main idea

The black hole uses the Schwarzschild metric, which describes spacetime around a non-rotating black hole.

I use geometric units:

```
G = c = 1
```

This makes the equations much less painful to work with. The black hole mass becomes `M`, and the event horizon is at:

```
r = 2M
```

The photon sphere — where light can orbit the black hole — is at:

```
r = 3M
```

And the visible black-hole shadow is larger than both of those. Its critical radius is:

```
b_c = 3√3 M
```

That is why a black hole does not just look like a perfectly sized dark disk. Light from behind it is bent, captured, or sent back toward the camera.

# Ray tracing light instead of drawing a black hole

The renderer begins with one ray for every pixel on screen.

Normally, a ray tracer would send a ray in a straight line:

```js
position += direction * stepSize;
```

But that obviously does not work near a black hole.

Instead, the ray is continuously accelerated toward the black hole. In the shader, I integrate the ray path with RK4 — Runge–Kutta fourth order integration.

Very roughly, the ray acceleration looks like this:

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

For the temperature profile, I use a Novikov–Thorne-inspired disk model. The important visual effect is that the disk is not uniformly orange. Its local temperature affects its colour, and hotter regions shift toward white or blue.

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

```
observed colour = local colour × gravitational shift × Doppler shift
```

The result is one of my favourite parts of the whole project. One side of the disk becomes intense and sharp, while the other fades into the darkness.

![Same disk with Doppler beaming on: the approaching side burns white, the receding side fades](/blog/schwarzschild-lab/doppler.webp)

It is the difference between a glowing ring and something that starts to feel alive.

# The physics engine

The ray tracer handles light, but I also wanted objects that could move around the black hole.

Planets, stars, debris clouds, and gas should not simply orbit in perfect circles because I animated them that way. They should follow the black hole’s gravity.

For this, I wrote a small Rust engine and compiled it to WebAssembly.

The engine integrates massive bodies using Schwarzschild timelike geodesics. That means objects can:

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

So the fix was not “more noise.”

I threw that version out and built a synthetic-sky model based on actual astronomical ideas, loosely following population-synthesis models like the one behind Gaia’s simulated sky:

- Thin disk, thick disk, bulge, and halo populations for stars
- Distance-dependent brightness and extinction, integrated along each line of sight
- A proper luminosity distribution (a Kroupa mass function) instead of equally bright dots
- Dust that blocks light before it emits light
- Nebulae that only appear where dense gas and hot stars make sense together
- Sparse galaxies generated from correlated large-scale density fields
- Stable seeds, so the same universe can be recreated exactly

The nice surprise was that the model could be checked. Counting how many stars it predicts across the whole sky lands within about 30% of the real counts, from the brightest stars down to 15th magnitude. That is not what I expected from something running inside a fragment shader.

![Debug view of the dust: extinction piles up along the galactic plane in clumpy, filamentary clouds](/blog/schwarzschild-lab/extinction.webp)

It is still procedural, but the randomness now comes from a model of how things are distributed in space — not from putting coloured noise on a sphere. And because the sky is only looked up *after* each ray escapes the black hole, all of it gets lensed for free.

![The galactic centre seen through the black hole: its starlight and dust lane bent into Einstein rings](/blog/schwarzschild-lab/lensed-sky.webp)

One honest side effect: galaxies are now about as faint and rare as they are on the real sky. They are there, but you have to zoom in to find them.

# What I want the final thing to feel like

I do not want a completely accurate scientific observatory simulator. That would be an enormous project.

But I also do not want a fake black hole with nice post-processing.

I want something in between:

- A black hole whose lensing comes from traced light paths
- A disk whose colour and asymmetry come from relativistic motion
- Objects that really orbit, plunge, and precess
- A sky that feels vast because it is generated from meaningful distributions
- Enough controls that someone can experiment without needing to understand every equation

Right now, the project is still very much a work in progress.

But the best part is that every new piece makes the black hole feel less like a visual effect and more like a place.
