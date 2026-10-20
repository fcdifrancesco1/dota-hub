# Aurora Glass Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Aurora Glass" modern design system across Dota 2 Competitive Hub, featuring frosted glassmorphism, 3D tilt motion, animated character video cards, and electric cobalt/emerald/crimson accents harmonized with the site's light and dark themes.

**Architecture:** Extend Tailwind configuration and CSS custom properties with Aurora Glass tokens. Build a standalone interactive `AnimatedHeroCard` with Valve WebM video renders and 3D pointer physics. Upgrade `HomeHero`, `LiveTickerStrip`, `LiveMatchesSection`, and `Header` to use the translucent glass surfaces and kinetic elements.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide React, Valve WebM character renders.

**Spec:** Option 2 "Aurora Glass" approved by user in conversation transcript.

## Global Constraints
- Support both Light Theme (`data-theme="light"`) and Dark Theme seamlessly.
- Preserve all existing functionality, APIs (OpenDota, Valve Coordinator, Liquipedia), and routing.
- Keep minimum font size at 12px (`text-xs`) or higher for accessibility.
- Zero external build dependencies; maintain clean `npm run build`.

---

### Task 1: Core Theme & CSS Tokens (Aurora Glass styling, glassmorphism, 3D tilt, animations)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS utility classes `.glass-light`, `.glass-dark`, `.tilt-card`, `.holo-sheen`, `@keyframes heroFloat`, and enhanced color variables.

- [ ] **Step 1: Update `tailwind.config.js` with Aurora Glass tokens**
  - Add electric cobalt (`#1D4ED8` / `#2563EB`) as the primary action accent in light theme.
  - Refine surface tokens: canvas `#FBF7F0`, surface `rgba(255, 255, 255, 0.85)` in light, `rgba(14, 18, 28, 0.82)` in dark.
- [ ] **Step 2: Update `src/index.css` with motion and glass classes**
  - Add `.glass-light` with `backdrop-filter: blur(20px)` and soft box-shadows.
  - Add `.tilt-card` with `transform-style: preserve-3d` and smooth spring transitions.
  - Add `.holo-sheen` for dynamic mouse-following light reflection.
  - Add `@keyframes heroFloat` and `@keyframes gentlePulse`.
- [ ] **Step 3: Verify build with updated CSS and tokens**
  - Run `npm run build` to verify no Tailwind compilation errors.

---

### Task 2: Interactive Character Motion Card (`src/components/home/AnimatedHeroCard.jsx`)

**Files:**
- Create: `src/components/home/AnimatedHeroCard.jsx`

**Interfaces:**
- Produces: `<AnimatedHeroCard />` component accepting optional `heroKey` or defaulting to meta spotlight with interactive switcher.

- [ ] **Step 1: Implement `AnimatedHeroCard.jsx`**
  - Include official Valve looping WebM renders: Juggernaut, Invoker, Pudge, and Phantom Assassin.
  - Implement 3D mouse tracking tilt with pointer coordinates.
  - Add interactive hero selector buttons for quick switching.
  - Display meta statistics: winrate, tactical role, pro player specialist, and Tier S+ badge.
  - Add floating aura lighting behind the character.
- [ ] **Step 2: Add image fallback**
  - Ensure `<img />` fallback displays smoothly if browser restricts autoplay.

---

### Task 3: Hero Section & Home Page Overhaul (`src/components/home/HomeHero.jsx` & `src/pages/Home.jsx`)

**Files:**
- Modify: `src/components/home/HomeHero.jsx`
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `<AnimatedHeroCard />` from `src/components/home/AnimatedHeroCard.jsx`
- Produces: Modernized Home hero banner with frosted glass and character motion spotlight.

- [ ] **Step 1: Upgrade `HomeHero.jsx` with Aurora Glass styling**
  - Wrap in frosted glass container with smooth translucent border and ambient radial glow.
  - Style countdown timer into clean pearl/glass stat tiles.
  - Modernize CTA buttons with soft glow and electric cobalt gradients.
- [ ] **Step 2: Integrate `AnimatedHeroCard` into `Home.jsx`**
  - Position `AnimatedHeroCard` prominently in the layout (either alongside the hero or above stats cards).
  - Test responsive layout on mobile, tablet, and wide desktop screens.

---

### Task 4: Live Ticker & Match Cards Revamp (`src/components/home/LiveTickerStrip.jsx` & `src/components/LiveMatchesSection.jsx`)

**Files:**
- Modify: `src/components/home/LiveTickerStrip.jsx`
- Modify: `src/components/LiveMatchesSection.jsx`

**Interfaces:**
- Produces: Modern scorebug cards with 3D tilt, animated gold ratio bar, and glowing live badges.

- [ ] **Step 1: Modernize `LiveTickerStrip.jsx`**
  - Apply frosted glass background and smooth borders.
  - Enhance live pulsing beacons and match scores.
- [ ] **Step 2: Modernize `LiveMatchesSection.jsx`**
  - Add 3D tilt interaction to match cards.
  - Implement the clean scorebug layout with high-legibility kills score and gold lead progress bar.
  - Protect team logos with clean high-contrast container styling.

---

### Task 5: Header Navigation & Ambient Aura (`src/components/Header.jsx` & `src/App.jsx`)

**Files:**
- Modify: `src/components/Header.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: Frosted glass header navbar and ambient light glows across page backdrop.

- [ ] **Step 1: Upgrade `Header.jsx`**
  - Apply `backdrop-filter: blur(20px)` with subtle translucent border.
  - Active navigation item with electric cobalt underline/pill.
  - Enhanced theme toggle and live match count indicator.
- [ ] **Step 2: Enhance `App.jsx` backdrop**
  - Add subtle ambient aurora glows to the application background that complement both light and dark themes.

---

### Task 6: Build Verification, Quality Check & Deployment

**Files:**
- Modify: All affected files

- [ ] **Step 1: Run local production build**
  - Execute `npm run build` and ensure 0 errors.
- [ ] **Step 2: Verify in browser**
  - Test light and dark theme switching.
  - Verify character video animation playback and 3D tilt response.
- [ ] **Step 3: Commit and deploy to Vercel**
  - `git add -A; git commit -m "feat(ui): redesign aurora glass com motion e cards animados"`
  - `git push origin main`
  - `npx vercel --prod --yes`
