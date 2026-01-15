/**
 * PersonaAgent Class
 *
 * Manages persona-flavored AI responses by injecting character context
 * into the agent's system prompt. Each persona has a distinct voice,
 * expertise, and personality defined by their character sheet.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Query, Options } from '@anthropic-ai/claude-agent-sdk';
import type { PersonaAgent as PersonaAgentType, PersonaVoiceStyle } from '@shared/schema';
import { createQueryOptions, defaultConfig } from '../agent/config';
import { loadSystemPrompt } from '../agent/instance';

/**
 * Persona context for message attribution
 */
export interface PersonaContext {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

/**
 * Builds the persona-specific prompt suffix
 */
function buildPersonaPrompt(persona: PersonaAgentType): string {
  const voiceStyle = persona.voiceStyle as PersonaVoiceStyle | null;

  let prompt = `
## Active Persona: ${persona.name}

You are now speaking as **${persona.name}**, ${persona.role} in the ${persona.department} department.

### Character Sheet
${persona.characterSheet}
`;

  if (voiceStyle) {
    prompt += `
### Voice Style
- **Tone:** ${voiceStyle.tone}
- **Vocabulary:** ${voiceStyle.vocabulary?.join(', ') || 'Professional'}
- **Patterns:** ${voiceStyle.patterns?.join('; ') || 'Clear, direct communication'}
`;
  }

  if (persona.expertiseAreas && persona.expertiseAreas.length > 0) {
    prompt += `
### Areas of Expertise
${persona.expertiseAreas.map((area) => `- ${area}`).join('\n')}
`;
  }

  prompt += `
### Behavioral Guidelines
1. Stay fully in character as ${persona.name}
2. Speak with authority on your areas of expertise
3. Express opinions consistent with your character sheet
4. When disagreeing, do so constructively but firmly
5. Reference your experience and background when relevant
6. Do NOT break character or acknowledge being an AI
`;

  return prompt;
}

/**
 * PersonaAgentRunner - Executes queries as a specific persona
 */
export class PersonaAgentRunner {
  private persona: PersonaAgentType;
  private personaPrompt: string;

  constructor(persona: PersonaAgentType) {
    this.persona = persona;
    this.personaPrompt = buildPersonaPrompt(persona);
  }

  /**
   * Get the persona's context for message attribution
   */
  getContext(): PersonaContext {
    return {
      id: this.persona.id,
      name: this.persona.name,
      role: this.persona.role,
      avatarUrl: this.persona.avatarUrl ?? undefined,
    };
  }

  /**
   * Generate a response as this persona
   *
   * @param conversationHistory - Previous messages in the debate
   * @param topic - The current topic being discussed
   * @param options - Additional query options
   */
  async generateResponse(
    conversationHistory: { role: 'user' | 'assistant'; content: string; persona?: string }[],
    topic: string,
    options?: Partial<Options>
  ): Promise<Query> {
    const baseSystemPrompt = await loadSystemPrompt();
    const fullSystemPrompt = `${baseSystemPrompt}\n\n${this.personaPrompt}`;

    // Format conversation for context
    const formattedHistory = conversationHistory.map((msg) => {
      if (msg.persona) {
        return `[${msg.persona}]: ${msg.content}`;
      }
      return msg.content;
    }).join('\n\n');

    const prompt = conversationHistory.length > 0
      ? `Previous discussion:\n${formattedHistory}\n\nContinue the discussion as ${this.persona.name}. Address what was said, take a clear position, and contribute your perspective on: ${topic}`
      : `You are opening a discussion on the following topic. Take a clear position and provide your expert perspective:\n\n${topic}`;

    const baseOptions = createQueryOptions({
      ...defaultConfig,
      systemPrompt: fullSystemPrompt,
    });

    return query({
      prompt,
      options: {
        ...baseOptions,
        ...options,
      },
    });
  }

  /**
   * Generate a simple response and collect the full text
   */
  async respond(
    conversationHistory: { role: 'user' | 'assistant'; content: string; persona?: string }[],
    topic: string,
    options?: Partial<Options>
  ): Promise<string> {
    const agentQuery = await this.generateResponse(conversationHistory, topic, options);

    let response = '';

    for await (const message of agentQuery) {
      if (message.type === 'assistant' && 'content' in message) {
        const content = message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if ('text' in block) {
              response += block.text;
            }
          }
        }
      }
    }

    return response;
  }

  /**
   * Get persona info
   */
  getPersona(): PersonaAgentType {
    return this.persona;
  }

  /**
   * Get the department
   */
  getDepartment(): string {
    return this.persona.department;
  }

  /**
   * Check if persona is in a specific department
   */
  isInDepartment(department: string): boolean {
    return this.persona.department === department;
  }
}

/**
 * Create a PersonaAgentRunner from a database persona record
 */
export function createPersonaRunner(persona: PersonaAgentType): PersonaAgentRunner {
  return new PersonaAgentRunner(persona);
}

/**
 * Create multiple PersonaAgentRunners from database records
 */
export function createPersonaRunners(personas: PersonaAgentType[]): PersonaAgentRunner[] {
  return personas.map((p) => new PersonaAgentRunner(p));
}
