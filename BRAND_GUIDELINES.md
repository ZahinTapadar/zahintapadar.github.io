# 🎨 Brand & Design System Guidelines
## Zahin Tapadar — Full Stack Developer Portfolio

> **Purpose:** This document defines the complete brand identity, design system, and color palette for Zahin Tapadar's portfolio. Use as a definitive reference for generating consistent, on-brand UI/UX.

---

## 1. CORE DESIGN SYSTEM (STRICT)

### Palette

| Swatch | Name | Hex | RGB | Usage |
|--------|------|-----|-----|-------|
| 🟢 | **Moss (Primary)** | `#2E4036` | `rgb(46, 64, 54)` | Primary brand color, nav text on scroll, section backgrounds, footer. |
| 🟠 | **Clay (Accent)** | `#CC5833` | `rgb(204, 88, 51)` | CTA buttons, links, highlights, interactive elements. |
| ⬜ | **Cream (Background)** | `#F2F0E9` | `rgb(242, 240, 233)` | Primary page background, card surfaces, light sections. |
| ⬛ | **Charcoal (Text/Dark)** | `#1A1A1A` | `rgb(26, 26, 26)` | Primary text, section headings, dark section backgrounds. |

#### Hero Gradient (Display Text Only)
A warm yellow → pink → orange gradient used exclusively for the hero display text (name & title).

```css
--gradient-hero: linear-gradient(135deg, #F6C445 0%, #E8724A 40%, #E85694 70%, #F6A04A 100%);
```

#### Color Usage Rules
```
Background:           Cream (#F2F0E9) — primary surface
Text:                 Charcoal (#1A1A1A) — body/headings
Accent:               Clay (#CC5833) — CTAs, links, hovers
Primary Brand:        Moss (#2E4036) — nav, footer, badges
Hero Display:         Gradient (yellow → pink → orange)
Dark Sections:        Charcoal (#1A1A1A) background + Cream text
```

### CSS Custom Properties
```css
:root {
  /* Core Palette */
  --color-moss: #2E4036;
  --color-clay: #CC5833;
  --color-cream: #F2F0E9;
  --color-charcoal: #1A1A1A;

  /* Semantic Aliases */
  --color-bg-primary: var(--color-cream);
  --color-bg-dark: var(--color-charcoal);
  --color-text-primary: var(--color-charcoal);
  --color-text-light: var(--color-cream);
  --color-text-secondary: #6B6B6B;
  --color-accent: var(--color-clay);
  --color-accent-hover: #D96A3C;
  --color-brand: var(--color-moss);

  /* Hero Gradient */
  --gradient-hero: linear-gradient(135deg, #F6C445 0%, #E8724A 40%, #E85694 70%, #F6A04A 100%);

  /* Functional */
  --color-border: rgba(46, 64, 54, 0.12);
  --color-border-light: rgba(26, 26, 26, 0.06);
  --color-overlay: rgba(26, 26, 26, 0.6);
  --color-glass: rgba(255, 255, 255, 0.60);
  --color-glass-border: rgba(46, 64, 54, 0.08);
}
```

---

## 2. Typography

### Font Stack

| Role | Font Family | Weight | Style |
|------|-------------|--------|-------|
| **Headings / Display** | `"Plus Jakarta Sans"` | 700–800 | Normal, tracking tight |
| **Sub-headings / Nav** | `"Outfit"` | 400–600 | Normal, tracking tight |
| **Drama / Emphasis** | `"Cormorant Garamond"` | 400–500 | *Italic* — used for biological/organic concepts |
| **Body** | `"Plus Jakarta Sans"` | 400–500 | Normal |
| **Data / Telemetry** | `"JetBrains Mono"` or `"IBM Plex Mono"` | 400 | Normal — clean monospace for clinical data |

> **Key Rule:** Cormorant Garamond **must always be set in italic** when used. It's reserved for organic, biological, or poetic emphasis.

### Type Scale
```css
--font-size-display:    clamp(3.5rem, 8vw, 7rem);
--font-size-h1:         clamp(2.5rem, 5vw, 4.5rem);
--font-size-h2:         clamp(1.75rem, 3vw, 2.5rem);
--font-size-h3:         clamp(1.25rem, 2vw, 1.5rem);
--font-size-body:       1rem;
--font-size-small:      0.875rem;
--font-size-micro:      0.75rem;

--line-height-display:  0.95;
--line-height-heading:  1.1;
--line-height-body:     1.6;

--tracking-tight:      -0.02em;
--tracking-normal:      0;
--tracking-wide:        0.08em;
--tracking-wider:       0.15em;
```

### Typography Patterns

**Hero Name:**
```
"Zahin Tapadar" — Plus Jakarta Sans, 800 weight, Charcoal (#1A1A1A)
```

**Hero Title:**
```
"Full Stack Developer" — Cormorant Garamond, Italic, #E8724A (Signal Coral)
```

**Section Titles:**
```
"About" — Outfit, 600 weight, Charcoal
```

**Organic Emphasis:**
```
"crafting experiences" — Cormorant Garamond, italic, Clay accent
```

---

## 3. Visual Texture

### Noise Overlay (MANDATORY)
A global SVG noise overlay must be applied to eliminate flat digital gradients.

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

### Border Radius System
All containers must use the rounded system:
```css
--radius-sm: 1rem;
--radius-md: 2rem;
--radius-lg: 3rem;
--radius-pill: 100px;
```

---

## 4. COMPONENT ARCHITECTURE & BEHAVIOR

### A. NAVBAR (The Floating Island)

A fixed, pill-shaped container with morphing behavior based on scroll position.

**Default State (At Hero Top):**
- Transparent background
- White text
- No border
- Centered horizontally with auto margins
- Pill shape (`border-radius: var(--radius-pill)`)

**Scrolled State (After ~100px scroll):**
- `background: rgba(255, 255, 255, 0.60)` — glassmorphic
- `backdrop-filter: blur(20px)`
- Text color transitions to Moss (`#2E4036`)
- Subtle border: `1px solid rgba(46, 64, 54, 0.08)`
- Slight shadow for depth

```css
.nav-island {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  gap: 2rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* Default: transparent */
  background: transparent;
  color: white;
  border: 1px solid transparent;
}

.nav-island.scrolled {
  background: rgba(255, 255, 255, 0.60);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--color-moss);
  border: 1px solid var(--color-glass-border);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}
```

---

### B. Cards
```css
.card {
  border-radius: var(--radius-md);     /* 2rem */
  overflow: hidden;
  background: white;
  transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.card:hover {
  transform: scale(1.02);
}
```

### C. Buttons
```css
.btn-primary {
  background: var(--color-clay);
  color: var(--color-cream);
  border: none;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-pill);
  font-family: 'Outfit', sans-serif;
  font-size: var(--font-size-small);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  background: var(--color-moss);
  color: var(--color-cream);
}
```

---

## 5. Layout & Grid

```css
--grid-columns: 12;
--grid-gutter: 1.5rem;
--grid-margin: clamp(1.5rem, 5vw, 6rem);
--max-width: 1440px;
--content-max-width: 1200px;
--content-narrow: 800px;
```

### Section Anatomy
- Section padding: `clamp(4rem, 10vh, 8rem) 0`
- Container: `max-width: var(--max-width); margin: 0 auto; padding: 0 var(--grid-margin)`
- All section containers use `border-radius: var(--radius-lg)` (3rem)

---

## 6. Spacing System

```css
--space-xs:   0.25rem;
--space-sm:   0.5rem;
--space-md:   1rem;
--space-lg:   1.5rem;
--space-xl:   2rem;
--space-2xl:  3rem;
--space-3xl:  4rem;
--space-4xl:  6rem;
--space-5xl:  8rem;
```

---

## 7. Motion & Interaction

### Easing Functions
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Animation Durations
```css
--duration-fast:    150ms;
--duration-normal:  300ms;
--duration-slow:    600ms;
--duration-slower:  1000ms;
```

### Scroll Animations
```css
[data-animate] {
  opacity: 0;
  transform: translateY(2rem);
  transition: opacity 0.8s var(--ease-out-quart), transform 0.8s var(--ease-out-quart);
}
[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 8. Spline 3D Integration

The portfolio uses Spline 3D scenes embedded in the hero section.

**Key Rules:**
- Always lazy-load the Spline component (`@splinetool/react-spline`)
- Show a loading state while the scene loads
- Max 150k polygons per scene
- ≤ 3 lights per scene
- On mobile, consider showing a static fallback image
- Use `onLoad` callback to fade in the scene

---

## 9. Responsive Breakpoints

```css
--bp-mobile:   480px;
--bp-tablet:   768px;
--bp-desktop:  1024px;
--bp-wide:     1440px;
--bp-ultra:    1920px;
```

---

## 10. Design Principles Summary

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **Warm & Organic** | Cream backgrounds, moss greens, clay accents — earthy and natural. |
| 2 | **Typography is the hero** | Oversized gradient display text, mixed font families for contrast. |
| 3 | **Texture over flat** | SVG noise overlay on everything. No pure digital gradients. |
| 4 | **Rounded & soft** | 2rem–3rem border radius on all containers. Pill-shaped nav/buttons. |
| 5 | **Strategic gradient** | Hero text uses warm yellow-pink-orange gradient. Nowhere else. |
| 6 | **Glassmorphic nav** | Floating island navbar morphs from transparent to glass on scroll. |
| 7 | **Motion with purpose** | Subtle scroll animations and hover effects. Nothing excessive. |
| 8 | **3D integration** | Spline scenes as hero backgrounds, lazy-loaded with fallbacks. |
| 9 | **Minimal UI chrome** | No heavy borders or shadows. Content and typography define structure. |
| 10 | **Monospace for data** | Clinical, precise monospace for any data/stats/telemetry elements. |

---

*Portfolio design system for Zahin Tapadar — Full Stack Developer.*
