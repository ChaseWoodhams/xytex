# Xytex Website - Agent Documentation

## Project Overview
Modern e-commerce style website for Xytex sperm bank, built with Next.js 16, TypeScript, and Tailwind CSS.

**Created:** December 2025  
**Status:** MVP Complete

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Fonts:** Playfair Display (headings), DM Sans (body)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Data:** Static JSON mock data

---

## Design System

### Color Palette
- **Primary (Navy):** `#1a365d` (navy-800) - Dark blue tones
- **Secondary (Gold):** `#d4a574` (gold-500) - Warm gold accents
- **Neutrals:** Cream and white backgrounds

### Typography
- Headings: Playfair Display (serif, elegant)
- Body: DM Sans (clean sans-serif)

### Design Philosophy
- Premium & Elegant aesthetic
- Generous whitespace
- Subtle gold accents on dark blue backgrounds
- Card-based layouts with soft shadows
- Smooth animations and micro-interactions

---

## Project Structure

```
xytex/
├── app/
│   ├── layout.tsx              # Root layout with Header/Footer
│   ├── page.tsx                # Homepage
│   ├── about/page.tsx          # About page with timeline
│   ├── at-home-insemination/   # At-home guide page
│   ├── browse-donors/          # Donor browsing with filters
│   ├── lgbtq-family-building/  # LGBTQ+ persona page
│   ├── pricing/                # Pricing page
│   └── single-mother-by-choice/# SMBC persona page
├── components/
│   ├── donors/                 # DonorCard, DonorFilters
│   ├── home/                   # Homepage sections
│   ├── layout/                 # Header, Footer
│   └── shared/                 # FAQAccordion, PageHero
├── data/
│   └── mock-donors.json        # 12 mock donor profiles
├── lib/
│   └── utils.ts                # Utility functions
└── public/
    └── (assets)
```

---

## Pages Implemented

### 1. Homepage (`/`)
- Hero section with animated decorative cards
- Trust bar (FDA Registered, 50 Years, etc.)
- Persona pathway cards (LGBTQ+, SMBC, Couples)
- Why Xytex differentiators (6 feature cards)
- How It Works (4-step process)
- Featured Donors carousel
- Testimonials section
- Final CTA with stats

### 2. LGBTQ+ Family Building (`/lgbtq-family-building/`)
- Inclusive hero messaging
- Pathway options (Lesbian Couples, Gay Couples)
- Why LGBTQ+ families choose Xytex
- Legal considerations section
- Success stories/testimonials
- Getting started steps
- FAQ accordion

### 3. Single Mother by Choice (`/single-mother-by-choice/`)
- Empowering hero with timeline
- "Is This Right For Me?" section
- Donor selection guidance for SMBCs
- Visual timeline infographic
- Sibling planning section
- Community resources
- FAQ accordion

### 4. At-Home Insemination (`/at-home-insemination/`)
- Pros/cons comparison
- Vial types explained (ICI, IUI, ART)
- Step-by-step process guide (6 steps)
- Shipment contents section
- Cost breakdown
- FAQ accordion

### 5. Browse Donors (`/browse-donors/`)
- Search functionality
- Filter sidebar (ethnicity, hair, eyes, height, CMV, availability)
- Donor card grid with badges
- Sort options (newest, popular, height, age)
- Grid/list view toggle
- 12 mock donor profiles

### 6. Pricing (`/pricing/`)
- Vial pricing cards (ICI, IUI, ART)
- What's included section
- Additional costs table
- Multi-vial benefits
- Guarantees section
- Financing information

### 7. About (`/about/`)
- 50-year history timeline
- Stats section
- Values section
- Accreditations & certifications
- Team section
- Locations with contact info

---

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Header | `components/layout/` | Sticky nav with dropdown, mobile menu |
| Footer | `components/layout/` | Links, contact, social, trust badges |
| PageHero | `components/shared/` | Reusable hero section |
| FAQAccordion | `components/shared/` | Expandable Q&A |
| DonorCard | `components/donors/` | Donor profile card |
| DonorFilters | `components/donors/` | Filter sidebar + mobile drawer |
| HeroSection | `components/home/` | Homepage hero |
| PersonaPathways | `components/home/` | LGBTQ+/SMBC/Couples cards |
| WhyXytex | `components/home/` | 6 differentiator cards |
| HowItWorks | `components/home/` | 4-step process |
| FeaturedDonors | `components/home/` | Donor card grid |
| Testimonials | `components/home/` | Carousel with quotes |
| CTASection | `components/home/` | Final call-to-action |

---

## Mock Data

12 mock donor profiles in `data/mock-donors.json` with:
- Demographics (age, ethnicity, height, weight)
- Physical traits (hair color, eye color)
- Education and occupation
- CMV status and blood type
- Badges (isNew, isPopular, isExclusive)
- Interests and personality traits

---

## Commands

```bash
npm run dev     # Start development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

## Git & GitHub Operations

**IMPORTANT:** When the user requests to push to the repository or needs any GitHub-related information, **ALWAYS use the GitHub MCP tools** instead of terminal git commands.

### GitHub MCP Tools Available:
- Use `mcp_user-github_push_files` to push multiple files in a single commit
- Use `mcp_user-github_create_or_update_file` for individual file operations
- Use `mcp_user-github_get_file_contents` to read files from the repository
- Use `mcp_user-github_list_commits` to view commit history
- Use `mcp_user-github_get_me` to get repository owner information
- Use other GitHub MCP tools as needed for repository operations

### When to Use GitHub MCP:
- **Pushing changes to GitHub** - Use `mcp_user-github_push_files` with all modified files
- **Checking repository status** - Use `mcp_user-github_list_commits` or `mcp_user-github_get_file_contents`
- **Creating or updating files** - Use `mcp_user-github_create_or_update_file`
- **Any GitHub-related queries** - Prefer MCP tools over terminal git commands

### Example Workflow:
1. Read local files that need to be pushed
2. Use `mcp_user-github_push_files` with all files and a detailed commit message
3. Verify the push was successful using `mcp_user-github_list_commits`

**Note:** The GitHub MCP tools provide better reliability and visibility compared to terminal git commands, especially for push operations.

---

## Future Enhancements (from CRO Plan)

### Phase 2 (Medium-term)
- [ ] Donor matching quiz
- [ ] Cost calculator tool
- [ ] Live chat implementation
- [ ] Email capture flows

### Phase 3 (Long-term)
- [ ] Face-matching technology
- [ ] Pregnancy pledge program
- [ ] Comprehensive resource center
- [ ] A/B testing infrastructure
- [ ] Backend integration (Supabase or API)

---

## Notes

- All pages use Framer Motion for scroll-triggered animations
- Header becomes solid on scroll with backdrop blur
- Mobile-responsive with dedicated mobile navigation
- Custom Tailwind theme with navy and gold color scales
- Premium typography with Playfair Display for headings
