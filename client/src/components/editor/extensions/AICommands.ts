/**
 * AI Slash Commands Extension for TipTap
 *
 * Provides AI-powered text generation and editing commands:
 * - /generate - Generate content from a prompt
 * - /expand - Expand selected text with more detail
 * - /compress - Summarize selected text
 * - /rewrite - Rewrite selected text in a different style
 * - /translate - Translate selected text
 * - /fix - Fix grammar and spelling
 */

import { Extension, Editor } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

// Command types
export interface AICommand {
  id: string;
  name: string;
  description: string;
  icon?: string;
  action: (props: AICommandActionProps) => Promise<void>;
}

export interface AICommandActionProps {
  editor: any;
  selectedText: string;
  prompt?: string;
  onUpdate: (text: string) => void;
  onComplete: () => void;
}

// Default AI commands
export const DEFAULT_AI_COMMANDS: AICommand[] = [
  {
    id: 'generate',
    name: 'Generate',
    description: 'Generate content from a prompt',
    icon: 'sparkles',
    action: async ({ editor, prompt, onUpdate, onComplete }) => {
      // Simulate AI generation - in production, call your AI API
      const generatedText = `Generated content for: ${prompt || 'empty prompt'}`;
      onUpdate(generatedText);
      onComplete();
    },
  },
  {
    id: 'expand',
    name: 'Expand',
    description: 'Expand text with more detail',
    icon: 'maximize',
    action: async ({ editor, selectedText, onUpdate, onComplete }) => {
      if (!selectedText) {
        onComplete();
        return;
      }
      // Simulate expansion
      const expandedText = `${selectedText}\n\nAdditional details: This provides more context and elaboration on the above content.`;
      onUpdate(expandedText);
      onComplete();
    },
  },
  {
    id: 'compress',
    name: 'Summarize',
    description: 'Summarize selected text',
    icon: 'minimize',
    action: async ({ editor, selectedText, onUpdate, onComplete }) => {
      if (!selectedText) {
        onComplete();
        return;
      }
      // Simulate compression
      const compressed = `Summary: ${selectedText.slice(0, 50)}...`;
      onUpdate(compressed);
      onComplete();
    },
  },
  {
    id: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrite in a different style',
    icon: 'refresh',
    action: async ({ editor, selectedText, prompt, onUpdate, onComplete }) => {
      if (!selectedText) {
        onComplete();
        return;
      }
      const style = prompt || 'professional';
      // Simulate rewrite
      const rewritten = `[Rewritten in ${style} style]: ${selectedText}`;
      onUpdate(rewritten);
      onComplete();
    },
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate to another language',
    icon: 'globe',
    action: async ({ editor, selectedText, prompt, onUpdate, onComplete }) => {
      if (!selectedText) {
        onComplete();
        return;
      }
      const language = prompt || 'Spanish';
      // Simulate translation
      const translated = `[Translated to ${language}]: ${selectedText}`;
      onUpdate(translated);
      onComplete();
    },
  },
  {
    id: 'fix',
    name: 'Fix Grammar',
    description: 'Fix grammar and spelling',
    icon: 'check',
    action: async ({ editor, selectedText, onUpdate, onComplete }) => {
      if (!selectedText) {
        onComplete();
        return;
      }
      // Simulate grammar fix
      const fixed = selectedText; // In production, use AI to fix
      onUpdate(fixed);
      onComplete();
    },
  },
];

// Extension options
export interface AICommandsOptions {
  commands?: AICommand[];
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

// Plugin key for AI commands
export const AICommandsPluginKey = new PluginKey('aiCommands');

// Create the AI Commands extension
export const AICommands = Extension.create<AICommandsOptions>({
  name: 'aiCommands',

  addOptions() {
    return {
      commands: DEFAULT_AI_COMMANDS,
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: { id: string } }) => {
          const { id } = props;
          // Delete the slash command
          editor.chain().focus().deleteRange(range).run();

          // Find and execute the command
          const command = DEFAULT_AI_COMMANDS.find((c) => c.id === id);
          if (command) {
            const selectedText = editor.state.selection.empty
              ? ''
              : editor.state.doc.textBetween(
                  editor.state.selection.from,
                  editor.state.selection.to,
                  ' '
                );

            command.action({
              editor,
              selectedText,
              onUpdate: (text) => {
                editor.chain().focus().insertContent(text).run();
              },
              onComplete: () => {
                // Command completed
              },
            });
          }
        },
        items: ({ query }: { query: string }) => {
          return DEFAULT_AI_COMMANDS.filter((cmd) =>
            cmd.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default AICommands;
