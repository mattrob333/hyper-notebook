# The Hyper-Interactive Notebook

## Overview

The Hyper-Interactive Notebook is an agentic workspace for research, analysis, and workflow execution. It transforms passive AI interactions into active, agent-driven creation through a three-panel interface inspired by Google NotebookLM. The application integrates AI chat, source management, and workflow automation with a custom A2UI (Agent-to-User Interface) rendering system that allows AI agents to generate interactive UI components dynamically.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 19 with Vite for development and bundling. Uses TypeScript in strict mode throughout.

**Routing**: Wouter for lightweight client-side routing.

**State Management**: TanStack React Query for server state. Local component state with React hooks for UI state.

**UI Component System**: Shadcn/ui with Radix primitives. Components located in `client/src/components/ui/`. Uses the "new-york" style variant with neutral base colors.

**Styling Approach**: Tailwind CSS with CSS custom properties for theming. Dark mode support via class-based toggling. Design follows a "floating card" architecture with depth-based visual hierarchy rather than border-based separation.

**Layout Structure**: Three-panel responsive layout:
- Left panel: Sources management (fixed 280px)
- Center panel: Chat interface (flexible width)
- Right panel: Studio with workflows/reports/tools (fixed 320px)

**A2UI Rendering System**: Custom component renderer at `client/src/components/a2ui/A2UIRenderer.tsx` that interprets JSON component definitions and renders them as React components with Framer Motion animations.

**Visualization**: React Flow (@xyflow/react) for mindmap and workflow visualizations.

### Backend Architecture

**Runtime**: Node.js with Express.js server.

**API Design**: RESTful endpoints prefixed with `/api`. Server routes registered in `server/routes.ts`.

**Development Server**: Vite middleware integration for HMR during development. Production serves static files from `dist/public`.

### Data Layer

**ORM**: Drizzle ORM with PostgreSQL dialect. Schema defined in `shared/schema.ts`.

**Schema Location**: Database schema uses Drizzle's pgTable definitions with Zod validation via drizzle-zod.

**Storage Abstraction**: Interface-based storage pattern in `server/storage.ts`. Currently implements in-memory storage (MemStorage) with PostgreSQL-ready schema.

**Migrations**: Drizzle Kit manages migrations, output to `./migrations` directory.

### Key Design Patterns

**Shared Types**: TypeScript types shared between client and server via `shared/` directory. Path alias `@shared/*` configured.

**Component Examples**: Example implementations in `client/src/components/examples/` demonstrate component usage patterns.

**Panel Components**: Main UI panels in `client/src/components/panels/` handle sources, chat, and studio functionality.

**Studio Tools**: Specialized tools in `client/src/components/studio/` for workflows, email building, browser automation, and AI context file generation.

## External Dependencies

**Database**: PostgreSQL (configured via DATABASE_URL environment variable). Drizzle ORM handles all database operations.

**UI Libraries**: 
- Radix UI primitives for accessible components
- Framer Motion for animations
- React Flow for node-based visualizations
- Embla Carousel for carousels
- CMDK for command palette
- Vaul for drawer components

**Authentication**: Passport.js with passport-local strategy. Session management via express-session with connect-pg-simple for PostgreSQL session storage.

**AI Integration**: OpenAI SDK and Google Generative AI SDK available as dependencies.

**Browser Automation**: Hyperbrowser SDK planned for web scraping and automation workflows.

**Build Tools**: 
- Vite for frontend bundling
- esbuild for server bundling
- TSX for TypeScript execution during development

**Replit-Specific**: Vite plugins for Replit integration including runtime error overlay, cartographer, and dev banner.