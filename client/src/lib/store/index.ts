/**
 * NextMethod Global State Store
 *
 * Zustand store for managing application state including:
 * - Agent mode (direct vs orchestrator)
 * - Persona agents and debates
 * - Active tasks and workflows
 * - TipTap editor state
 * - Todo items
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Message } from '@shared/schema';

// ============================================================================
// Types
// ============================================================================

export type AgentMode = 'direct' | 'orchestrator';

export interface PersonaAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string;
  characterSheet: string;
  voiceStyle: {
    tone: string;
    vocabulary: string[];
    patterns: string[];
  };
  expertiseAreas: string[];
}

export interface ActiveTask {
  id: string;
  type: 'subagent' | 'workflow';
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  result?: unknown;
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TipTapState {
  isOpen: boolean;
  template: string | null;
  content: string;
  documentId: string | null;
}

export interface DebateMessage extends Message {
  personaId?: string;
  personaName?: string;
  personaAvatar?: string;
}

// ============================================================================
// Store Slices
// ============================================================================

interface ModeSlice {
  mode: AgentMode;
  setMode: (mode: AgentMode) => void;
}

interface PersonaSlice {
  availablePersonas: PersonaAgent[];
  selectedPersonaIds: string[];
  isDebateActive: boolean;
  debateMessages: DebateMessage[];
  selectPersona: (id: string) => void;
  deselectPersona: (id: string) => void;
  setPersonas: (personas: PersonaAgent[]) => void;
  startDebate: () => void;
  endDebate: () => void;
  addDebateMessage: (message: DebateMessage) => void;
  clearDebate: () => void;
}

interface TaskSlice {
  activeTasks: ActiveTask[];
  addTask: (task: Omit<ActiveTask, 'id' | 'startedAt'>) => string;
  updateTask: (id: string, updates: Partial<ActiveTask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
}

interface TodoSlice {
  todoItems: TodoItem[];
  addTodo: (content: string) => string;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  removeTodo: (id: string) => void;
  setTodos: (items: TodoItem[]) => void;
}

interface TipTapSlice {
  tiptap: TipTapState;
  openTipTap: (params?: { template?: string; content?: string; documentId?: string }) => void;
  closeTipTap: () => void;
  setTipTapContent: (content: string) => void;
}

// ============================================================================
// Combined Store
// ============================================================================

type NextMethodStore = ModeSlice & PersonaSlice & TaskSlice & TodoSlice & TipTapSlice;

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useNextMethodStore = create<NextMethodStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Mode slice
        mode: 'direct',
        setMode: (mode) => set({ mode }),

        // Persona slice
        availablePersonas: [],
        selectedPersonaIds: [],
        isDebateActive: false,
        debateMessages: [],

        selectPersona: (id) =>
          set((state) => ({
            selectedPersonaIds: state.selectedPersonaIds.includes(id)
              ? state.selectedPersonaIds
              : [...state.selectedPersonaIds, id],
          })),

        deselectPersona: (id) =>
          set((state) => ({
            selectedPersonaIds: state.selectedPersonaIds.filter((pid) => pid !== id),
          })),

        setPersonas: (personas) => set({ availablePersonas: personas }),

        startDebate: () =>
          set({
            isDebateActive: true,
            mode: 'orchestrator',
            debateMessages: [],
          }),

        endDebate: () =>
          set({
            isDebateActive: false,
            mode: 'direct',
          }),

        addDebateMessage: (message) =>
          set((state) => ({
            debateMessages: [...state.debateMessages, message],
          })),

        clearDebate: () => set({ debateMessages: [], isDebateActive: false }),

        // Task slice
        activeTasks: [],

        addTask: (task) => {
          const id = generateId();
          set((state) => ({
            activeTasks: [
              ...state.activeTasks,
              { ...task, id, startedAt: new Date(), status: 'pending' },
            ],
          }));
          return id;
        },

        updateTask: (id, updates) =>
          set((state) => ({
            activeTasks: state.activeTasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task
            ),
          })),

        removeTask: (id) =>
          set((state) => ({
            activeTasks: state.activeTasks.filter((task) => task.id !== id),
          })),

        clearCompletedTasks: () =>
          set((state) => ({
            activeTasks: state.activeTasks.filter(
              (task) => task.status !== 'completed' && task.status !== 'failed'
            ),
          })),

        // Todo slice
        todoItems: [],

        addTodo: (content) => {
          const id = generateId();
          const now = new Date();
          set((state) => ({
            todoItems: [
              ...state.todoItems,
              { id, content, status: 'pending', createdAt: now, updatedAt: now },
            ],
          }));
          return id;
        },

        updateTodo: (id, updates) =>
          set((state) => ({
            todoItems: state.todoItems.map((item) =>
              item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
            ),
          })),

        removeTodo: (id) =>
          set((state) => ({
            todoItems: state.todoItems.filter((item) => item.id !== id),
          })),

        setTodos: (items) => set({ todoItems: items }),

        // TipTap slice
        tiptap: {
          isOpen: false,
          template: null,
          content: '',
          documentId: null,
        },

        openTipTap: (params) =>
          set({
            tiptap: {
              isOpen: true,
              template: params?.template ?? null,
              content: params?.content ?? '',
              documentId: params?.documentId ?? null,
            },
          }),

        closeTipTap: () =>
          set((state) => ({
            tiptap: { ...state.tiptap, isOpen: false },
          })),

        setTipTapContent: (content) =>
          set((state) => ({
            tiptap: { ...state.tiptap, content },
          })),
      }),
      {
        name: 'nextmethod-store',
        partialize: (state) => ({
          // Only persist these fields
          mode: state.mode,
          todoItems: state.todoItems,
        }),
      }
    ),
    { name: 'NextMethodStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectMode = (state: NextMethodStore) => state.mode;
export const selectIsOrchestrator = (state: NextMethodStore) => state.mode === 'orchestrator';
export const selectSelectedPersonas = (state: NextMethodStore) =>
  state.availablePersonas.filter((p) => state.selectedPersonaIds.includes(p.id));
export const selectActiveTasks = (state: NextMethodStore) => state.activeTasks;
export const selectRunningTasks = (state: NextMethodStore) =>
  state.activeTasks.filter((t) => t.status === 'running');
export const selectTodoItems = (state: NextMethodStore) => state.todoItems;
export const selectPendingTodos = (state: NextMethodStore) =>
  state.todoItems.filter((t) => t.status !== 'completed');
