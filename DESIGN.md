# AI Atelier Design System

## 1. Atmosphere & Identity

AI Atelier feels like a personal seaside archive: warm, private, slightly cinematic, and built around notes that are revisited after work. The signature is a rotated train image used as an editorial backdrop, with readable cream surfaces floating over it.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/page | --bg | #f1eadb | n/a | Site background and translucent header |
| Surface/raised | --bg-raised | #fffaf0 | n/a | Section and footer surfaces |
| Surface/card | --card | #fffaf0 | n/a | Solid cards |
| Surface/card-soft | --card-soft | rgba(255, 250, 240, 0.88) | n/a | Glass cards over hero image |
| Text/primary | --text | #17201d | n/a | Headlines and body |
| Text/muted | --muted | #5e6762 | n/a | Secondary text |
| Border/default | --line | rgba(23, 32, 29, 0.15) | n/a | Dividers and outlines |
| Accent/primary | --accent | #0f8f72 | n/a | Primary actions and focus accents |
| Accent/cool | --accent-cool | #168eb6 | n/a | Secondary badges |
| Accent/warm | --sun | #f5c84b | n/a | Warm highlight only |

### Rules

- Use warm cream surfaces for readability over photography.
- Use green for primary action and blue only as a small metadata accent.
- Keep photography visible, but never let text sit directly on busy image detail without a tonal overlay.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 9.5rem / 6.5rem / 4.4rem | 900 | 0.82-0.9 | 0 | Homepage title |
| H1 | 4rem / 3.2rem / 2.6rem | 900 | 0.95 | 0 | Section title |
| H2 | 2rem | 900 | 1.08 | 0 | Feature card title |
| Body/lg | 1.1rem | 700 | 1.85 | 0 | Hero lede |
| Body | 1rem | 700 | 1.7 | 0 | Main copy |
| Body/sm | 0.95rem | 700 | 1.45 | 0 | Card copy |
| Caption | 0.74rem | 900 | 1.3 | 0.18em | Eyebrows and labels |

### Font Stack

- Primary: Pretendard, 'Noto Sans KR', system-ui, sans-serif
- Display: 'SUIT Local', Pretendard, 'Noto Sans KR', sans-serif
- Mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace

### Rules

- Korean copy uses `word-break: keep-all` and comfortable line height.
- Display text can be oversized only in the homepage hero.
- Use breakpoint-based type sizes rather than viewport-width scaling.
- Small uppercase labels are reserved for navigation, metadata, and room labels.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-2 | 8px | Tight inline groups |
| --space-3 | 12px | Compact card gaps |
| --space-4 | 16px | Card padding |
| --space-6 | 24px | Medium gaps |
| --space-8 | 32px | Major content gaps |
| --space-12 | 48px | Grid column gaps |
| --space-16 | 64px | Section padding |
| --space-20 | 80px | Hero bottom rhythm |

### Grid

- Max content width: 86rem.
- Main shell: `width: min(100% - 3rem, 86rem)`.
- Homepage hero: asymmetric two-column grid, collapsing to one column below 980px.
- Breakpoints: 980px for homepage stacking, 720px for global header/footer, 620px for compact hero type.

### Rules

- Cards may overlap photography, but content must remain in the shell.
- Maintain a hint of the next section below the hero on common desktop heights.

## 5. Components

### Header Navigation

- **Structure**: brand link, primary nav, external action area.
- **Variants**: active page pill, external GitHub CTA.
- **Spacing**: compact 8-12px gaps.
- **States**: hover background, focus outline, active page border.
- **Accessibility**: nav landmark and `aria-current` for local pages.
- **Motion**: 160ms color/background transitions.

### Hero Cards

- **Structure**: soft cream surface, label, title/body, optional metadata row.
- **Variants**: quick room card, mood/time card.
- **Spacing**: 16-24px internal padding.
- **States**: links lift on hover, cards keep readable contrast.
- **Accessibility**: meaningful link text and semantic aside for the mood card.
- **Motion**: entry rise animation, disabled for reduced motion.

### Admin CMS Surface

- **Scope**: `/admin/` is an owner-only operational surface and is not linked from public navigation.
- **System**: use Sveltia CMS's maintained interface instead of recreating editor, form, and asset-library primitives.
- **Branding**: keep the site favicon and Korean labels; do not override the CMS component tokens with ad-hoc styles.
- **Korean copy**: preserve whole Korean words in editor text areas instead of the CMS default `break-all` behavior.
- **Accessibility**: preserve the CMS keyboard, focus, validation, loading, empty, and error states.
- **Indexing**: keep the route out of search results with `noindex`, `nofollow`, and `noarchive`.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 160-180ms | ease | Header and link color changes |
| Standard | 220ms | ease | Button lift and card hover |
| Emphasis | 620ms | ease | Homepage reveal animation |

### Rules

- Animate only `transform`, `opacity`, `color`, `background`, `border-color`, and `box-shadow`.
- Every interactive element needs hover and focus states.
- Respect `prefers-reduced-motion`.

## 7. Depth & Surface

### Strategy

Mixed, with restrained shadows over photography and borders for navigation.

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| Soft shadow | --shadow | 0 18px 46px rgba(29, 51, 46, 0.12) | Hero cards |
| Default border | --line | rgba(23, 32, 29, 0.15) | Pills, cards, dividers |

Hero depth comes from image, overlay, and soft translucent surfaces rather than heavy borders.
