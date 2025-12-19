# Resume Logik - AI-Powered HR Workflow Automation

## Overview
Resume Logik is a modular HR web application providing AI-powered decision support for hiring and HR workflows. It helps employers manage the complete hiring lifecycle as a layer alongside existing HRIS/payroll systems, without handling payroll or background checks. The platform features 10 core modules: Job Description & Salary Generation, Resume Logic Analysis, Skills Test Builder & Scoring, Interview Assistant, Hiring Pipeline Management, Reference Check Orchestration, HR Policies & Documentation, Employee Onboarding, Performance Management, and Analytics & Insights. It aims to offer a comprehensive, enterprise-safe solution for optimizing HR processes with a focus on evaluating candidate suitability rather than just ranking resumes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack:** React 18 (TypeScript), Vite, Wouter, TanStack Query, Tailwind CSS v4, Shadcn/ui (Radix UI primitives).
- **Design System:** Custom theme (light/dark mode), "New York" Shadcn variant, responsive layouts, Lucide React icons.
- **Application Structure:** Layout wrapper with persistent sidebar, module-based page organization, shared components, path aliases.

### Backend
- **Technology Stack:** Node.js (TypeScript), Express.js, PostgreSQL via Drizzle ORM, Express sessions with `connect-pg-simple`.
- **API Design:** RESTful endpoints (`/api`), Zod schema validation, comprehensive error handling.
- **Data Layer:** `IStorage` abstraction, Drizzle ORM for type-safe queries, schema migrations.

### Database Schema
- **Core Tables:** `users`, `jobs`, `candidates`, `interviewNotes`, `onboarding_plans`, and Stripe-related tables (`stripe.*`, `subscriptions`).
- **Design Principles:** UUID primary keys, array columns for multi-value fields, timestamps, soft status fields.

### Development & Production
- **Development:** Vite dev server, separate client/server processes, source maps, Replit-specific plugins.
- **Production:** Vite for static assets, esbuild for server code bundling, static file serving via Express.
- **Type Safety:** Shared types and Zod schemas (via `shared/schema.ts`) for consistent type inference across client and server.

### Key Features & Modules
- **AI-Powered HR Policies:** Generates policies with compliance notes and disclaimers using authoritative references.
- **Onboarding Module:** AI-generated onboarding plans with task tracking and progress bars.
- **Admin Panel:** Manages users, grants/revokes free access, accessible only to `isAdmin` users.
- **Bulk Resume Upload (Pro+):** Allows uploading multiple resumes, auto-creates candidate profiles, extracts data, and associates with jobs.
- **Usage Limits Enforcement:** API enforces plan-based limits with monthly tracking for resume scans, job descriptions, skills tests, and interview generations.

### Pricing Tiers & Limits (5-Tier System)
The app uses a 5-tier pricing system defined in `shared/schema.ts` via `PLAN_LIMITS`. The system uses **candidate-based limits** with **per-candidate resume scans** instead of monthly scan quotas:
- **Free ($0):** 3 candidates, 1 scan/candidate, 5 job desc/skills tests/interview sets/PDF exports per month
- **Basic ($29/mo):** 25 candidates, 2 scans/candidate, 25 job desc, 100 skills tests, 100 interview sets, 50 PDF exports, bulk upload (5)
- **Growth ($59/mo):** 75 candidates, 2 scans/candidate, 50 job desc, 300 skills tests/interview sets, 200 PDF exports, bulk upload (10), advanced AI, analytics
- **Pro ($149/mo):** 200 candidates, 2 scans/candidate, 150 job desc, 1200 skills tests/interview sets, 750 PDF exports, bulk upload (25), team management
- **Enterprise (Custom):** 500 candidates, 3000 everything, bulk upload (100), API access

### Usage Tracking System
- **Monthly Usage Table:** `monthly_usage` tracks per-user consumption by period (YYYY-MM) for job descriptions, skills tests, interview sets, PDF exports, and advanced AI usage
- **Per-Candidate Tracking:** Resume scans are tracked per-candidate via `ai_action_usage` table (not monthly totals)
- **Server-Side Enforcement:** `planUtils.ts` provides `checkUsageLimit`, `assertWithinLimit`, `hasFeature` helpers
- **Frontend Hook:** `usePlanFeatures.ts` provides plan checking, usage display, and feature gating for UI
- **Usage API:** `/api/usage-summary` returns current plan + all usage metrics for the period

## External Dependencies

### UI Component Libraries
- Radix UI, Tailwind CSS, Lucide React

### Backend Services
- PostgreSQL (via `DATABASE_URL`), Drizzle ORM

### Development Tools
- Vite, TypeScript, ESBuild, Replit Plugins

### Form Handling
- React Hook Form, Zod, Drizzle-Zod

### Utility Libraries
- date-fns, clsx, tailwind-merge, class-variance-authority, nanoid

### Session Management
- express-session, connect-pg-simple

### Payment Processing
- Stripe (for subscription management, webhook syncing via `stripe-replit-sync`)