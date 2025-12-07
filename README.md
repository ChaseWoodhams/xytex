# Xytex Website

Modern e-commerce style website for Xytex sperm bank, built with Next.js 16, TypeScript, Tailwind CSS 4, and Supabase.


## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel

## Prerequisites

- Node.js 18.17.0 or higher
- npm, yarn, pnpm, or bun
- Supabase account (for database and authentication)
- Vercel account (for deployment)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Xytex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get these values from your Supabase project dashboard: **Settings > API**

### 4. Set up Supabase database

Follow the instructions in [`SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) to:
- Run database migrations
- Migrate donor data
- Configure authentication

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Migrate donor data to Supabase

## Deploy on Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure environment variables**
   - In the Vercel project settings, go to **Settings > Environment Variables**
   - Add the following variables:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
     - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)
   - Apply to all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## Post-Deployment Checklist

After deploying to Vercel, verify:

- [ ] Site loads without errors
- [ ] Authentication works (sign up/login)
- [ ] Donor browsing works
- [ ] API routes respond correctly
- [ ] Environment variables are set correctly
- [ ] Supabase connection is working
- [ ] Images and static assets load properly

## Project Structure

```
xytex/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                   # Utility functions and Supabase clients
├── data/                  # Mock data files
├── docs/                  # Documentation files
├── public/                # Static assets
├── supabase/              # Database migrations
└── scripts/               # Utility scripts
```

## Documentation

All documentation is located in the [`docs/`](./docs/) directory:

- [`docs/AGENTS.md`](./docs/AGENTS.md) - Detailed project documentation for AI agents
- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) - Supabase setup instructions
- [`docs/ADMIN_CRM_SETUP.md`](./docs/ADMIN_CRM_SETUP.md) - Admin CRM setup guide
- [`docs/STYLE_GUIDE.md`](./docs/STYLE_GUIDE.md) - Comprehensive design system and style guide

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
