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
- **Usage Limits Enforcement:** API enforces plan-based limits for job creation, candidate creation, and specific AI actions (resume analysis, interview questions, reference emails, onboarding plans).

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