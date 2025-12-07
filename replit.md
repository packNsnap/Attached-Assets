# HR Nexus - AI-Powered HR Workflow Automation

## Overview

HR Nexus is a modular HR web application that provides AI-powered decision support for hiring and HR workflows. The platform helps employers manage the complete hiring lifecycle without handling payroll, background checks, or consumer reporting. It's designed as a layer that sits alongside existing HRIS/payroll systems.

The application features 10 core modules accessible through a sidebar navigation:
1. Job Description & Salary Generation
2. Resume Logic Analysis
3. Skills Test Builder & Scoring
4. Interview Assistant
5. Hiring Pipeline Management
6. Reference Check Orchestration
7. HR Policies & Documentation
8. Employee Onboarding
9. Performance Management
10. Analytics & Insights

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **Styling:** Tailwind CSS v4 with custom design tokens
- **UI Components:** Shadcn/ui (Radix UI primitives with custom styling)

**Design System:**
- Custom theme system supporting light/dark modes via CSS variables
- "New York" variant of Shadcn components
- Responsive layouts using container queries and Tailwind breakpoints
- Icon library: Lucide React

**Application Structure:**
- Layout wrapper with persistent sidebar navigation
- Module-based page organization under `client/src/pages/modules/`
- Shared components in `client/src/components/`
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for HTTP server
- **Database:** PostgreSQL via Drizzle ORM
- **Session Management:** Express sessions (configured for PostgreSQL via connect-pg-simple)

**API Design:**
- RESTful endpoints under `/api` prefix
- Standard CRUD operations for resources (jobs, candidates, interview notes)
- Zod schema validation on all incoming requests
- Error handling with appropriate HTTP status codes

**Data Layer:**
- Storage abstraction interface (`IStorage`) for database operations
- Drizzle ORM with type-safe query building
- Schema migrations tracked in `/migrations` directory
- Database connection pooling via node-postgres

### Database Schema

**Core Tables:**
1. **users** - Authentication and user management
   - id (UUID primary key)
   - username (unique)
   - password (hashed)

2. **jobs** - Job postings and descriptions
   - id, title, level, location
   - skills (array), description
   - salary range (min/max)
   - status, created timestamp

3. **candidates** - Candidate applications
   - id, name, email, role
   - stage (pipeline status)
   - tags (array), applied date
   - jobId (foreign key reference)

4. **interviewNotes** - Interview feedback
   - id, candidateId (foreign key)
   - interviewer, notes, score
   - timestamp

**Schema Design Principles:**
- UUID primary keys for all tables
- Array columns for multi-value fields (skills, tags)
- Timestamps for audit trails
- Soft status fields rather than hard deletes

### Development vs Production

**Development Environment:**
- Vite dev server with HMR on port 5000
- Separate client and server processes
- Source maps enabled for debugging
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)

**Production Build:**
- Client: Vite builds static assets to `dist/public`
- Server: esbuild bundles server code to single CJS file in `dist/`
- Critical dependencies bundled to reduce cold start time
- Static file serving from Express in production

**Build Strategy:**
- Allowlist of server dependencies to bundle (database, AI SDKs, etc.)
- External dependencies excluded to reduce bundle size
- Build script coordinates both client and server compilation

### Type Safety

**Shared Types:**
- Database schema types exported from Drizzle
- Zod schemas for validation and type inference
- Shared schema file (`shared/schema.ts`) consumed by both client and server
- Type-safe API contracts via shared insert/select schemas

### Development Workflow

**Scripts:**
- `dev` - Start backend server with hot reload (tsx watch)
- `dev:client` - Start Vite dev server
- `build` - Production build (client + server)
- `start` - Run production build
- `db:push` - Push schema changes to database

**File Organization:**
- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared types and schemas
- `/migrations` - Database migration files

## External Dependencies

### UI Component Libraries
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Tailwind CSS** - Utility-first styling framework
- **Lucide React** - Icon library

### Backend Services
- **PostgreSQL** - Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle ORM** - Type-safe database queries and migrations

### Development Tools
- **Vite** - Frontend build tool and dev server
- **TypeScript** - Static type checking across entire codebase
- **ESBuild** - Fast server-side bundling for production
- **Replit Plugins** - Development experience enhancements (cartographer, dev banner, error overlay)

### Form Handling
- **React Hook Form** - Form state management
- **Zod** - Schema validation with `@hookform/resolvers` integration
- **Drizzle-Zod** - Generate Zod schemas from Drizzle tables

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **clsx** + **tailwind-merge** - Conditional className composition
- **class-variance-authority** - Component variant management
- **nanoid** - Unique ID generation

### Session Management
- **express-session** - Session middleware
- **connect-pg-simple** - PostgreSQL session store

**Note:** The application currently has placeholders for AI integration (job description generation, resume analysis, etc.). These features will require integration with AI services like OpenAI or Google's Generative AI, which are listed as dependencies but not yet implemented.