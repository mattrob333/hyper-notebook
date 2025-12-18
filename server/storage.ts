import { eq, desc, sql, and, or, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users, sources, notes, conversations, messages, workflows, generatedContent, notebooks, feeds,
  type User, type InsertUser,
  type Source, type InsertSource,
  type Note, type InsertNote,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Workflow, type InsertWorkflow,
  type GeneratedContent, type InsertGeneratedContent,
  type Notebook, type InsertNotebook,
  type Feed, type InsertFeed,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Notebooks
  getNotebooks(userId?: string | null): Promise<Notebook[]>;
  getNotebook(id: string, userId?: string | null): Promise<Notebook | undefined>;
  createNotebook(notebook: InsertNotebook, userId?: string | null): Promise<Notebook>;
  updateNotebook(id: string, notebook: Partial<InsertNotebook>, userId?: string | null): Promise<Notebook | undefined>;
  deleteNotebook(id: string, userId?: string | null): Promise<boolean>;
  claimUnclaimedNotebooks(userId: string): Promise<number>;

  getSources(notebookId?: string): Promise<Source[]>;
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

  // Feeds
  getFeeds(notebookId?: string): Promise<Feed[]>;
  getFeed(id: string): Promise<Feed | undefined>;
  createFeed(feed: InsertFeed): Promise<Feed>;
  updateFeed(id: string, feed: Partial<InsertFeed>): Promise<Feed | undefined>;
  deleteFeed(id: string): Promise<boolean>;
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

  // Notebooks
  async getNotebooks(userId?: string | null): Promise<Notebook[]> {
    // If userId provided, get user's notebooks + shared notebooks (null userId)
    // If no userId (dev mode), get all notebooks
    if (userId) {
      return db.select().from(notebooks)
        .where(or(eq(notebooks.userId, userId), isNull(notebooks.userId)))
        .orderBy(desc(notebooks.updatedAt));
    }
    return db.select().from(notebooks).orderBy(desc(notebooks.updatedAt));
  }

  async getNotebook(id: string, userId?: string | null): Promise<Notebook | undefined> {
    if (userId) {
      const [notebook] = await db.select().from(notebooks)
        .where(and(eq(notebooks.id, id), or(eq(notebooks.userId, userId), isNull(notebooks.userId))));
      return notebook;
    }
    const [notebook] = await db.select().from(notebooks).where(eq(notebooks.id, id));
    return notebook;
  }

  async createNotebook(notebook: InsertNotebook, userId?: string | null): Promise<Notebook> {
    const [created] = await db.insert(notebooks).values({ ...notebook, userId: userId || null } as any).returning();
    return created;
  }

  async updateNotebook(id: string, notebook: Partial<InsertNotebook>, userId?: string | null): Promise<Notebook | undefined> {
    const whereClause = userId 
      ? and(eq(notebooks.id, id), or(eq(notebooks.userId, userId), isNull(notebooks.userId)))
      : eq(notebooks.id, id);
    const [updated] = await db.update(notebooks)
      .set({ ...notebook, updatedAt: new Date() } as any)
      .where(whereClause)
      .returning();
    return updated;
  }

  async deleteNotebook(id: string, userId?: string | null): Promise<boolean> {
    const whereClause = userId 
      ? and(eq(notebooks.id, id), eq(notebooks.userId, userId)) // Can only delete own notebooks
      : eq(notebooks.id, id);
    await db.delete(notebooks).where(whereClause);
    return true;
  }

  async claimUnclaimedNotebooks(userId: string): Promise<number> {
    // Update all notebooks with null userId to belong to this user
    const result = await db.update(notebooks)
      .set({ userId, updatedAt: new Date() })
      .where(isNull(notebooks.userId))
      .returning();
    return result.length;
  }

  async updateNotebookSourceCount(notebookId: string): Promise<void> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));
    await db.update(notebooks)
      .set({ sourceCount: result?.count || 0, updatedAt: new Date() })
      .where(eq(notebooks.id, notebookId));
  }

  async getSources(notebookId?: string): Promise<Source[]> {
    if (notebookId) {
      return db.select().from(sources).where(eq(sources.notebookId, notebookId)).orderBy(sources.createdAt);
    }
    return db.select().from(sources).orderBy(sources.createdAt);
  }

  async getSource(id: string): Promise<Source | undefined> {
    const [source] = await db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [created] = await db.insert(sources).values(source).returning();
    // Update notebook source count if notebookId is provided
    if (source.notebookId) {
      await this.updateNotebookSourceCount(source.notebookId);
    }
    return created;
  }

  async updateSource(id: string, source: Partial<InsertSource>): Promise<Source | undefined> {
    const [updated] = await db.update(sources).set(source).where(eq(sources.id, id)).returning();
    return updated;
  }

  async deleteSource(id: string): Promise<boolean> {
    // Get the source first to get notebookId
    const source = await this.getSource(id);
    await db.delete(sources).where(eq(sources.id, id));
    // Update notebook source count if it belonged to a notebook
    if (source?.notebookId) {
      await this.updateNotebookSourceCount(source.notebookId);
    }
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

  async getGeneratedContent(notebookId?: string): Promise<GeneratedContent[]> {
    if (notebookId) {
      return db.select().from(generatedContent).where(eq(generatedContent.notebookId, notebookId)).orderBy(generatedContent.createdAt);
    }
    return db.select().from(generatedContent).orderBy(generatedContent.createdAt);
  }

  async getGeneratedContentById(id: string): Promise<GeneratedContent | undefined> {
    const [content] = await db.select().from(generatedContent).where(eq(generatedContent.id, id));
    return content;
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [created] = await db.insert(generatedContent).values(content as any).returning();
    return created;
  }

  async deleteGeneratedContent(id: string): Promise<boolean> {
    await db.delete(generatedContent).where(eq(generatedContent.id, id));
    return true;
  }

  // Feeds
  async getFeeds(notebookId?: string): Promise<Feed[]> {
    if (notebookId) {
      return db.select().from(feeds).where(eq(feeds.notebookId, notebookId)).orderBy(desc(feeds.createdAt));
    }
    return db.select().from(feeds).orderBy(desc(feeds.createdAt));
  }

  async getFeed(id: string): Promise<Feed | undefined> {
    const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
    return feed;
  }

  async createFeed(feed: InsertFeed): Promise<Feed> {
    const [created] = await db.insert(feeds).values(feed).returning();
    return created;
  }

  async updateFeed(id: string, feed: Partial<InsertFeed>): Promise<Feed | undefined> {
    const [updated] = await db.update(feeds).set(feed).where(eq(feeds.id, id)).returning();
    return updated;
  }

  async deleteFeed(id: string): Promise<boolean> {
    await db.delete(feeds).where(eq(feeds.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
