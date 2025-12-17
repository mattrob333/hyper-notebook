# Hyper-Notebook

An AI-powered research assistant that goes beyond Google NotebookLM. Upload sources, chat with AI about your research, generate professional reports with a full-featured editor, create images, and much more.

## 🚀 Why Hyper-Notebook?

Hyper-Notebook takes the core concept of NotebookLM and supercharges it with professional features for content creators, researchers, and business users.

### Feature Comparison: Hyper-Notebook vs NotebookLM

| Feature | Hyper-Notebook | Google NotebookLM |
|---------|:-------------:|:-----------------:|
| **Source Management** | | |
| PDF Upload | ✅ | ✅ |
| URL Scraping | ✅ | ✅ |
| Text/Markdown Sources | ✅ | ✅ |
| CSV/Spreadsheet Sources | ✅ | ❌ |
| RSS Feed Integration | ✅ | ❌ |
| **AI Models** | | |
| Multiple AI Providers | ✅ (15+ models) | ❌ (Gemini only) |
| Claude, GPT-4, Gemini, Llama | ✅ | ❌ |
| Model Selection Per Chat | ✅ | ❌ |
| **Report Generation** | | |
| Briefing Documents | ✅ | ✅ |
| Full-Screen Rich Text Editor | ✅ | ❌ |
| AI-Powered Text Rewrite | ✅ | ❌ |
| AI Image Generation in Reports | ✅ | ❌ |
| Export to PDF/Markdown | ✅ | ❌ |
| Custom Letterhead/Branding | ✅ | ❌ |
| LinkedIn Article Format | ✅ | ❌ |
| Twitter Thread Format | ✅ | ❌ |
| Newsletter Format | ✅ | ❌ |
| **Content Types** | | |
| Study Guides | ✅ | ✅ |
| FAQs | ✅ | ✅ |
| Mind Maps (Interactive) | ✅ | ❌ |
| Timelines | ✅ | ❌ |
| Infographics | ✅ | ❌ |
| Slide Decks | ✅ | ❌ |
| Audio Overviews | ✅ | ✅ |
| **Business Features** | | |
| Lead/Contact Management | ✅ | ❌ |
| Email Builder with Lead Pre-fill | ✅ | ❌ |
| CRM Integration Ready | ✅ | ❌ |
| **Developer Features** | | |
| A2UI (AI-Generated UI) | ✅ | ❌ |
| Workflow Automation | ✅ | ❌ |
| API Access | ✅ | ❌ |
| Self-Hosted Option | ✅ | ❌ |
| Open Source | ✅ | ❌ |

## ✨ Key Features

### 📝 Professional Report Editor
- **Full-screen TipTap editor** with rich text formatting
- **AI rewrite** - Select text and have AI improve, expand, or change tone
- **AI image generation** - Generate images from prompts directly in your reports
- **Multiple export formats** - PDF, Markdown, HTML
- **Custom letterhead** - Add branding with logo, company name, tagline

### 🤖 Multi-Model AI
- **15+ AI models** from OpenRouter (Claude, GPT-4, Gemini, Llama, Mistral)
- **Gemini 3 Flash** - Fast, affordable default model
- **Gemini 3 Pro** - For complex reasoning
- **Switch models per conversation**

### 📊 Advanced Source Management
- **Multi-source research** - PDFs, URLs, text, CSV files
- **CSV & Lead Management** - Upload contact lists, view as spreadsheets
- **RSS Feed Integration** - Auto-import from news feeds
- **Lead context injection** - AI knows about your contacts

### 🎨 Content Generation Studio
- Study guides & FAQs
- Executive briefing documents
- Interactive mind maps (React Flow)
- Timelines & infographics
- Slide decks with AI
- Audio overviews (ElevenLabs TTS)
- Professional emails

### 🔧 A2UI System
AI can generate interactive UI components directly in chat:
- Cards, buttons, accordions
- Progress indicators
- Data tables
- Report suggestions with one-click generation

### 📧 Business Tools
- Email builder with template library
- Lead pre-fill from CSV sources
- Professional report formats (LinkedIn, Newsletter, Case Study)
- Workflow automation

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

| Provider | Models | Best For |
|----------|--------|----------|
| Google | **Gemini 3 Flash** (default), Gemini 3 Pro | Fast responses, image generation |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5 | Complex reasoning, writing |
| OpenAI | GPT-5.2, GPT-5.2 Pro, GPT-5.2 Chat | General purpose |
| Meta | Llama 3.3 70B | Open source, cost-effective |
| Mistral | Mistral Large, Mistral Small | European data compliance |
| DeepSeek | DeepSeek V3 | Code generation |
| Qwen | Qwen 2.5 72B | Multilingual |

### Image Generation
- **Gemini 3 Pro Image Preview** - AI image generation directly in reports

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
