/**
 * DebateOrchestrator
 *
 * Manages multi-persona debates by coordinating turn-taking,
 * maintaining conversation history, and synthesizing conclusions.
 * Implements the "Silent Director" pattern from the NextMethod system prompt.
 */

import type { PersonaAgent as PersonaAgentType, DebateSynthesis } from '@shared/schema';
import { PersonaAgentRunner, createPersonaRunners, type PersonaContext } from './PersonaAgent';

/**
 * Message in a debate conversation
 */
export interface DebateMessage {
  id: string;
  personaId: string;
  personaName: string;
  personaRole: string;
  personaAvatar?: string;
  content: string;
  timestamp: Date;
  toolCalls?: { tool: string; params: Record<string, unknown> }[];
}

/**
 * Debate state
 */
export interface DebateState {
  id: string;
  topic: string;
  status: 'active' | 'paused' | 'completed' | 'synthesized';
  messages: DebateMessage[];
  currentSpeakerIndex: number;
  participants: PersonaContext[];
}

/**
 * Tool call intent detected in a response
 */
export interface ToolCallIntent {
  tool: string;
  params: Record<string, unknown>;
}

/**
 * DebateOrchestrator - The "Silent Director"
 *
 * Coordinates multi-persona debates, managing turn-taking,
 * detecting tool calls, and synthesizing conclusions.
 */
export class DebateOrchestrator {
  private participants: PersonaAgentRunner[];
  private state: DebateState;
  private onMessageCallback?: (message: DebateMessage) => void;

  constructor(personas: PersonaAgentType[], topic: string) {
    this.participants = createPersonaRunners(personas);
    this.state = {
      id: this.generateId(),
      topic,
      status: 'active',
      messages: [],
      currentSpeakerIndex: 0,
      participants: this.participants.map((p) => p.getContext()),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Set callback for new messages
   */
  onMessage(callback: (message: DebateMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Get the current debate state
   */
  getState(): DebateState {
    return { ...this.state };
  }

  /**
   * Get participants
   */
  getParticipants(): PersonaContext[] {
    return [...this.state.participants];
  }

  /**
   * Initiate the debate with the first speaker
   */
  async initiate(): Promise<DebateMessage> {
    const firstSpeaker = this.participants[0];
    const context = firstSpeaker.getContext();

    const response = await firstSpeaker.respond([], this.state.topic);

    const message: DebateMessage = {
      id: this.generateId(),
      personaId: context.id,
      personaName: context.name,
      personaRole: context.role,
      personaAvatar: context.avatarUrl,
      content: response,
      timestamp: new Date(),
      toolCalls: this.detectToolCalls(response),
    };

    this.state.messages.push(message);
    this.state.currentSpeakerIndex = 1;

    this.onMessageCallback?.(message);

    return message;
  }

  /**
   * Continue the debate with the next speaker
   */
  async continueDebate(): Promise<DebateMessage> {
    if (this.state.status !== 'active') {
      throw new Error('Debate is not active');
    }

    const speaker = this.participants[this.state.currentSpeakerIndex];
    const context = speaker.getContext();

    // Format history for the persona
    const history = this.state.messages.map((m) => ({
      role: 'assistant' as const,
      content: m.content,
      persona: m.personaName,
    }));

    const response = await speaker.respond(history, this.state.topic);

    const message: DebateMessage = {
      id: this.generateId(),
      personaId: context.id,
      personaName: context.name,
      personaRole: context.role,
      personaAvatar: context.avatarUrl,
      content: response,
      timestamp: new Date(),
      toolCalls: this.detectToolCalls(response),
    };

    this.state.messages.push(message);
    this.state.currentSpeakerIndex =
      (this.state.currentSpeakerIndex + 1) % this.participants.length;

    this.onMessageCallback?.(message);

    return message;
  }

  /**
   * Run multiple turns of the debate
   */
  async runTurns(count: number): Promise<DebateMessage[]> {
    const messages: DebateMessage[] = [];

    // If no messages yet, initiate
    if (this.state.messages.length === 0) {
      messages.push(await this.initiate());
      count--;
    }

    for (let i = 0; i < count; i++) {
      messages.push(await this.continueDebate());
    }

    return messages;
  }

  /**
   * Detect tool call intents in a response
   */
  private detectToolCalls(response: string): ToolCallIntent[] | undefined {
    const toolPatterns: { pattern: RegExp; tool: string; extractParams?: (match: RegExpMatchArray) => Record<string, unknown> }[] = [
      {
        pattern: /I'll get my team on that|Let me get my team/i,
        tool: 'spawn_subagent',
        extractParams: () => ({ type: 'team' }),
      },
      {
        pattern: /Let me research|I should research|We need to research/i,
        tool: 'trigger_workflow',
        extractParams: () => ({ workflow: 'research' }),
      },
      {
        pattern: /I should draft|Let me draft|I'll draft/i,
        tool: 'open_tiptap',
        extractParams: () => ({ template: 'document' }),
      },
      {
        pattern: /I'll send that|Let me send|I should send/i,
        tool: 'send_email',
        extractParams: () => ({}),
      },
      {
        pattern: /We need data on|Let me get the data|I need to analyze/i,
        tool: 'spawn_subagent',
        extractParams: () => ({ type: 'analyst' }),
      },
    ];

    const detected: ToolCallIntent[] = [];

    for (const { pattern, tool, extractParams } of toolPatterns) {
      const match = response.match(pattern);
      if (match) {
        detected.push({
          tool,
          params: extractParams?.(match) ?? {},
        });
      }
    }

    return detected.length > 0 ? detected : undefined;
  }

  /**
   * Check if consensus is emerging
   */
  detectConsensus(): { emerging: boolean; points: string[] } {
    if (this.state.messages.length < 3) {
      return { emerging: false, points: [] };
    }

    // Simple heuristic: look for agreement patterns in recent messages
    const recentMessages = this.state.messages.slice(-3);
    const agreementPatterns = [
      /I agree/i,
      /that's a good point/i,
      /building on what .* said/i,
      /to add to/i,
      /exactly right/i,
      /I think we're aligned/i,
    ];

    const points: string[] = [];
    let agreementCount = 0;

    for (const message of recentMessages) {
      for (const pattern of agreementPatterns) {
        if (pattern.test(message.content)) {
          agreementCount++;
          break;
        }
      }
    }

    return {
      emerging: agreementCount >= 2,
      points,
    };
  }

  /**
   * Pause the debate
   */
  pause(): void {
    this.state.status = 'paused';
  }

  /**
   * Resume the debate
   */
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'active';
    }
  }

  /**
   * End the debate
   */
  end(): void {
    this.state.status = 'completed';
  }

  /**
   * Synthesize the debate into actionable conclusions
   */
  async synergize(): Promise<DebateSynthesis> {
    // Build synthesis from messages
    const synthesis: DebateSynthesis = {
      executiveSummary: this.generateExecutiveSummary(),
      keyDecisions: this.extractKeyDecisions(),
      actionItems: this.extractActionItems(),
      openQuestions: this.extractOpenQuestions(),
      dissentingViews: this.extractDissentingViews(),
      supportingEvidence: [],
    };

    this.state.status = 'synthesized';

    return synthesis;
  }

  private generateExecutiveSummary(): string {
    const participantNames = this.state.participants.map((p) => p.name).join(', ');
    const messageCount = this.state.messages.length;

    return `Discussion on "${this.state.topic}" with ${participantNames} (${messageCount} exchanges). Key themes and conclusions emerged from the collaborative debate.`;
  }

  private extractKeyDecisions(): { decision: string; reasoning: string }[] {
    // Placeholder - would use AI to extract decisions
    return [
      {
        decision: 'Further analysis needed',
        reasoning: 'The discussion highlighted multiple perspectives that require synthesis',
      },
    ];
  }

  private extractActionItems(): { item: string; owner: string; priority: 'high' | 'medium' | 'low' }[] {
    // Placeholder - would use AI to extract action items
    return [];
  }

  private extractOpenQuestions(): string[] {
    // Placeholder - would use AI to extract open questions
    return [];
  }

  private extractDissentingViews(): { persona: string; view: string }[] {
    // Placeholder - would use AI to identify disagreements
    return [];
  }
}

/**
 * Create a new debate orchestrator
 */
export function createDebate(
  personas: PersonaAgentType[],
  topic: string
): DebateOrchestrator {
  return new DebateOrchestrator(personas, topic);
}
