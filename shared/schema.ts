import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Letterhead settings type
export interface LetterheadSettings {
  enabled: boolean;
  position: 'left' | 'center' | 'right';
  logoUrl?: string;
  companyName?: string;
  tagline?: string;
}

// Notebooks table - each notebook contains its own sources, conversations, and generated content
export const notebooks = pgTable("notebooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Clerk user ID - null for legacy/shared notebooks
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji").default("📓"),
  color: text("color").default("#6366f1"),
  sourceCount: integer("source_count").default(0),
  letterhead: jsonb("letterhead").$type<LetterheadSettings>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotebookSchema = createInsertSchema(notebooks).omit({ id: true, createdAt: true, updatedAt: true, sourceCount: true, userId: true });
export type InsertNotebook = z.infer<typeof insertNotebookSchema>;
export type Notebook = typeof notebooks.$inferSelect;

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  type: text("type").notNull().$type<'url' | 'pdf' | 'text' | 'audio' | 'video' | 'csv'>(),
  category: text("category").$type<'context' | 'feed' | 'reference'>().default('context'),
  name: text("name").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSourceSchema = createInsertSchema(sources).omit({ id: true, createdAt: true }).extend({
  type: z.enum(['url', 'pdf', 'text', 'audio', 'video', 'csv']),
  category: z.enum(['context', 'feed', 'reference']).optional().default('context'),
  metadata: z.record(z.any()).optional().nullable(),
});

// CSV/Spreadsheet content structure
export interface SpreadsheetContent {
  type: 'spreadsheet';
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  fileName: string;
  detectedColumns: {
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
    phone?: string;
  };
}

// Lead type for selected lead context
export interface Lead {
  rowIndex: number;
  data: Record<string, string>;
  email?: string;
  name?: string;
  company?: string;
}
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;

// RSS Feeds table - stores discovered RSS/Atom feed subscriptions
export const feeds = pgTable("feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceUrl: text("source_url"), // The website where the feed was discovered
  lastFetched: timestamp("last_fetched"),
  itemCount: integer("item_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeedSchema = createInsertSchema(feeds).omit({ id: true, createdAt: true, lastFetched: true, itemCount: true });
export type InsertFeed = z.infer<typeof insertFeedSchema>;
export type Feed = typeof feeds.$inferSelect;

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceIds: text("source_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  title: text("title"),
  model: text("model").default("gpt-4.1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull().$type<'user' | 'assistant' | 'system'>(),
  content: text("content").notNull(),
  a2uiComponents: jsonb("a2ui_components").$type<A2UIComponent[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true }).extend({
  role: z.enum(['user', 'assistant', 'system']),
  a2uiComponents: z.array(z.object({
    id: z.string(),
    type: z.enum(['card', 'chart', 'table', 'list', 'code', 'quote', 'image', 'accordion', 'tabs', 'progress', 'badge', 'button', 'link', 'mindmap', 'timeline', 'slides', 'audio_transcript']),
    parentId: z.string().optional(),
    properties: z.record(z.any()),
    data: z.any().optional(),
    children: z.array(z.any()).optional(),
  })).optional().nullable(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Legacy browser automation workflows (keep for backward compatibility)
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").$type<WorkflowStep[]>().default([]),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true }).extend({
  steps: z.array(z.object({
    id: z.string(),
    action: z.enum(['navigate', 'click', 'type', 'scrape', 'screenshot', 'wait', 'extract', 'summarize']),
    selector: z.string().optional(),
    value: z.string().optional(),
    params: z.record(z.any()).optional(),
  })).optional(),
});
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

// Generative UI Workflows - step-based wizards with A2UI components
export const uiWorkflows = pgTable("ui_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  category: text("category").notNull().$type<'onboarding' | 'strategy' | 'sales' | 'marketing' | 'content' | 'design' | 'product' | 'operations' | 'legal' | 'customer' | 'productivity' | 'meta'>(),
  tags: text("tags").array(),
  icon: text("icon"),
  emoji: text("emoji"),
  color: text("color"),
  estimatedMinutes: integer("estimated_minutes"),
  difficulty: text("difficulty").$type<'beginner' | 'intermediate' | 'advanced'>(),
  definition: jsonb("definition").$type<any>().notNull(), // Full WorkflowDefinition JSON
  isBuiltIn: boolean("is_built_in").default(false), // System-provided vs user-created
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUIWorkflowSchema = createInsertSchema(uiWorkflows).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export type InsertUIWorkflow = z.infer<typeof insertUIWorkflowSchema>;
export type UIWorkflow = typeof uiWorkflows.$inferSelect;

// User workflow preferences (favorites, recently used)
export const workflowPreferences = pgTable("workflow_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  favorites: text("favorites").array().default([]), // Array of workflow IDs
  hidden: text("hidden").array().default([]), // Hidden workflow IDs
  customOrder: text("custom_order").array(), // Custom ordering
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkflowPreferencesSchema = createInsertSchema(workflowPreferences).omit({ id: true, updatedAt: true });
export type InsertWorkflowPreferences = z.infer<typeof insertWorkflowPreferencesSchema>;
export type WorkflowPreferences = typeof workflowPreferences.$inferSelect;

// Workflow run history
export const workflowRuns = pgTable("workflow_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  state: jsonb("state").$type<Record<string, any>>().default({}),
  currentStepIndex: integer("current_step_index").default(0),
  completedSteps: text("completed_steps").array().default([]),
  status: text("status").$type<'in_progress' | 'completed' | 'abandoned'>().default('in_progress'),
  outputId: varchar("output_id"), // ID of created source/content
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({ id: true, startedAt: true });
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type WorkflowRun = typeof workflowRuns.$inferSelect;

export const generatedContent = pgTable("generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notebookId: varchar("notebook_id").references(() => notebooks.id, { onDelete: 'cascade' }),
  type: text("type").notNull().$type<'study_guide' | 'briefing_doc' | 'faq' | 'timeline' | 'mindmap' | 'infographic' | 'slides' | 'audio_overview' | 'email'>(),
  title: text("title").notNull(),
  content: jsonb("content").$type<any>().notNull(),
  sourceIds: text("source_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define base schema and then make content required
const baseGeneratedContentSchema = createInsertSchema(generatedContent).omit({ id: true, createdAt: true }).extend({
  type: z.enum(['study_guide', 'briefing_doc', 'faq', 'timeline', 'mindmap', 'infographic', 'slides', 'audio_overview', 'email']),
});
export const insertGeneratedContentSchema = baseGeneratedContentSchema.extend({
  content: z.any(),
});
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;

export interface WorkflowStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'scrape' | 'screenshot' | 'wait' | 'extract' | 'summarize';
  selector?: string;
  value?: string;
  params?: Record<string, any>;
}

export interface A2UIComponent {
  id: string;
  type: 'card' | 'chart' | 'table' | 'list' | 'code' | 'quote' | 'image' | 'accordion' | 'tabs' | 'progress' | 'badge' | 'button' | 'link' | 'mindmap' | 'timeline' | 'slides' | 'audio_transcript' | 'report_suggestion';
  parentId?: string;
  properties: Record<string, any>;
  data?: any;
  children?: any[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  a2uiComponents?: A2UIComponent[];
  timestamp: Date;
}

export type ContentType = 'study_guide' | 'briefing_doc' | 'faq' | 'timeline' | 'mindmap' | 'infographic' | 'slides' | 'audio_overview' | 'audio_lecture' | 'email';
