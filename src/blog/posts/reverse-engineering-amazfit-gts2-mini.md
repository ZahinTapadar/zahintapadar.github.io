---
title: Reverse-Engineering My Amazfit GTS 2 Mini
subtitle: from BLE packets to the watchface format
date: 2026-11-06
tags: reverse-engineering, bluetooth, firmware, arm, python
repo: https://github.com/ZahinTapadar/amazfit-gts2-mini-re
description: An authorized, from-scratch teardown of my own smartwatch — BLE reconnaissance, a re-implemented auth handshake, firmware disassembly down to the Cortex-M33, and the fully decoded watchface format.
---

I own an Amazfit GTS 2 Mini. It talks only to one app, shows only the watchfaces that app allows, and is otherwise a sealed little computer on my wrist. I wanted to know how much of it I could understand from the outside — not to break anything, just to *see*.

So I took it apart in software, on my Mac, with Python. This is the devlog.

> **Scope & ethics.** Everything here was done on **my own device**, with **my own credentials**, for learning and interoperability. Nothing destructive was sent to the watch; no firmware was flashed; no security mechanism was defeated. Where I analyse a signature check, the goal is to *understand* it, not break it. Device secrets stay local and are not published, and no vendor firmware, app, or artwork is redistributed — only my own code and findings. Full code: [github.com/ZahinTapadar/amazfit-gts2-mini-re](https://github.com/ZahinTapadar/amazfit-gts2-mini-re).

I ran it as five milestones, and I kept one rule the whole way that turned out to matter more than any single trick: tag every claim as **[V] verified from evidence**, **[I] inference**, or **[?] open** — and walk back any inference the moment it gets ahead of the bytes.

# The target

| | |
|---|---|
| Device | Amazfit GTS 2 Mini |
| Firmware | V1.0.7.62 |
| Host | macOS (Apple Silicon), Python + Bleak |
| Radio | Bluetooth Low Energy (GATT) |
| SoC (discovered) | Dialog Semiconductor **DA1469x**, ARM **Cortex-M33** |

# Milestone 1 — getting it to talk

The first job was just to reach the watch. On macOS, CoreBluetooth hides MAC addresses and refers to a device by an opaque UUID, so step one was enumerating the whole GATT database: services, characteristics, properties, descriptors.

Two obstacles cost real time and are worth writing down:

- **A sandboxed app can't use Bluetooth.** Running the BLE stack from inside one host process crashed instantly — missing `NSBluetoothAlwaysUsageDescription`. The fix was to drive everything from a terminal that already holds the macOS Bluetooth permission.
- **macOS silently adopts the watch as an HID device.** Once the system connects it as a keyboard-like peripheral, the watch *stops advertising*, so a scan never finds it. The reliable move was to connect **directly by its known CoreBluetooth UUID** (which works for already-connected peripherals), and toggle Bluetooth to free the link when that failed.

Out of this came a full GATT map, with the Huami vendor service and its characteristics identified. **[V]**

# Milestone 2 — authentication

Amazfit watches of this generation use a challenge–response handshake over a dedicated characteristic:

```
→ 82 00 02 01 00                 request a random challenge
← 10 82 01 <16 random bytes>     the challenge
→ 83 00 AES-128-ECB(key, rnd)    the response
← 10 83 01                       authenticated
```

The shared key is the 16-byte pairing key the official app stores when you bind the watch. With it, re-implementing the handshake in Python (AES-128-ECB, the `0x80` "encrypted" flag for this pre-2021 protocol generation) authenticated on the first try. **[V]** Authenticating to your own device with your own key isn't an attack — it's what the vendor app already does. The key lives in a git-ignored file and is never printed or committed.

# Milestone 3 — the live protocol

With an authenticated link I mapped the protocol, using the open-source Gadgetbridge project as a reference for byte layouts — but **validating every decoder against real packets from the watch**, not trusting the reference blindly:

- **Battery** — level, charging state, and two 7-byte charge-time calendars. (Gadgetbridge's offset decoded to garbage on this model; I found the clean calendars empirically.)
- **Steps** — real-time step count, 16-bit little-endian.
- **Heart rate** — one-shot measurement over the standard heart-rate characteristics, validated on-wrist.

This became a small modular Python library with a pure, Bluetooth-free protocol layer and unit tests run against captured packets. The notification path is coded but **deliberately left un-fired** — marked reference-derived, not physically verified. **[V for battery / steps / heart rate]**

# Milestone 4 — into the firmware

This is where it got fun.

I obtained the exact firmware for my device, preserved it read-only with its own SHA-256, and treated the download as *untrusted* — flagging that without the vendor's authenticated API, authenticity-versus-official is unverified. Two build timestamps existed for the same version; a byte-diff proved them **code-identical** (70 of 2,132,952 bytes differ: a checksum, one field, and a 64-byte trailer). That killed the "which build?" question instantly. **[V]**

The image is **not encrypted** — entropy ~7.0, over 8,500 readable strings. Strings like `DIALOG SEMI-BLE` pinned the SoC family; task names (`APP_TASK`, `SENSOR_TASK`, `DFU TASK`) confirmed a task-based RTOS — though I was careful *not* to name a specific kernel without evidence. **[V]**

Then the disassembly. With no off-the-shelf loader for a headerless ARM image, I worked out the load model by hand: found the vector table, disassembled the reset handler with capstone, and got a textbook Cortex-M C-runtime startup. The wide Thumb-2 encodings (`ldm.w`, `it`, `cbz`) **rule out** Cortex-M0/M0+, and the initial stack pointer sits in the `0x2000_0000` SRAM window of the DA1469x memory map. That pins it: **Dialog DA1469x, ARM Cortex-M33.** **[V]**

## The part where I was wrong

The running firmware's updater **verifies a signature** on any incoming image before applying it — the strings `start veriy file signature`, `signature verify failed` / `ok` are right there. That it checks is solid **[V]**.

My first instinct was to call the scheme AES-CMAC, because the one crypto string in the image was `CMAC v1.0.0`. I was wrong, and said so:

- `CRYPTO` turned out to be a **logging subsystem tag**, not evidence of the primitive.
- A bare AES-CMAC tag is **16 bytes** — the trailer is **64**, so it is not a CMAC output on its own.
- The absence of `RSA`/`ECDSA` strings is weak evidence; a hardware crypto engine leaves none.

So the honest verdict is narrower and more useful than the confident-but-wrong one: **update-signature verification exists; the exact scheme is unproven.** Custom firmware stays a *feasibility hypothesis*, not an established possibility — and I did not attempt to break the check. **[I/?]**

# Milestone 5 — the watchface format

The realistic path to running my own software on this watch isn't replacing firmware — it's **custom watchfaces**, which are just data. So I reverse-engineered the dial package I pulled from my phone.

The firmware's resource pack uses a `NERES` container; the installed watchface uses a **`UIHH`** container. Decoding `ret.bin` byte by byte gave the whole structure:

```
UIHH header + fixed fields (sect0 = sect2 + sect3 = payload)
  → protobuf WIDGET LAYOUT  (positions + image indices)
  → IMAGE OFFSET TABLE      (82 × u32, relative to the image base)
  → 82 "BM" image blobs
  → zero padding
```

The offset table was the key find: all 82 entries land **exactly** on an image header, which gives deterministic image boundaries instead of fragile signature-scanning. The protobuf layout raw-decodes into widget slots carrying canvas positions and image indices — nested `{x, y, w, h}` digit boxes reveal an HH/MM time stack on the **306 × 354** display (confirmed by the single full-screen background image). **[V structure; I widget meaning]**

I then wrote an image decoder that takes boundaries from the offset table, verifies every image against its declared dimensions, and renders a contact sheet:

- **Every one of the 82 watchface images is raw** — one 306×354 **RGB565** background plus 81 **RGB888** elements — and decodes to exact dimensions. The contact sheet makes each resource legible: the time digits, the weekday names across locales, the AM/PM glyphs. **[V]**
- The firmware's `.res` pack instead mixes raw and a **compressed codec** (147 raw / 382 compressed) — a separate scheme I reported as *not yet reversed* rather than guessed.
- One honest gap remains: the 24-bit elements render with a colour/transparency quirk (channel order + a chroma-key) I haven't fully confirmed.

# What it adds up to

| Layer | Result |
|---|---|
| BLE / GATT | Fully mapped; live authenticated session **[V]** |
| Auth | Huami AES-128 challenge-response re-implemented **[V]** |
| Sensors | Battery / steps / heart-rate decoders validated live **[V]** |
| Executable image | Base address, startup code, **Cortex-M33 / DA1469x** **[V]** |
| Update security | Signature verification **exists [V]**; scheme **unproven [?]** |
| Watchface | `UIHH` container + layout + offset table parsed; 82 images decoded **[V]** |

Custom **watchfaces** are tractable and don't touch the signed-firmware boundary — that's the real first step toward independent software on this watch. Custom **firmware** stays a hypothesis gated by a signature check I chose to understand, not break.

The thing I'm proudest of isn't any single find. It's the discipline: separating what the bytes *prove* from what they merely *suggest*, walking back the AES-CMAC claim the moment it outran the evidence, and refusing to flash anything until the format and its validation were actually understood.

*Tools: Python, Bleak, cryptography, capstone, Pillow, adb, and Gadgetbridge as an open-source protocol reference. No vendor binaries or device keys are included in the [repo](https://github.com/ZahinTapadar/amazfit-gts2-mini-re).*
