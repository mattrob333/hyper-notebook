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
}

export const availableModels: ModelInfo[] = [
  // Anthropic Models
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    contextLength: 200000,
    description: "Latest Claude model, excellent for complex reasoning and coding",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextLength: 200000,
    description: "Best balance of intelligence and speed",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    contextLength: 200000,
    description: "Fast and affordable for simple tasks",
    supportsImages: true,
    supportsStreaming: true,
  },
  // OpenAI Models
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextLength: 128000,
    description: "OpenAI's flagship model with vision capabilities",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    contextLength: 128000,
    description: "Fast and cost-effective GPT-4 variant",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openai/o1",
    name: "o1",
    provider: "OpenAI",
    contextLength: 200000,
    description: "Advanced reasoning model for complex problems",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "openai/o1-mini",
    name: "o1-mini",
    provider: "OpenAI",
    contextLength: 128000,
    description: "Smaller reasoning model, faster responses",
    supportsImages: false,
    supportsStreaming: true,
  },
  // Google Models
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    contextLength: 1000000,
    description: "Latest Gemini with 1M context window",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    contextLength: 2000000,
    description: "2M context window, great for large documents",
    supportsImages: true,
    supportsStreaming: true,
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    provider: "Google",
    contextLength: 1000000,
    description: "Fast Gemini model with long context",
    supportsImages: true,
    supportsStreaming: true,
  },
  // Meta Models
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    contextLength: 131072,
    description: "Latest open-source model from Meta",
    supportsImages: false,
    supportsStreaming: true,
  },
  // Mistral Models
  {
    id: "mistralai/mistral-large-2411",
    name: "Mistral Large",
    provider: "Mistral",
    contextLength: 128000,
    description: "Mistral's most capable model",
    supportsImages: false,
    supportsStreaming: true,
  },
  {
    id: "mistralai/mistral-small-2409",
    name: "Mistral Small",
    provider: "Mistral",
    contextLength: 32000,
    description: "Fast and efficient Mistral model",
    supportsImages: false,
    supportsStreaming: true,
  },
  // DeepSeek Models
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    contextLength: 64000,
    description: "Powerful open model, excellent for coding",
    supportsImages: false,
    supportsStreaming: true,
  },
  // Qwen Models
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "Qwen",
    contextLength: 131072,
    description: "Alibaba's latest large model",
    supportsImages: false,
    supportsStreaming: true,
  },
];

// Type for model IDs
export type ModelId = typeof availableModels[number]["id"];

// Default model
export const DEFAULT_MODEL: ModelId = process.env.DEFAULT_MODEL as ModelId || "anthropic/claude-3.5-sonnet";

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
  // Use OpenAI's DALL-E through OpenRouter
  const response = await openrouter.images.generate({
    model: 'openai/dall-e-3',
    prompt,
    size: options.size || '1024x1024',
    n: 1,
    response_format: 'b64_json',
  });
  return response.data?.[0]?.b64_json || '';
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
    m.id.includes('haiku') || m.id.includes('mini') || m.id.includes('flash')
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
