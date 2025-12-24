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
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    contextLength: 1000000,
    description: "Google's fastest frontier model with excellent reasoning and 1M context window",
    supportsImages: true,
    supportsStreaming: true,
  },
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
  // xAI Models
  {
    id: "x-ai/grok-4.1-fast",
    name: "Grok 4.1 Fast",
    provider: "xAI",
    contextLength: 2000000,
    description: "xAI's fastest agentic model with 2M context window, ideal for deep research and tool calling",
    supportsImages: true,
    supportsStreaming: true,
  },
];

// Type for model IDs
export type ModelId = typeof availableModels[number]["id"];

// Default model - Gemini 3 Flash for speed and quality
export const DEFAULT_MODEL: ModelId = process.env.DEFAULT_MODEL as ModelId || "google/gemini-3-flash-preview";

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
  options: { size?: '1024x1024' | '512x512' | '256x256'; aspectRatio?: string } = {}
): Promise<string> {
  // Use Nano Banana 3 Pro (Gemini 3 Pro Image) for image generation
  // OpenRouter requires modalities parameter for image generation
  const response = await openrouter.chat.completions.create({
    model: 'google/gemini-3-pro-image-preview',
    messages: [{ 
      role: 'user', 
      content: `Generate an image: ${prompt}` 
    }],
    // @ts-ignore - OpenRouter-specific parameters
    modalities: ['image', 'text'],
    image_config: {
      aspect_ratio: options.aspectRatio || '16:9'
    }
  } as any);
  
  // Extract image from the response
  // OpenRouter returns images in message.images array
  const message = response.choices[0]?.message as any;
  
  if (message?.images && message.images.length > 0) {
    // Return the base64 data URL directly
    const imageUrl = message.images[0]?.image_url?.url;
    if (imageUrl) {
      return imageUrl;
    }
  }
  
  // Fallback: check if content contains base64 data
  const content = message?.content || '';
  if (content.startsWith('data:image')) {
    return content;
  }
  
  console.log('Image generation response:', JSON.stringify(message, null, 2));
  return '';
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

  infographic: `Create a visually stunning infographic image based on the provided sources.

Design Requirements:
- Professional, modern design aesthetic
- Clear visual hierarchy with a compelling title at the top
- 3-5 key statistics displayed prominently with large numbers
- Use icons and visual elements to represent concepts
- Include a cohesive color palette (blues, teals, or the user's preference)
- Organized sections with clear headings
- Data visualizations where appropriate (charts, graphs, icons)
- Clean typography that's easy to read
- Footer with source attribution

Content Focus:
- Highlight the most important insights from the sources
- Use concise, impactful text
- Make data memorable with visual representation

Generate a complete, publication-ready infographic image.`,

  slides: `Create a professional slide deck based on the provided sources.

Instructions:
- Create 6-10 slides total
- Each slide MUST have a "title" (string) and "bullets" (array of 2-4 strings)
- Be concise, professional, and impactful
- Use clear, action-oriented language
- Do not include filler text

Return ONLY valid JSON matching this EXACT structure:
{
  "slides": [
    { "title": "Slide Title Here", "bullets": ["Point 1", "Point 2", "Point 3"] }
  ]
}`,

  audio_overview: `Create a podcast script for two hosts discussing the provided sources. Include:
- Introduction and hook
- Main discussion points
- Back-and-forth dialogue
- Conclusion and takeaways
Format as JSON with segments array, each with speaker, text, and timing.`,

  audio_lecture: `Create an educational lecture script for a single instructor teaching about the provided sources. Include:
- Engaging introduction that hooks the listener
- Clear explanation of key concepts with examples
- Logical flow from foundational ideas to advanced insights
- Practical applications and real-world connections
- Summary of key takeaways and action items
- Conversational but authoritative tone, as if speaking to students

The speaker should be named "Instructor" or "Professor".
Format as JSON with segments array, each with speaker (always "Instructor"), text, and timing.`,

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

  // Check if this is spreadsheet/CSV data (JSON with type: 'spreadsheet')
  let isSpreadsheet = false;
  let spreadsheetInfo = '';
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'spreadsheet' && parsed.headers && parsed.rows) {
      isSpreadsheet = true;
      const headers = parsed.headers.join(', ');
      const rowCount = parsed.rowCount || parsed.rows.length;
      const sampleRows = parsed.rows.slice(0, 3).map((row: Record<string, string>) => 
        Object.values(row).join(' | ')
      ).join('\n');
      spreadsheetInfo = `This is a spreadsheet/CSV with ${rowCount} rows and the following columns: ${headers}\n\nSample data:\n${sampleRows}`;
    }
  } catch {
    // Not JSON, treat as regular content
  }

  if (isSpreadsheet) {
    return chat(
      [{ role: 'user', content: `Based on this spreadsheet data, write a brief 2-3 sentence description that explains:
1. What kind of data this spreadsheet contains
2. What it could be used for (e.g., contact list, sales data, research results)

${spreadsheetInfo}` }],
      {
        model: options.model || fastModel,
        systemPrompt: 'You are a helpful assistant that describes data sources. Focus on the type of data and its potential uses. Be concise and practical.',
        maxTokens: 200,
      }
    );
  }

  // Filter out code/CSS content - focus on text
  const cleanContent = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{[^}]*:[^}]*\}/g, '') // Remove CSS-like blocks
    .replace(/\s+/g, ' ')
    .trim();

  return chat(
    [{ role: 'user', content: `Based on the following content, write a brief 2-3 sentence description that explains:
1. What this source is about (the main topic/subject)
2. What it would be useful for (how someone might use this information)

Ignore any code, CSS, or technical markup - focus only on the actual article/page content.

Content:
${cleanContent.slice(0, 8000)}` }],
    {
      model: options.model || fastModel,
      systemPrompt: 'You are a helpful assistant that describes web sources in plain language. Focus on WHAT the content is about and WHY it would be useful. Ignore code snippets, CSS, and technical markup. Write naturally as if explaining to a colleague.',
      maxTokens: 200,
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
