# Feature: Sources Experience (Recurring + Clear)

## Overview
Improve the Sources panel so notebooks can maintain **recurring sources** (subreddits, RSS feeds, and URLs) that persist across clears, while letting users quickly clear **working-set** sources and manually clear **context files**. Recurring sources refresh on demand and are labeled by origin.

## Goals
- Persist **recurring sources** per notebook; these survive clears and are used by refresh.
- Distinguish **context files** (manual clear only) from working-set sources.
- Provide clear, labeled origin for subreddits and RSS sources.
- Keep changes incremental and compatible with existing schema.

## Non-Goals
- Automatic context expiration.
- Organization-wide shared sources (per-notebook only).
- New external auth flows (use RSS for subreddits).

## User Stories
- As a user, I can save a source so it survives **Clear Sources** and is used on refresh.
- As a user, I can add **subreddit sources** and see the label `r/<subreddit>`.
- As a user, I can clear stale working-set sources without losing saved or context sources.
- As a user, I can manually clear all context files for the notebook.

## Terminology
- **Recurring**: Sources that persist and are refreshed. (Maps to `category = 'feed'`)
- **Context**: Day-specific reference files. (Maps to `category = 'context'`)
- **Working Set**: Everything else (search/deep-research/manual). (Maps to `category = 'reference'`)

## Data Model (No Migration Required)
Use existing `sources` table with metadata conventions.

### Categories
- `feed` => Recurring (saved/persistent)
- `context` => Context files
- `reference` => Working set

### Metadata fields
```json
{
  "sourceKind": "subreddit" | "rss" | "url" | "context",
  "origin": "manual" | "search" | "deep-research" | "refresh",
  "sourceLabel": "r/artificial" | "MIT Sloan" | "TechCrunch",
  "lastRefreshedAt": "2026-01-15T17:00:00Z",
  "contextDate": "2026-01-15"
}
```

## Source Creation Rules
- **Web search results**: `category = reference`, `origin = search`, `sourceKind = url`.
- **Deep research results**: `category = reference`, `origin = deep-research`, `sourceKind = url`.
- **Manual URL / file / text**: default to `category = reference` unless the user explicitly chooses Recurring or Context.
- **Subreddit add**: `category = feed`, `sourceKind = subreddit`, `content = https://www.reddit.com/r/<sub>/new/.rss`, `sourceLabel = r/<sub>`.
- **Context add**: `category = context`, `sourceKind = context`, `contextDate = YYYY-MM-DD`.

## Clear + Refresh Behavior
- **Clear Sources**: remove `category = reference` sources only. Preserve `feed` and `context`.
- **Clear Context**: remove `category = context` sources only. Manual action.
- **Refresh Feeds**: uses `category = feed` sources. Update `metadata.lastRefreshedAt` on success.

## API Contract
### `POST /api/sources/clear`
Clear sources by scope for a notebook.

**Request**
```json
{
  "notebookId": "string",
  "scope": "working" | "context",
  "olderThanDays": 7,
  "origins": ["search", "deep-research"],
  "excludePinned": true
}
```

**Response**
```json
{ "deleted": 12 }
```

### `PATCH /api/sources/:id`
Already exists; will be used for toggling category/metadata (save/unsave).

### `POST /api/refresh-feeds`
Existing endpoint; uses `category = feed` sources.

### `POST /api/firecrawl-search`
Use for real web search results; fallback to mock if key missing.

## UI/UX Requirements
- **Sources list grouped** into Recurring, Context, Working Set sections.
- **Save/Recurring toggle** available from list row (category dropdown or bookmark).
- **Clear Sources** and **Clear Context** controls near the Refresh button.
- **Source label badges** show `sourceLabel` (ex: `r/artificial`).
- **Add Sources modal** includes:
  - Website URL
  - Subreddit (RSS)
  - Paste text
  - Upload file
  - Add Context

## Acceptance Criteria
- Clear Sources preserves recurring and context.
- Refresh uses recurring sources and does not depend on the RSS Feeds list.
- Subreddit sources show `r/<sub>` label and refresh via RSS.
- Context files are only removed by Clear Context.
