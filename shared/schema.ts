import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb } from "drizzle-orm/pg-core";
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

export interface Source {
  id: string;
  type: 'url' | 'pdf' | 'text';
  content: string;
  name: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  action: 'scrape' | 'summarize' | 'generate_mindmap' | 'generate_ui';
  params: Record<string, any>;
}

export interface A2UIComponent {
  id: string;
  type: string;
  parentId?: string;
  properties: Record<string, any>;
  data?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  a2uiComponents?: A2UIComponent[];
  timestamp: Date;
}

export const insertSourceSchema = z.object({
  type: z.enum(['url', 'pdf', 'text']),
  content: z.string(),
  name: z.string(),
});

export type InsertSource = z.infer<typeof insertSourceSchema>;

export const insertWorkflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    action: z.enum(['scrape', 'summarize', 'generate_mindmap', 'generate_ui']),
    params: z.record(z.any()),
  })),
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
