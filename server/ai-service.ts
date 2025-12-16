import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { A2UIComponent, ContentType } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "dummy",
  httpOptions: {
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export type ModelProvider = 'openai' | 'gemini';
export type ModelId = 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4o' | 'gpt-4o-mini' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-3-pro-preview';

const modelMapping: Record<ModelId, { provider: ModelProvider; model: string }> = {
  'gpt-4.1': { provider: 'openai', model: 'gpt-4.1' },
  'gpt-4.1-mini': { provider: 'openai', model: 'gpt-4.1-mini' },
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
  'gemini-2.5-pro': { provider: 'gemini', model: 'gemini-2.5-pro' },
  'gemini-2.5-flash': { provider: 'gemini', model: 'gemini-2.5-flash' },
  'gemini-3-pro-preview': { provider: 'gemini', model: 'gemini-3-pro-preview' },
};

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
  const modelId = options.model || 'gpt-4.1';
  const { provider, model } = modelMapping[modelId];

  if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        ...messages,
      ],
      max_completion_tokens: options.maxTokens || 8192,
    });
    return response.choices[0]?.message?.content || '';
  } else {
    const geminiModel = gemini.models.generateContent({
      model,
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      })),
      config: {
        maxOutputTokens: options.maxTokens || 8192,
        systemInstruction: options.systemPrompt,
      },
    });
    const response = await geminiModel;
    return response.text || '';
  }
}

export async function* streamChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const modelId = options.model || 'gpt-4.1';
  const { provider, model } = modelMapping[modelId];

  if (provider === 'openai') {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
        ...messages,
      ],
      max_completion_tokens: options.maxTokens || 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } else {
    const geminiModel = gemini.models.generateContentStream({
      model,
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      })),
      config: {
        maxOutputTokens: options.maxTokens || 8192,
        systemInstruction: options.systemPrompt,
      },
    });

    for await (const chunk of await geminiModel) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
}

export async function generateImage(
  prompt: string,
  options: { size?: '1024x1024' | '512x512' | '256x256' } = {}
): Promise<string> {
  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: options.size || '1024x1024',
    n: 1,
  });
  return response.data?.[0]?.b64_json || '';
}

export async function generateGeminiImage(prompt: string): Promise<string> {
  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return response.text || '';
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
      model: options.model || 'gpt-4.1',
      systemPrompt: `${systemPrompt}\n\nRespond with valid JSON only, no markdown code blocks.`,
    }
  );

  try {
    return JSON.parse(response);
  } catch {
    return { raw: response };
  }
}

export async function summarizeSource(content: string, options: { model?: ModelId } = {}): Promise<string> {
  return chat(
    [{ role: 'user', content: `Summarize the following content in 1-2 sentences only. Be brief and capture the main point:\n\n${content.slice(0, 5000)}` }],
    { 
      model: options.model || 'gpt-4.1-mini',
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

export { openai, gemini };
