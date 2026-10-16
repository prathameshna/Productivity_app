---
name: Serene Cadence
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#444748'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#5e5f59'
  on-secondary: '#ffffff'
  secondary-container: '#e3e3db'
  on-secondary-container: '#64655f'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1a'
  on-tertiary-container: '#878381'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e3e3db'
  secondary-fixed-dim: '#c7c7c0'
  on-secondary-fixed: '#1a1c18'
  on-secondary-fixed-variant: '#464742'
  tertiary-fixed: '#e7e1df'
  tertiary-fixed-dim: '#cac5c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#494645'
  background: '#faf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies mindful utility and quiet focus. Designed for individuals seeking refuge from digital overwhelm, it strips away cognitive clutter to prioritize clarity, intent, and gentle structure. The aesthetic merges contemporary Scandinavian warmth with Japanese functional minimalism—prioritizing tactile restraint over artificial flashiness.

The interface evokes serenity, grounding, and deliberate momentum. It treats digital productivity not as relentless throughput, but as peaceful cadence. Micro-interactions are deliberate and unhurried, typography speaks with considered clarity, and negative space is embraced as a fundamental navigational tool rather than unused real estate.

## Colors

The palette relies on a natural linen background (`#F5F4F1`) and crisp, bright surfaces (`#FFFFFF`) to establish a calm, paper-like baseline. Depth is created through structural lines (`#E6E4DD`) rather than contrasting drop shadows. High-emphasis copy utilizes deep mineral ink (`#171715`), while secondary annotations recede gracefully into neutral graphite (`#6F706A`).

Domain-specific features are distinguished by desaturated, natural earth accents paired with gentle surface tints:
- **Tasks:** Moss green (`#60765D`) on whisper-leaf tint (`#EDF2E9`)
- **Workspace:** Deep sage (`#35685F`) on glacial tint (`#E8F1ED`)
- **Calendar:** Ochre (`#A77A2A`) on warm wheat tint (`#F5EEDC`)
- **Sticky Notes:** Amber sun (`#B18A2E`) on parchment tint (`#F8F1D9`)
- **Alarm:** Terracotta (`#C96543`) on soft clay tint (`#F9ECE5`)
- **Focus & Blocking:** Crimson garnet (`#B83A4B`) on blush tint (`#F7E9EC`)
- **News & Reading:** Muted amethyst (`#786384`) on heather tint (`#F0ECF4`)
- **AI Voice Command:** Pure ink (`#080808`) for authoritative focus.

Never use pure black for structural body text; reserve `#080808` exclusively for primary action triggers and intentional anchors.

## Typography

The typographic hierarchy relies entirely on **Plus Jakarta Sans**, tuned to maintain legibility without harsh visual weight. Avoid weights above 600. Large editorial headers use weight 600 with subtle negative tracking (`-0.02em`), retaining warmth through the typeface's softened humanist shapes.

Body text maintains a reading weight of 400 with open, breathable line heights to prevent visual crowding in dense lists and scheduling views. Labels, buttons, tags, and data indicators use weight 500 for crisp articulation at smaller scale factors without screaming for visual attention.

## Layout & Spacing

Layouts adhere strictly to an 8px modular cadence on a reference frame of 390×844pt. Content sits comfortably within horizontal margins of 20px (`1.25rem`), keeping content clear of touch edges and accommodating standard device safe areas (such as the Dynamic Island and bottom indicator notch).

Elements are composed within single-column or soft 2-column balanced card flows. Stacking uses rhythm clusters: tight intra-component groups (4px to 8px), component internal padding (16px to 20px), and expansive section gaps (24px to 32px) to induce an unhurried, calm browsing tempo.

## Elevation & Depth

Spatial layering relies predominantly on flat, surface-on-canvas contrasts complemented by delicate low-contrast outlines (`1px solid #E6E4DD`). Deep drop shadows are discarded in favor of two restrained, ambient tiers:

1. **Resting Cards & Surfaces:** Pure `#FFFFFF` surface backed by a subtle 1px border (`#E6E4DD`) on the `#F5F4F1` background canvas, with a diffused whisper shadow: `0 2px 8px -2px rgba(23, 23, 21, 0.03)`.
2. **Elevated Overlays & Modals:** `0 12px 32px -4px rgba(23, 23, 21, 0.08)`, bounded by a 1px border in `#E6E4DD`.
3. **Floating Controls & Action Buttons:** AI and floating utility buttons leverage a dense, soft ambient spread: `0 8px 24px -4px rgba(8, 8, 8, 0.16)`.

## Shapes

The geometric signature balances structured cleanliness with soft, organic curves. Primary cards and surface panels standardize on a continuous corner radius between 16px and 20px. 

Interactive controls like chips, segment pills, and button handles use fully rounded pill profiles (`9999px`) to create an intuitive distinction between interactive triggers and static informational containers.

## Components

### Buttons
- **Primary:** Background `#080808`, text `#FFFFFF`, height 48px, radius 24px (pill), horizontal padding 20px. Typography: `label-lg` (500 weight). Pressed state shifts opacity to 0.88.
- **Secondary:** Background `#FFFFFF`, 1px border `#E6E4DD`, text `#171715`, height 48px, radius 24px.
- **Ghost/Tertiary:** Background transparent, text `#6F706A`, hover/active text `#171715`.

### Chips & Tags
- Feature tags employ the paired feature color and pastel tint (e.g., Focus chip uses `#F7E9EC` background with `#B83A4B` text).
- Radius is pill-form (`9999px`), height 28px, padding 4px 12px. Typography: `label-sm`.

### Cards & Surfaces
- Background `#FFFFFF`, corner radius 18px, 1px border `#E6E4DD`.
- Internal padding: 16px vertical, 18px horizontal. No hard divider lines; subtle spacing separates metadata from primary titles.

### Form Inputs
- Single-line fields and text areas feature `#FFFFFF` background, 1px border `#E6E4DD`, radius 14px, and minimum touch height of 48px. 
- Focused state transitions border to `#171715` with no harsh halo or glow.
- Placeholder copy rendered in `#6F706A` at `body-md`.

### Selection Controls
- **Checkboxes:** 20×20px rounded squares (radius 6px), 1.5px border `#E6E4DD`. On check: filled with Task accent `#60765D` (or `#080808`), displaying an inset white stroke icon.
- **Radio Buttons:** 20×20px circle, 1.5px border `#E6E4DD`. Selected state features an inner concentric circle of 10px in `#080808`.

### Lists
- Separated by whitespace gaps of 8px rather than continuous hairline dividers. Item height spans 56px to 64px for comfortable touch ergonomics.

### AI Voice Interaction Floating Hub
- Dedicated 56×56px circle positioned at bottom center or right floating coordinates.
- Finish: `#080808` ink fill, elevating `0 8px 24px -4px rgba(8, 8, 8, 0.18)`.
- Icon: Crisp 24px microphone icon rendered in `#FFFFFF` with 2px line weight and rounded stroke terminals.

### Iconography Rules
- Lucide-style outline icons with consistent 1.75px to 2px stroke weight, round cap ends, and round join corners.
- Scaling tiers: 24px (navigation and primary actions), 20px (card meta and inline tools), 16px (micro badges and inline timestamps).