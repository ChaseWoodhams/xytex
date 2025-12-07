# Xytex Style Guide

A comprehensive documentation of all visual and technical design specifications for the Xytex website.

**Last Updated:** December 2025  
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS 4

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Buttons](#buttons)
4. [Cards](#cards)
5. [Form Inputs](#form-inputs)
6. [Header](#header)
7. [Footer](#footer)
8. [Shadows](#shadows)
9. [Gradients](#gradients)
10. [Spacing](#spacing)
11. [Badges](#badges)
12. [Animations](#animations)
13. [Accessibility](#accessibility)
14. [Icons](#icons)
15. [File Locations](#file-locations)

---

## Color System

### Primary Colors - Navy Scale

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--navy-950` | `#0a1628` | `navy-950` | Darkest backgrounds, footer bottom bar |
| `--navy-900` | `#0f2240` | `navy-900` | Primary dark backgrounds, hero sections, footer main |
| `--navy-800` | `#1a365d` | `navy-800` | Primary brand color, heading text default |
| `--navy-700` | `#234681` | `navy-700` | Hero gradient endpoint, navigation hover (scrolled) |
| `--navy-600` | `#2d5aa0` | `navy-600` | Secondary text on dark backgrounds |
| `--navy-500` | `#3b6fb6` | `navy-500` | Mid-tone elements |
| `--navy-400` | `#5a8fd4` | `navy-400` | Decorative blur elements |
| `--navy-300` | `#89b4e8` | `navy-300` | Social icon backgrounds, tertiary text on dark |
| `--navy-200` | `#b8d4f3` | `navy-200` | Text on dark backgrounds, secondary borders |
| `--navy-100` | `#e3eefb` | `navy-100` | Card borders, dividers, dropdown borders |
| `--navy-50` | `#f0f6fd` | `navy-50` | Hover backgrounds, light section backgrounds |

### Secondary Colors - Gold Scale

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--gold-950` | `#422006` | `gold-950` | Accent foreground (darkest gold text) |
| `--gold-900` | `#5c3109` | `gold-900` | Deep gold text |
| `--gold-800` | `#8b5a1b` | `gold-800` | Gold text on light backgrounds |
| `--gold-700` | `#a67025` | `gold-700` | Button hover states, link hovers |
| `--gold-600` | `#c4883d` | `gold-600` | Icons, accent links, button gradient start |
| `--gold-500` | `#d4a574` | `gold-500` | **Primary accent** - buttons, focus rings, primary icons |
| `--gold-400` | `#e0bd94` | `gold-400` | Icons on dark backgrounds, badges, button gradient end |
| `--gold-300` | `#ebd5b8` | `gold-300` | Dividers, gradient endpoints |
| `--gold-200` | `#f5e8d8` | `gold-200` | Selection highlight, trust badge text |
| `--gold-100` | `#faf4ed` | `gold-100` | Light gold backgrounds |
| `--gold-50` | `#fdfbf8` | `gold-50` | Lightest gold backgrounds, outline button hover |

### Neutral - Cream Scale

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--cream-50` | `#fefdfb` | `cream-50` | Subtle section backgrounds |
| `--cream-100` | `#fcf9f4` | `cream-100` | Dropdown hovers, card backgrounds, white button hover |
| `--cream-200` | `#f8f2e8` | `cream-200` | Muted background |
| `--cream-300` | `#f0e6d6` | `cream-300` | Darker cream for contrast |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#1a365d` | Default text color |
| `--muted` | `#f8f2e8` | Muted/subdued backgrounds |
| `--muted-foreground` | `#4a5568` | Secondary text (WCAG AA compliant) |
| `--destructive` | `#dc2626` | Error states, destructive actions, sign out |
| `--border` | `#e3eefb` | Default border color |
| `--ring` | `#d4a574` | Focus ring color |

### Additional UI Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#22c55e` (`green-500`) | "New" badges |
| Purple | `#9333ea` (`purple-600`) | "Exclusive" badges |
| Blue | `#dbeafe` / `#1d4ed8` (`blue-100` / `blue-700`) | CMV status badges |
| Red | `#fef2f2` / `#fecaca` / `#dc2626` (`red-50` / `red-200` / `red-600`) | Errors, destructive actions |

---

## Typography

### Font Families

| Variable | Font Name | Fallback Stack | Usage |
|----------|-----------|----------------|-------|
| `--font-playfair` | Playfair Display | Georgia, serif | Headings, display text, logo |
| `--font-dm-sans` | DM Sans | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif | Body text, UI elements |

### CSS Implementation

```css
/* Heading font */
.font-heading {
  font-family: var(--font-playfair), Georgia, serif;
}

/* Body font */
.font-body {
  font-family: var(--font-dm-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Heading Sizes (Responsive with CSS clamp)

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| `h1` | `clamp(2.5rem, 5vw, 4rem)` | 700 | 1.2 | -0.02em |
| `h2` | `clamp(2rem, 4vw, 3rem)` | 600 | 1.25 | -0.01em |
| `h3` | `clamp(1.5rem, 3vw, 2rem)` | 600 | 1.3 | — |
| `h4` | `clamp(1.25rem, 2vw, 1.5rem)` | 600 | 1.35 | — |

### Body Text Sizes

| Size | Font Size | Line Height | Tailwind Class |
|------|-----------|-------------|----------------|
| Default | `1rem` (16px) | 1.75 | — |
| Large | `1.125rem` (18px) | 1.75 | `text-lg` |
| XL | `1.25rem` (20px) | 1.75 | `text-xl` |
| Small | `0.875rem` (14px) | relaxed | `text-sm` |
| XS | `0.75rem` (12px) | — | `text-xs` |

### Text Colors by Context

| Context | Color | Tailwind Class | Contrast Ratio |
|---------|-------|----------------|----------------|
| Headings (light bg) | `#0f2240` | `text-navy-900` | AAA on white |
| Primary body text | `#2d3748` | `text-navy-700` | 7:1 on white |
| Secondary body text | `#4a5568` | `text-navy-600` | 4.5:1 on white (WCAG AA) |
| Text on dark backgrounds | `#cbd5e0` | `text-navy-200` | 4.5:1 on navy-900 |
| Accent links | `#c4883d` | `text-gold-600` | — |
| Link hover | `#a67025` | `text-gold-700` | — |

---

## Buttons

### Base Button Class (`.btn`)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  border: none;
  min-height: 44px; /* WCAG touch target size */
  min-width: 44px;
}
```

### Button Variants

#### Primary Button (`.btn-primary`)

```css
.btn-primary {
  background: linear-gradient(135deg, var(--gold-500) 0%, var(--gold-600) 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgb(212 165 116 / 0.25);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--gold-600) 0%, var(--gold-700) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgb(212 165 116 / 0.35);
}
```

| Property | Default | Hover |
|----------|---------|-------|
| Background | `linear-gradient(135deg, #d4a574, #c4883d)` | `linear-gradient(135deg, #c4883d, #a67025)` |
| Text | `white` | `white` |
| Shadow | `0 4px 14px 0 rgb(212 165 116 / 0.25)` | `0 6px 20px 0 rgb(212 165 116 / 0.35)` |
| Transform | — | `translateY(-1px)` |

#### Secondary Button (`.btn-secondary`)

```css
.btn-secondary {
  background: transparent;
  color: var(--navy-800);
  border: 2px solid var(--navy-200);
}

.btn-secondary:hover {
  background: var(--navy-50);
  border-color: var(--navy-300);
}
```

| Property | Default | Hover |
|----------|---------|-------|
| Background | `transparent` | `#f0f6fd` (navy-50) |
| Text | `#1a365d` (navy-800) | `#1a365d` |
| Border | `2px solid #b8d4f3` (navy-200) | `2px solid #89b4e8` (navy-300) |

#### White Button (`.btn-white`)

```css
.btn-white {
  background: white;
  color: var(--navy-800);
  box-shadow: var(--shadow-md);
}

.btn-white:hover {
  background: var(--cream-100);
  transform: translateY(-1px);
}
```

| Property | Default | Hover |
|----------|---------|-------|
| Background | `white` | `#fcf9f4` (cream-100) |
| Text | `#1a365d` (navy-800) | `#1a365d` |
| Transform | — | `translateY(-1px)` |

#### Outline Gold Button (`.btn-outline-gold`)

```css
.btn-outline-gold {
  background: transparent;
  color: var(--gold-600);
  border: 2px solid var(--gold-400);
}

.btn-outline-gold:hover {
  background: var(--gold-50);
  border-color: var(--gold-500);
}
```

### Button Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| Default | `0.875rem 1.75rem` | `0.9375rem` | Standard buttons |
| Small | `0.625rem 1.25rem` | `0.875rem` | Header CTA |
| Large | `1rem 2rem` or `1.25rem 2.5rem` | `1rem` - `1.125rem` | Hero CTAs |

### Button Usage Examples

```tsx
// Primary CTA
<Link href="/browse-donors" className="btn btn-primary">
  Browse Donors
  <ArrowRight className="w-5 h-5" />
</Link>

// Secondary button
<Link href="/login" className="btn btn-secondary">
  Sign In
</Link>

// Large hero button
<Link href="/browse-donors" className="btn btn-primary text-lg px-10 py-5">
  Browse Donors Free for 7 Days
  <ArrowRight className="w-6 h-6" />
</Link>
```

---

## Cards

### Standard Card Base

```css
.card {
  background: white;
  border-radius: 1rem;          /* rounded-2xl = 16px */
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(26 54 93 / 0.1), 
              0 2px 4px -2px rgb(26 54 93 / 0.1);
}
```

### Card Hover Effect

```css
.card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgb(26 54 93 / 0.1), 
              0 8px 10px -6px rgb(26 54 93 / 0.1);
}
```

### Card Variants

#### Donor Card

| Property | Value |
|----------|-------|
| Border radius | `1rem` (rounded-2xl) |
| Header background | `linear-gradient(to-br, navy-100, navy-200)` |
| Header aspect ratio | `4/3` |
| Content padding | `1.5rem` (p-6) |
| Badge border radius | `9999px` (rounded-full) |
| Shadow | `shadow-md` → `shadow-xl` on hover |

```tsx
<div className="h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 card-hover">
  {/* Photo area */}
  <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-100 to-navy-200">
    {/* Badges positioned absolute */}
  </div>
  {/* Content */}
  <div className="p-6">
    {/* Card content */}
  </div>
</div>
```

#### FAQ Accordion Card

| Property | Value |
|----------|-------|
| Background | `white` |
| Border | `1px solid navy-100` |
| Border radius | `0.75rem` (rounded-xl) |
| Button padding | `1.5rem` (p-6) |
| Content padding | `0 1.5rem 1.5rem` (px-6 pb-6) |
| Hover background | `cream-50` |

```tsx
<div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
  <button className="w-full flex items-center justify-between p-6 text-left hover:bg-cream-50 transition-colors">
    <span className="font-medium text-navy-900">{question}</span>
    <ChevronDown className="w-5 h-5 text-gold-600" />
  </button>
  {/* Expandable content */}
</div>
```

#### Persona Pathway Card

| Property | Value |
|----------|-------|
| Header height | `8rem` (h-32) |
| Header background | Gradient (e.g., `from-navy-800 to-navy-900`) |
| Content padding | `1.25rem` (p-5) |
| Shadow | `shadow-lg` |
| Hover shadow | `shadow-2xl` |
| Transition | `duration-500` |

```tsx
<div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 card-hover">
  <div className="h-32 bg-gradient-to-br from-navy-800 to-navy-900 relative overflow-hidden">
    {/* Icon centered */}
  </div>
  <div className="p-5">
    {/* Title, description, link */}
  </div>
</div>
```

#### Feature Card (WhyXytex)

| Property | Value |
|----------|-------|
| Layout | Centered text |
| Icon container | `w-16 h-16 rounded-xl bg-navy-900` |
| Icon color | `gold-400` |
| Icon size | `w-8 h-8` |

---

## Form Inputs

### Text Input

```css
input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem; /* With left icon */
  border: 1px solid #b8d4f3; /* navy-200 */
  border-radius: 0.5rem;
  outline: none;
  font-size: 1rem;
}

input:focus {
  box-shadow: 0 0 0 2px #d4a574; /* ring-2 ring-gold-500 */
  border-color: #d4a574; /* border-gold-500 */
}
```

### Tailwind Implementation

```tsx
<input
  type="email"
  className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
  placeholder="you@example.com"
/>
```

### Form Labels

```css
label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #234681; /* navy-700 */
  margin-bottom: 0.5rem;
}
```

### Input with Icon

```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
  <input
    type="email"
    className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
    placeholder="you@example.com"
  />
</div>
```

### Error States

```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
  {errorMessage}
</div>
```

| Property | Value |
|----------|-------|
| Background | `red-50` (#fef2f2) |
| Border | `1px solid red-200` (#fecaca) |
| Text color | `red-700` (#b91c1c) |
| Border radius | `0.5rem` |
| Padding | `1rem` |

---

## Header

### Scroll Behavior

The header transitions between two states based on scroll position.

| State | Background | Text Color | Shadow |
|-------|------------|------------|--------|
| Default (top) | `navy-900/80` with `backdrop-blur-sm` | `white` | None |
| Scrolled (>20px) | `white/95` with `backdrop-blur-md` | `navy-700` | `shadow-lg` |

### CSS Implementation

```tsx
<header
  className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled
      ? "bg-white/95 backdrop-blur-md shadow-lg"
      : "bg-navy-900/80 backdrop-blur-sm"
  }`}
>
```

### Navigation Links

| State | Default Style | Hover Style |
|-------|---------------|-------------|
| Top of page | `text-white` | `text-gold-300 bg-white/10` |
| Scrolled | `text-navy-700` | `text-navy-900 bg-navy-50` |

```tsx
<Link
  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
    isScrolled
      ? "text-navy-700 hover:text-navy-900 hover:bg-navy-50"
      : "text-white hover:text-gold-300 hover:bg-white/10"
  }`}
>
```

### Dropdown Menu

| Property | Value |
|----------|-------|
| Background | `white` |
| Border | `1px solid navy-100` |
| Border radius | `0.75rem` (rounded-xl) |
| Shadow | `shadow-xl` |
| Width | `18rem` (w-72) |
| Item hover | `bg-cream-100` |
| Animation | Fade in/out with `y: 10px` movement |

### Logo

```tsx
<span className="text-2xl font-bold font-heading tracking-tight">
  Xytex
</span>
<span className="absolute -top-1 -right-12 text-[10px] font-medium text-gold-500 tracking-wider">
  SINCE 1975
</span>
```

---

## Footer

### Structure

| Section | Background |
|---------|------------|
| Trust badges bar | `navy-900` with `border-b border-navy-800` |
| Main content | `navy-900` |
| Medical disclaimer | `navy-950/50` with `border-t border-navy-800` |
| Bottom bar | `navy-900` with `border-t border-navy-800` |

### Typography

| Element | Style |
|---------|-------|
| Brand name | `text-3xl font-bold font-heading text-white` |
| Section title | `text-sm font-semibold text-gold-400 uppercase tracking-wider` |
| Links | `text-sm text-navy-200 hover:text-white` |
| Contact text | `text-sm text-white/80 hover:text-gold-400` |
| Legal links | `text-sm text-navy-400 hover:text-white` |

### Social Links

```tsx
<a className="p-2 rounded-lg bg-navy-800 text-navy-300 hover:bg-gold-600 hover:text-white transition-all">
  <Icon className="w-5 h-5" />
</a>
```

---

## Shadows

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgb(26 54 93 / 0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgb(26 54 93 / 0.1), 0 2px 4px -2px rgb(26 54 93 / 0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px -3px rgb(26 54 93 / 0.1), 0 4px 6px -4px rgb(26 54 93 / 0.1)` | Elevated cards |
| `--shadow-xl` | `0 20px 25px -5px rgb(26 54 93 / 0.1), 0 8px 10px -6px rgb(26 54 93 / 0.1)` | Card hover, dropdowns |
| `--shadow-gold` | `0 4px 14px 0 rgb(212 165 116 / 0.25)` | Primary buttons |

---

## Gradients

### Hero Gradient (`.bg-gradient-hero`)

```css
.bg-gradient-hero {
  background: linear-gradient(135deg, #0f2240 0%, #1a365d 50%, #234681 100%);
  /* navy-900 → navy-800 → navy-700 */
}
```

### Gold Gradient (`.bg-gradient-gold`)

```css
.bg-gradient-gold {
  background: linear-gradient(135deg, #d4a574 0%, #e0bd94 100%);
  /* gold-500 → gold-400 */
}
```

### Text Gradient (`.text-gradient`)

```css
.text-gradient {
  background: linear-gradient(135deg, #c4883d 0%, #e0bd94 100%);
  /* gold-600 → gold-400 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Subtle Background (`.bg-gradient-subtle`)

```css
.bg-gradient-subtle {
  background: linear-gradient(180deg, #fefdfb 0%, #fcf9f4 100%);
  /* cream-50 → cream-100 */
}
```

### Decorative Divider Gradient

```tsx
<div className="h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
```

---

## Spacing

### Container (`.container-custom`)

```css
.container-custom {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

@media (min-width: 768px) {
  .container-custom {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
```

### Section Padding (`.section-padding`)

| Breakpoint | Top/Bottom Padding |
|------------|-------------------|
| Mobile (<768px) | `5rem` (80px) |
| Tablet (≥768px) | `7rem` (112px) |
| Desktop (≥1024px) | `8rem` (128px) |

```css
.section-padding {
  padding-top: 5rem;
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .section-padding {
    padding-top: 7rem;
    padding-bottom: 7rem;
  }
}

@media (min-width: 1024px) {
  .section-padding {
    padding-top: 8rem;
    padding-bottom: 8rem;
  }
}
```

### Common Spacing Values

| Value | Pixels | Usage |
|-------|--------|-------|
| `gap-1` | 4px | Tight inline spacing |
| `gap-2` | 8px | Badge gaps, icon gaps |
| `gap-3` | 12px | Small component spacing |
| `gap-4` | 16px | Standard component spacing |
| `gap-6` | 24px | Section internal spacing |
| `gap-8` | 32px | Card grids |
| `gap-12` | 48px | Major section spacing |

---

## Badges

### Status Badges (Donor Cards)

| Type | Background | Text | Icon | Tailwind |
|------|------------|------|------|----------|
| New | `#22c55e` (green-500) | `white` | Sparkles | `bg-green-500 text-white` |
| Popular | `#d4a574` (gold-500) | `white` | Star | `bg-gold-500 text-white` |
| Exclusive | `#9333ea` (purple-600) | `white` | Crown | `bg-purple-600 text-white` |
| CMV- | `#dbeafe` (blue-100) | `#1d4ed8` (blue-700) | — | `bg-blue-100 text-blue-700` |

```tsx
// New badge
<span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
  <Sparkles className="w-3 h-3" />
  New
</span>

// CMV status
<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
  CMV-
</span>
```

### Trust Badge (`.trust-badge`)

```css
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 165, 116, 0.3);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #f5e8d8; /* gold-200 */
  backdrop-filter: blur(4px);
}
```

### Interest/Tag Badges

```tsx
<span className="px-2 py-0.5 bg-cream-100 text-navy-600 text-xs rounded-full">
  {interest}
</span>
```

### Donor ID Badge

```tsx
<span className="px-2.5 py-1 bg-navy-900/80 backdrop-blur-sm text-white text-xs font-mono rounded">
  {donorId}
</span>
```

---

## Animations

### Fade In Up (`.animate-fade-in-up`)

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-fill-mode: both;
}
```

### Staggered Animation Delays

```tsx
<div style={{ animationDelay: "0ms" }}>First element</div>
<div style={{ animationDelay: "100ms" }}>Second element</div>
<div style={{ animationDelay: "200ms" }}>Third element</div>
```

### Framer Motion Patterns

```tsx
// Fade in on scroll
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

### Transition Utilities

| Type | Value | Usage |
|------|-------|-------|
| Default | `transition-all 0.2s ease` | General transitions |
| Colors | `transition-colors 0.2s ease` | Color changes only |
| Transform | `transition-transform 0.3s ease` | Movements |
| Card hover | `transition: transform 0.3s ease, box-shadow 0.3s ease` | Card lift effect |
| Duration 300 | `duration-300` | Standard animations |
| Duration 500 | `duration-500` | Slower, more elegant |

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-fade-in-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## Accessibility

### Focus States

```css
*:focus-visible {
  outline: 3px solid #d4a574; /* gold-500 */
  outline-offset: 2px;
  border-radius: 2px;
}
```

### Touch Targets

- **Minimum size:** `44px × 44px` (WCAG 2.1 Level AA)
- Applied to all buttons via `.btn` class

### Skip to Content Link

```css
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-to-content:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #0f2240; /* navy-900 */
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
}
```

### ARIA Patterns

```tsx
// Landmarks
<header role="banner">
<nav aria-label="Main navigation">
<main id="main-content" tabIndex={-1}>
<footer>

// Interactive elements
<button aria-expanded="true" aria-controls="menu-id">
<div role="menu" aria-label="Submenu">
<a role="menuitem">

// Icons
<Icon aria-hidden="true" />
<span className="sr-only">Screen reader text</span>
```

---

## Icons

### Library

**Lucide React** - Consistent, customizable icon library

### Installation

```bash
npm install lucide-react
```

### Usage

```tsx
import { ArrowRight, Heart, Shield } from "lucide-react";

<ArrowRight className="w-5 h-5" />
```

### Icon Sizes

| Size | Class | Pixels | Usage |
|------|-------|--------|-------|
| XS | `w-3 h-3` | 12px | Badge icons |
| Small | `w-4 h-4` | 16px | Inline icons, lists |
| Default | `w-5 h-5` | 20px | Buttons, navigation |
| Medium | `w-6 h-6` | 24px | Hero CTAs |
| Large | `w-8 h-8` | 32px | Feature icons |
| XL | `w-10 h-10` | 40px | Large feature icons |

### Common Icons by Category

**Navigation:**
- `Menu`, `X` - Mobile menu toggle
- `ChevronDown` - Dropdowns, accordions
- `ArrowRight` - CTAs, links

**Features:**
- `Heart` - Favorites, couples
- `Users` - LGBTQ+, groups
- `User` - Single users, account
- `Shield` - Security, trust
- `Clock` - Time, history
- `Dna` - Genetic testing
- `Camera` - Photos
- `UserCheck` - Identity verified

**Donor Cards:**
- `Star` - Popular
- `Sparkles` - New
- `Crown` - Exclusive
- `Ruler` - Height
- `Eye` - Eye color
- `GraduationCap` - Education

**Contact:**
- `Phone`, `Mail`, `MapPin`

**Social:**
- `Facebook`, `Instagram`, `Linkedin`, `Youtube`

**Actions:**
- `Loader2` - Loading spinner (with `animate-spin`)
- `LogOut` - Sign out

---

## File Locations

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS variables, base styles, utility classes |
| `app/layout.tsx` | Font imports (Google Fonts), root layout structure |
| `components/layout/Header.tsx` | Sticky navigation header |
| `components/layout/Footer.tsx` | Site footer |
| `components/shared/PageHero.tsx` | Reusable hero section |
| `components/shared/FAQAccordion.tsx` | Expandable Q&A component |
| `components/donors/DonorCard.tsx` | Donor profile card |
| `components/donors/DonorFilters.tsx` | Filter sidebar |
| `components/home/HeroSection.tsx` | Homepage hero |
| `components/home/PersonaPathways.tsx` | Getting started pathways |
| `components/home/WhyXytex.tsx` | Feature cards |
| `components/auth/LoginForm.tsx` | Login form with inputs |

---

## Quick Reference

### Color Swatches

```
Navy Scale (Primary):
#0a1628 | #0f2240 | #1a365d | #234681 | #2d5aa0 | #3b6fb6 | #5a8fd4 | #89b4e8 | #b8d4f3 | #e3eefb | #f0f6fd

Gold Scale (Secondary):
#422006 | #5c3109 | #8b5a1b | #a67025 | #c4883d | #d4a574 | #e0bd94 | #ebd5b8 | #f5e8d8 | #faf4ed | #fdfbf8

Cream Scale (Neutral):
#fefdfb | #fcf9f4 | #f8f2e8 | #f0e6d6
```

### Key Brand Colors

- **Primary Blue:** `#1a365d` (navy-800)
- **Primary Gold:** `#d4a574` (gold-500)
- **Background:** `#ffffff`
- **Dark Background:** `#0f2240` (navy-900)

### Font Stack

```css
/* Headings */
font-family: 'Playfair Display', Georgia, serif;

/* Body */
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
