# Design Guidelines: The Hyper-Interactive Notebook

## Design Approach: Productivity-First System Design

This application follows a **Design System Approach** inspired by modern productivity tools (Linear, Notion, Cursor) with emphasis on information density, clarity, and functional efficiency. The interface prioritizes workspace optimization over marketing aesthetics.

## Core Design Principles

1. **Information Density Without Clutter**: Three-panel layout maximizes screen real estate while maintaining breathing room
2. **Visual Hierarchy for Functionality**: Typography and spacing guide users through complex workflows
3. **Purposeful Motion**: Minimal, functional animations only where they enhance understanding (A2UI component rendering, panel transitions)
4. **Component Consistency**: Shadcn/ui foundation ensures predictable, accessible interactions

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, and 8 for consistent rhythm
- Micro spacing (gaps, borders): 2, 3
- Component padding: 4, 6
- Section spacing: 8, 12
- Panel margins: 6, 8

**Three-Panel Architecture**:
- **SourcesPanel (Left)**: Fixed width 280px (w-70), collapsible on mobile
- **ChatPanel (Center)**: Flexible width (flex-1), minimum 480px
- **StudioPanel (Right)**: Fixed width 320px (w-80), tabs for Workflow/Reports/Email

**Responsive Behavior**:
- Desktop (1280px+): All three panels visible
- Tablet (768px-1279px): SourcesPanel collapses to drawer, Chat + Studio visible
- Mobile (<768px): Single panel view with bottom navigation

## Typography System

**Font Stack**:
- **Primary**: Inter (Google Fonts) - UI elements, body text
- **Code/Technical**: JetBrains Mono - workflow steps, JSON previews
- **Headers**: Inter with tighter tracking

**Type Scale**:
- Display (Panel headers): text-2xl (24px), font-semibold
- Section headers: text-lg (18px), font-medium
- Body text: text-sm (14px), font-normal
- Captions/metadata: text-xs (12px), font-normal
- Code blocks: text-sm, font-mono

**Line Height**: Tight for headers (leading-tight), relaxed for body (leading-relaxed)

## Component Library

### Navigation & Structure
- **Top Navbar**: h-14, border-b, contains logo, global actions, user menu
- **Panel Headers**: Sticky positioning, h-12, border-b, with action buttons aligned right
- **Tab Navigation** (StudioPanel): Horizontal tabs with active state indicator (border-b-2)

### SourcesPanel Components
- **Source Cards**: Compact list items (h-16), icon + title + metadata, hover state reveals actions
- **Add Source Button**: Prominent, full-width at panel top
- **Source Type Icons**: URL (globe), PDF (document), Text (file-text) using Heroicons

### ChatPanel Components
- **Message Bubbles**: 
  - User messages: Right-aligned, max-w-2xl
  - AI responses: Left-aligned, full-width for A2UI components
  - Spacing between messages: 6
- **A2UI Rendered Components**: Full-width container with subtle border, rounded-lg, integrated seamlessly into chat flow
- **Input Area**: Fixed bottom, h-20, border-t, with send button and attachment options

### StudioPanel Components
- **Workflow Cards**: Each workflow as expandable accordion, showing steps on expand
- **Workflow Steps**: Numbered list, icon + action type + parameters preview
- **Action Buttons**: Primary (create/save), secondary (edit/delete), positioned consistently

### Interactive Mindmap (React Flow)
- **Canvas**: Full ChatPanel width when active, min-h-[600px]
- **Nodes**: Rounded rectangles, clear labels, connection points visible on hover
- **Edges**: Smooth bezier curves, directional arrows
- **Controls**: Floating control panel (zoom, fit view) in bottom-right

### A2UI Component Catalog
Pre-approved components with consistent styling:
- **Card**: border, rounded-lg, p-4, shadow-sm, with header/body/footer sections
- **Form**: Labeled inputs with consistent spacing (gap-4), validation states (border colors)
- **Map**: Full-width container, aspect-video, border, rounded-lg for embedded maps
- **Data Tables**: Striped rows, sticky header, sortable columns
- **Charts**: Using simple bar/line charts, full-width responsive

## Visual Treatment

**Depth & Elevation**:
- Level 0 (base): No shadow, border only
- Level 1 (panels): border + subtle shadow-sm
- Level 2 (cards): shadow-md
- Level 3 (modals/popovers): shadow-lg

**Borders & Dividers**:
- Panel separators: border-l/border-r
- Section dividers: border-t/border-b
- Component borders: border, rounded-md to rounded-lg

**Focus States**:
- Ring-2 with offset for keyboard navigation (Tailwind ring utilities)
- High contrast focus indicators for accessibility

## Interaction Patterns

**Loading States**:
- Skeleton screens for source loading
- Streaming indicator for chat responses (animated dots)
- Progress bars for workflow execution

**Empty States**:
- Centered message with icon
- Primary CTA to add first source/create first workflow
- Helpful onboarding text

**Error States**:
- Inline error messages with icons
- Toast notifications for system errors (top-right corner)
- Validation errors on form fields (red border + helper text)

## Animations (Minimal & Purposeful)

**Use Framer Motion for**:
- Panel slide-in/out transitions (duration: 200ms)
- A2UI component fade-in when rendered (duration: 150ms)
- Accordion expand/collapse (duration: 200ms)
- Modal enter/exit (duration: 200ms)

**Avoid**: 
- Excessive hover animations
- Parallax effects
- Continuous/looping animations
- Page transition animations

## Accessibility Requirements

- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for dynamic content (A2UI rendering, workflow status)
- Minimum contrast ratio of 4.5:1 for text
- Focus indicators always visible
- Form inputs with associated labels

## Images

**No Hero Images**: This is a workspace application, not a marketing site. The interface itself is the content.

**Icons Throughout**: Use Heroicons exclusively for consistency
- Navigation icons: 20px (w-5 h-5)
- Action buttons: 16px (w-4 h-4)
- Large feature icons: 24px (w-6 h-6)

**Workflow Visuals**: React Flow mindmap serves as the primary visual element - make it prominent and interactive

This design system creates a professional, efficient workspace that scales from complex data visualization to focused chat interactions, with every component purposefully supporting the user's research and workflow orchestration tasks.