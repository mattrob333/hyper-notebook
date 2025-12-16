# Video Chat Assist - Feature Implementation Plan

> **Status:** PLANNED (Not yet implemented)  
> **Created:** December 16, 2025  
> **Reference:** `videocahtassist.md` contains the source Gemini Live API demo code

---

## Overview

Video Chat Assist is a real-time AI advisor feature that integrates the Gemini Live API into Hyper-Notebook. It allows users to have a live audio conversation where the AI can listen and provide contextual assistance based on the notebook's sources/knowledge base.

### Key Use Cases
- **Sales calls:** AI listens to conversations and suggests answers from product docs
- **Research assistance:** Real-time Q&A during video meetings
- **Interview prep:** Practice with AI feedback based on uploaded materials

---

## Architecture

### How It Fits Into Existing App

The feature follows the established `StudioPanel` pattern:

```
StudioPanel.tsx
├── activeView states: 'main' | 'email' | 'hyperbrowser' | 'context-file' | 'canvas'
│                      + 'video-chat-assist' (NEW)
├── Grid buttons: Audio Overview, Mind Map, Infographic, Slide Deck, Reports, Email
│                 + Video Chat Assist (NEW - cyan color)
└── Builder components: EmailBuilder, HyperBrowserBuilder, AIContextFileGenerator
                        + VideoChatAssistBuilder (NEW)
```

### Proposed File Structure

```
client/src/
├── components/
│   └── studio/
│       └── VideoChatAssistBuilder.tsx     # Main UI component
│
├── lib/
│   └── video-chat/
│       ├── gemini-live-api.ts             # WebSocket client for Gemini Live API
│       ├── media-utils.ts                 # AudioStreamer, AudioPlayer, ScreenCapture
│       └── tools.ts                       # Tool definitions (show_modal, etc.)

public/
└── audio-processors/
    ├── capture.worklet.js                 # Audio capture worklet (mic → PCM)
    └── playback.worklet.js                # Audio playback worklet (PCM → speakers)

server/
└── (Optional) gemini-proxy route or separate Python server
```

---

## Implementation Phases

### Phase 1: UI Shell
- [ ] Add `Video` icon import to StudioPanel.tsx
- [ ] Add `'video-chat-assist'` to `ActiveView` type
- [ ] Add cyan-colored button to the Studio grid
- [ ] Create `VideoChatAssistBuilder.tsx` with basic layout and back button

### Phase 2: Port Utilities to TypeScript
- [ ] Convert `gemini-api.js` → `gemini-live-api.ts`
  - `GeminiLiveAPI` class
  - `MultimodalLiveResponseMessage` parser
  - `FunctionCallDefinition` base class
- [ ] Convert `media-utils.js` → `media-utils.ts`
  - `AudioStreamer` class (mic capture)
  - `AudioPlayer` class (response playback)
  - `ScreenCapture` class (optional, for tab audio)
- [ ] Copy audio worklet files to `public/audio-processors/`

### Phase 3: WebSocket Connection
- [ ] Implement connect/disconnect functionality
- [ ] Handle WebSocket lifecycle events
- [ ] Display connection status in UI
- [ ] Add configuration for Project ID and proxy URL

### Phase 4: Audio Streaming
- [ ] Implement mic capture and streaming to Gemini
- [ ] Implement audio response playback
- [ ] Add volume controls
- [ ] Optional: Tab audio sharing for meeting integration

### Phase 5: Knowledge Base Integration
- [ ] Auto-populate knowledge from notebook sources
- [ ] Allow user to edit/customize the knowledge base
- [ ] Build system instructions with source content

### Phase 6: Tool Calling & Modal
- [ ] Implement `show_modal` tool handler
- [ ] Display AI suggestions in overlay modal
- [ ] Support Silent mode (visual only) and Outspoken mode (audio + visual)

---

## Code Changes Required

### StudioPanel.tsx Modifications

**1. Add import:**
```typescript
import { Video } from "lucide-react";
import VideoChatAssistBuilder from "../studio/VideoChatAssistBuilder";
```

**2. Update ActiveView type (line ~171):**
```typescript
type ActiveView = 'main' | 'email' | 'hyperbrowser' | 'context-file' | 'canvas' | 'video-chat-assist';
```

**3. Add view handler (around line ~450):**
```typescript
if (activeView === 'video-chat-assist') {
  return (
    <VideoChatAssistBuilder 
      onBack={() => setActiveView('main')}
      sources={sources}
    />
  );
}
```

**4. Add button to grid (after Email button, around line ~577):**
```typescript
<button
  className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 hover-elevate transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
  onClick={() => setActiveView('video-chat-assist')}
  data-testid="button-video-chat-assist"
>
  <Video className="w-4 h-4 text-cyan-500" />
  <span className="text-xs font-medium">Video Chat Assist</span>
</button>
```

---

## VideoChatAssistBuilder Component Outline

```typescript
interface VideoChatAssistBuilderProps {
  onBack: () => void;
  sources: Source[];
}

export default function VideoChatAssistBuilder({ onBack, sources }: VideoChatAssistBuilderProps) {
  // State
  const [connected, setConnected] = useState(false);
  const [audioStreaming, setAudioStreaming] = useState(false);
  const [advisorMode, setAdvisorMode] = useState<'silent' | 'outspoken'>('silent');
  const [knowledge, setKnowledge] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  
  // Configuration
  const [projectId, setProjectId] = useState('');
  const [proxyUrl, setProxyUrl] = useState('ws://localhost:8080');
  
  // Refs for API client and media handlers
  const clientRef = useRef<GeminiLiveAPI | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // Auto-populate knowledge from sources
  useEffect(() => {
    const knowledgeBase = sources
      .map(s => `## ${s.name}\n${s.content || 'No content'}`)
      .join('\n\n');
    setKnowledge(knowledgeBase);
  }, [sources]);

  // ... connection handlers, audio handlers, UI rendering
}
```

---

## Backend Considerations

### Option A: Python Proxy (Recommended)
The demo's `server.py` handles Google Cloud authentication automatically using Application Default Credentials. This is the simplest approach.

**Pros:**
- Easy GCP auth via `gcloud auth application-default login`
- Already tested and working
- Can run as a separate container

**Cons:**
- Requires Python runtime
- Separate deployment from Node.js app

### Option B: Node.js Proxy
Add a WebSocket proxy route to the existing Express server.

**Pros:**
- Single deployment
- Unified codebase

**Cons:**
- Need to implement GCP auth in Node (`google-auth-library`)
- More complex WebSocket proxying

### Recommendation
Start with **Option A** (Python proxy) for faster development. Can migrate to Node.js later if needed.

---

## Environment Variables Needed

```env
# Gemini Live API Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GEMINI_PROXY_URL=ws://localhost:8080

# Optional: If using service account instead of ADC
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## UI Design

```
┌─────────────────────────────────────────────────────┐
│ ← Video Chat Assist                    [⚙️ Config]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Advisor Mode                                       │
│  ┌────────────────┐  ┌────────────────┐            │
│  │ 🤫 Silent Mode │  │ 🗣️ Outspoken   │            │
│  │ Visual only    │  │ Audio + Visual │            │
│  └────────────────┘  └────────────────┘            │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Knowledge Base (from 3 sources)                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ ## Source 1: Product Documentation          │   │
│  │ Key features include...                     │   │
│  │                                             │   │
│  │ ## Source 2: FAQ                            │   │
│  │ Common questions...                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Controls                                           │
│  ┌────────────────┐  ┌────────────────┐            │
│  │ 🔌 Connect     │  │ 🎙️ Start Mic   │            │
│  └────────────────┘  └────────────────┘            │
│                                                     │
│  Status: ● Disconnected                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    // No new npm dependencies needed for client
    // Audio worklets use native Web Audio API
  }
}
```

For Python proxy (if using):
```
websockets>=12.0
google-auth>=2.23.0
certifi>=2023.7.22
```

---

## Testing Checklist

- [ ] Button appears in Studio panel
- [ ] View switches correctly on button click
- [ ] Back button returns to main Studio view
- [ ] Knowledge base populates from sources
- [ ] WebSocket connects to proxy
- [ ] Audio capture starts/stops correctly
- [ ] Audio playback works for responses
- [ ] Modal displays on tool call
- [ ] Silent mode suppresses audio output
- [ ] Outspoken mode plays audio + shows modal

---

## Reference Files

The complete source code for the Gemini Live API demo is in:
- `videocahtassist.md` - Contains full repo contents including:
  - `server.py` - Python WebSocket proxy
  - `src/utils/gemini-api.js` - API client
  - `src/utils/media-utils.js` - Audio/video utilities
  - `src/utils/tools.js` - Tool definitions
  - `src/components/LiveAPIDemo.jsx` - Main demo component
  - `public/audio-processors/*.js` - Audio worklets

---

## Notes

- Gemini Live API requires **Vertex AI** (Google Cloud), not OpenRouter
- The `activity_handling: NO_INTERRUPTION` setting prevents barge-in
- `end_of_speech_sensitivity: HIGH` makes responses snappier
- Proactive audio allows the model to speak unprompted based on context
