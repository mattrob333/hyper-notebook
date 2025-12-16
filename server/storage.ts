import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, sources, notes, conversations, messages, workflows, generatedContent,
  type User, type InsertUser,
  type Source, type InsertSource,
  type Note, type InsertNote,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Workflow, type InsertWorkflow,
  type GeneratedContent, type InsertGeneratedContent,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSources(): Promise<Source[]>;
  getSource(id: string): Promise<Source | undefined>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: string, source: Partial<InsertSource>): Promise<Source | undefined>;
  deleteSource(id: string): Promise<boolean>;

  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: string): Promise<boolean>;

  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;

  getGeneratedContent(): Promise<GeneratedContent[]>;
  getGeneratedContentById(id: string): Promise<GeneratedContent | undefined>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  deleteGeneratedContent(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getSources(): Promise<Source[]> {
    return db.select().from(sources).orderBy(sources.createdAt);
  }

  async getSource(id: string): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [created] = await db.insert(sources).values(source).returning();
    return created;
  }

  async updateSource(id: string, source: Partial<InsertSource>): Promise<Source | undefined> {
    const [updated] = await db.update(sources).set(source).where(eq(sources.id, id)).returning();
    return updated;
  }

  async deleteSource(id: string): Promise<boolean> {
    const result = await db.delete(sources).where(eq(sources.id, id));
    return true;
  }

  async getNotes(): Promise<Note[]> {
    return db.select().from(notes).orderBy(notes.createdAt);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [created] = await db.insert(notes).values(note).returning();
    return created;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const [updated] = await db.update(notes).set(note).where(eq(notes.id, id)).returning();
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    await db.delete(notes).where(eq(notes.id, id));
    return true;
  }

  async getConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(conversations.createdAt);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async deleteConversation(id: string): Promise<boolean> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async getWorkflows(): Promise<Workflow[]> {
    return db.select().from(workflows).orderBy(workflows.createdAt);
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [created] = await db.insert(workflows).values(workflow).returning();
    return created;
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updated] = await db.update(workflows).set(workflow).where(eq(workflows.id, id)).returning();
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    await db.delete(workflows).where(eq(workflows.id, id));
    return true;
  }

  async getGeneratedContent(): Promise<GeneratedContent[]> {
    return db.select().from(generatedContent).orderBy(generatedContent.createdAt);
  }

  async getGeneratedContentById(id: string): Promise<GeneratedContent | undefined> {
    const [content] = await db.select().from(generatedContent).where(eq(generatedContent.id, id));
    return content;
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [created] = await db.insert(generatedContent).values(content).returning();
    return created;
  }

  async deleteGeneratedContent(id: string): Promise<boolean> {
    await db.delete(generatedContent).where(eq(generatedContent.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
