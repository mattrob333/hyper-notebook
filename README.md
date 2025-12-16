# Hyper-Notebook

An AI-powered research assistant inspired by Google NotebookLM. Upload sources, chat with AI about your research, and generate study guides, mind maps, timelines, and more.

## Features

- **Multi-Source Research**: Upload PDFs, add URLs, or paste text as research sources
- **AI Chat**: Conversational interface to ask questions about your sources
- **Multi-Model Support**: Choose from 15+ AI models via OpenRouter (Claude, GPT-4, Gemini, Llama, Mistral, etc.)
- **Content Generation**:
  - Study guides
  - Executive briefing documents
  - FAQs
  - Timelines
  - Mind maps (interactive visualization)
  - Infographics
  - Slide decks
  - Podcast scripts
  - Professional emails
- **A2UI System**: AI can generate interactive UI components directly in chat
- **Workflow Automation**: Create and save multi-step workflows
- **Dark Mode**: Beautiful dark theme inspired by NotebookLM

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend**: Express.js, Node.js 20+
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenRouter API (access to 100+ models)
- **Visualization**: React Flow, Recharts
- **Rich Text**: TipTap editor

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/hyper-notebook.git
cd hyper-notebook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/hyper_notebook
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
PORT=5000
NODE_ENV=development
```

### 4. Set up the database

Create the database:

```bash
createdb hyper_notebook
```

Push the schema:

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Project Structure

```
hyper-notebook/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── a2ui/      # A2UI rendering system
│   │   │   ├── panels/    # Main layout panels
│   │   │   ├── studio/    # Studio tools
│   │   │   └── ui/        # Shadcn components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                 # Express backend
│   ├── index.ts           # Server entry
│   ├── routes.ts          # API endpoints
│   ├── ai-service.ts      # OpenRouter integration
│   ├── storage.ts         # Database operations
│   └── db.ts              # Drizzle setup
├── shared/                 # Shared types
│   └── schema.ts          # Database schema
└── script/                 # Build scripts
```

## API Endpoints

### Sources
- `GET /api/sources` - List all sources
- `POST /api/sources` - Create source from JSON
- `POST /api/sources/upload` - Upload file (PDF, TXT, MD)
- `DELETE /api/sources/:id` - Delete source

### Chat
- `POST /api/chat` - Stream chat response (SSE)
- `GET /api/models` - Get available AI models

### Content Generation
- `POST /api/generate` - Generate content (study guide, FAQ, etc.)
- `GET /api/generated` - List generated content

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow

## Available AI Models

The app supports models from multiple providers via OpenRouter:

| Provider | Models |
|----------|--------|
| Anthropic | Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku |
| OpenAI | GPT-4o, GPT-4o Mini, o1, o1-mini |
| Google | Gemini 2.0 Flash, Gemini Pro 1.5, Gemini Flash 1.5 |
| Meta | Llama 3.3 70B |
| Mistral | Mistral Large, Mistral Small |
| DeepSeek | DeepSeek V3 |
| Qwen | Qwen 2.5 72B |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `DEFAULT_MODEL` | Default AI model ID | No |
| `SITE_URL` | Your site URL (for OpenRouter) | No |
| `SITE_NAME` | Your site name (for OpenRouter) | No |

## Deployment

### Build for production

```bash
npm run build
```

This creates:
- `dist/public/` - Frontend assets
- `dist/index.cjs` - Server bundle

### Run production server

```bash
npm run start
```

### Docker (coming soon)

Docker support is planned for future releases.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [Google NotebookLM](https://notebooklm.google.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI models via [OpenRouter](https://openrouter.ai/)
