import OpenAI from "openai";
import type { A2UIComponent, ContentType } from "@shared/schema";

// OpenRouter uses OpenAI-compatible API
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:5000",
    "X-Title": process.env.SITE_NAME || "Hyper-Notebook",
  },
});

// Model definitions with metadata
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  description: string;
  supportsImages?: boolean;
  supportsStreaming?: boolean;
  supportsImageGeneration?: boolean;
}

export const availableModels: ModelInfo[] = [
  // Anthropic Models
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    contextLength: 200000,
    description: "Anthropic's frontier reasoning model, optimized for complex software engineering and agentic workflows",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    contextLength: 1000000,
    description: "Most advanced Sonnet, optimized for real-world agents and coding workflows with 1M context",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    contextLength: 200000,
    description: "Fastest and most efficient Claude model, near-frontier intelligence at low cost",
    supportsImages: true,
    supportsStreaming: true,
  },
  // OpenAI Models
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "OpenAI",
    contextLength: 400000,
    description: "Latest frontier-grade model with adaptive reasoning and strong agentic performance",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openai/gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    provider: "OpenAI",
    contextLength: 400000,
    description: "OpenAI's most advanced model for complex tasks requiring step-by-step reasoning",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openai/gpt-5.2-chat",
    name: "GPT-5.2 Chat",
    provider: "OpenAI",
    contextLength: 128000,
    description: "Fast, lightweight GPT-5.2 optimized for low-latency chat",
    supportsImages: true,
    supportsStreaming: true,
  },
  // Google Models
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
    contextLength: 1050000,
    description: "Google's flagship frontier model for high-precision multimodal reasoning with 1M context",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "google/gemini-3-pro-image-preview",
    name: "Nano Banana Pro (Gemini 3 Pro Image)",
    provider: "Google",
    contextLength: 66000,
    description: "Google's most advanced image generation and editing model with high-fidelity visual synthesis",
    supportsImages: true,
    supportsStreaming: true,
    supportsImageGeneration: true,
  },
  {
    id: "google/gemini-2.5-flash-image",
    name: "Nano Banana (Gemini 2.5 Flash Image)",
    provider: "Google",
    contextLength: 33000,
    description: "State-of-the-art image generation with contextual understanding, text-to-image and image edits",
    supportsImages: true,
    supportsStreaming: true,
    supportsImageGeneration: true,
  },
];

// Type for model IDs
export type ModelId = typeof availableModels[number]["id"];

// Default model
export const DEFAULT_MODEL: ModelId = process.env.DEFAULT_MODEL as ModelId || "anthropic/claude-sonnet-4.5";

export interface ChatOptions {
  model?: ModelId;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export async function chat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: ChatOptions = {}
): Promise<string> {
  const model = options.model || DEFAULT_MODEL;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: options.maxTokens || 8192,
    temperature: options.temperature,
  });

  return response.choices[0]?.message?.content || '';
}

export async function* streamChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const model = options.model || DEFAULT_MODEL;

  const stream = await openrouter.chat.completions.create({
    model,
    messages: [
      ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
      ...messages,
    ],
    max_tokens: options.maxTokens || 8192,
    temperature: options.temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function generateImage(
  prompt: string,
  options: { size?: '1024x1024' | '512x512' | '256x256' } = {}
): Promise<string> {
  // Use Nano Banana Pro (Gemini 3 Pro Image) for image generation
  const response = await openrouter.chat.completions.create({
    model: 'google/gemini-3-pro-image-preview',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0]?.message?.content || '';
}

const contentPrompts: Record<ContentType, string> = {
  study_guide: `Create a comprehensive study guide based on the provided sources. Include:
- Key concepts and definitions
- Important facts and dates
- Study questions with answers
- Summary of main themes
Format as structured JSON with sections: concepts, facts, questions, summary.`,

  briefing_doc: `Create an executive briefing document based on the provided sources. Include:
- Executive summary (2-3 paragraphs)
- Key findings and insights
- Recommendations
- Action items
Format as structured JSON with sections: summary, findings, recommendations, actions.`,

  faq: `Generate a comprehensive FAQ based on the provided sources. Include:
- 10-15 frequently asked questions
- Clear, concise answers
- Category groupings if applicable
Format as JSON array of objects with question, answer, and category fields.`,

  timeline: `Create a chronological timeline based on the provided sources. Include:
- Key events with dates
- Brief descriptions
- Significance of each event
Format as JSON array with date, title, description, and significance fields.`,

  mindmap: `Create a mind map structure based on the provided sources. Include:
- Central topic
- Main branches (3-5 key themes)
- Sub-branches with details
- Connections between concepts
Format as JSON with nodes (id, label, type) and edges (source, target) for React Flow.`,

  infographic: `Design an infographic layout based on the provided sources. Include:
- Main title and subtitle
- Key statistics (3-5 numbers with context)
- Visual sections with icons
- Bullet points for key takeaways
Format as structured JSON with title, stats, sections, and takeaways.`,

  slides: `Create a slide deck outline based on the provided sources. Include:
- Title slide
- 8-12 content slides
- Each slide with title, bullet points, and speaker notes
- Conclusion slide
Format as JSON array with slideType, title, bullets, and notes fields.`,

  audio_overview: `Create a podcast script for two hosts discussing the provided sources. Include:
- Introduction and hook
- Main discussion points
- Back-and-forth dialogue
- Conclusion and takeaways
Format as JSON with segments array, each with speaker, text, and timing.`,

  email: `Draft a professional email based on the provided sources and context. Include:
- Subject line
- Greeting
- Body paragraphs
- Call to action
- Signature placeholder
Format as JSON with subject, greeting, body, cta, and signature fields.`,
};

export async function generateContent(
  type: ContentType,
  sources: string[],
  options: { model?: ModelId; customPrompt?: string } = {}
): Promise<any> {
  const systemPrompt = contentPrompts[type];
  const sourcesText = sources.join('\n\n---\n\n');

  const userPrompt = options.customPrompt
    ? `${options.customPrompt}\n\nSources:\n${sourcesText}`
    : `Generate the requested content based on these sources:\n\n${sourcesText}`;

  const response = await chat(
    [{ role: 'user', content: userPrompt }],
    {
      model: options.model || DEFAULT_MODEL,
      systemPrompt: `${systemPrompt}\n\nRespond with valid JSON only, no markdown code blocks.`,
    }
  );

  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch {
    return { raw: response };
  }
}

export async function summarizeSource(content: string, options: { model?: ModelId } = {}): Promise<string> {
  // Use a fast model for summarization
  const fastModel = availableModels.find(m =>
    m.id.includes('haiku') || m.id.includes('chat') || m.id.includes('flash')
  )?.id || DEFAULT_MODEL;

  return chat(
    [{ role: 'user', content: `Summarize the following content in 1-2 sentences only. Be brief and capture the main point:\n\n${content.slice(0, 5000)}` }],
    {
      model: options.model || fastModel,
      systemPrompt: 'You are a helpful assistant that creates very brief, 1-2 sentence summaries. Be concise.',
      maxTokens: 150,
    }
  );
}

export async function parseA2UIFromResponse(response: string): Promise<A2UIComponent[]> {
  const components: A2UIComponent[] = [];

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    components.push({
      id: `code-${blockIndex++}`,
      type: 'code',
      properties: { language: match[1] || 'text' },
      data: match[2].trim(),
    });
  }

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.type && ['card', 'chart', 'table', 'mindmap', 'timeline', 'slides'].includes(parsed.type)) {
        components.push(parsed as A2UIComponent);
      }
    } catch {}
  }

  return components;
}

// Export for use in routes
export { openrouter };

// Helper to get model info
export function getModelInfo(modelId: ModelId): ModelInfo | undefined {
  return availableModels.find(m => m.id === modelId);
}

// Get models grouped by provider
export function getModelsByProvider(): Record<string, ModelInfo[]> {
  return availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);
}
