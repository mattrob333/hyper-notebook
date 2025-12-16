import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamChat, chat, generateContent, summarizeSource, generateImage, type ModelId } from "./ai-service";
import { insertSourceSchema, insertNoteSchema, insertWorkflowSchema, type ContentType } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { extractText } from "unpdf";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/sources", async (req: Request, res: Response) => {
    try {
      const sources = await storage.getSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.get("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      const source = await storage.getSource(req.params.id);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      res.json(source);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch source" });
    }
  });

  app.post("/api/sources", async (req: Request, res: Response) => {
    try {
      const validated = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(validated);
      res.status(201).json(source);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create source" });
    }
  });

  app.post("/api/sources/:id/summarize", async (req: Request, res: Response) => {
    try {
      const source = await storage.getSource(req.params.id);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      const summary = await summarizeSource(source.content, { model: req.body.model });
      await storage.updateSource(req.params.id, { summary });
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: "Failed to summarize source" });
    }
  });

  app.delete("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteSource(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete source" });
    }
  });

  // Fetch URL metadata (title, description) for better source names
  app.post("/api/url/metadata", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL" });
      }

      // Fetch the page to extract metadata
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NotebookBot/1.0)',
          },
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // Extract title
        let title = parsedUrl.hostname;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
        
        // Extract description
        let description = '';
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        if (descMatch) {
          description = descMatch[1].trim();
        }
        
        // Extract OG title if regular title is generic
        if (title === parsedUrl.hostname) {
          const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
          if (ogTitleMatch) {
            title = ogTitleMatch[1].trim();
          }
        }
        
        res.json({ title, description, url });
      } catch (fetchErr) {
        // Return hostname as fallback
        res.json({ 
          title: parsedUrl.hostname, 
          description: '', 
          url 
        });
      }
    } catch (error) {
      console.error('Metadata fetch error:', error);
      res.status(500).json({ error: "Failed to fetch URL metadata" });
    }
  });

  // Web search endpoint for finding sources
  app.post("/api/search/web", async (req: Request, res: Response) => {
    try {
      const { query, type = 'web', mode = 'fast' } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      // Use AI to generate simulated search results based on the query
      // In production, this would integrate with a real search API like Serper, Tavily, or SerpAPI
      const searchPrompt = `Generate 5 realistic web search results for the query: "${query}". 
      Search type: ${type}
      
      Return a JSON array with exactly 5 results. Each result should have:
      - title: A realistic, descriptive page title
      - url: A realistic URL from real websites
      - description: A 1-2 sentence snippet describing the content
      
      Return ONLY valid JSON array, no other text. Example format:
      [{"title": "Example Title", "url": "https://example.com/page", "description": "Description here"}]`;

      const response = await chat([{ role: 'user', content: searchPrompt }], {
        model: 'gpt-4.1',
        systemPrompt: 'You are a search results generator. Return only valid JSON arrays.',
      });

      let results = [];
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error('Failed to parse search results:', parseErr);
        results = [];
      }

      res.json({ results });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/sources/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const fileName = file.originalname;
      const mimeType = file.mimetype;
      
      const allowedMimeTypes = ['application/pdf', 'text/plain', 'text/markdown'];
      const allowedExtensions = ['.pdf', '.txt', '.md'];
      const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
      
      if (!allowedMimeTypes.includes(mimeType) && !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF, TXT, or Markdown files." });
      }
      
      let content = '';
      let sourceType: 'pdf' | 'text' = 'text';

      if (mimeType === 'application/pdf') {
        sourceType = 'pdf';
        try {
          const pdfData = await extractText(file.buffer);
          const textArray = pdfData.text;
          content = Array.isArray(textArray) ? textArray.join('\n') : String(textArray || '');
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);
          return res.status(400).json({ error: "Failed to extract text from PDF" });
        }
      } else if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        content = file.buffer.toString('utf-8');
      } else {
        content = file.buffer.toString('utf-8');
      }

      if (!content.trim()) {
        return res.status(400).json({ error: "Could not extract content from file" });
      }

      const source = await storage.createSource({
        type: sourceType,
        name: fileName,
        content: content,
        metadata: { 
          originalName: fileName,
          mimeType: mimeType,
          size: String(file.size)
        } as Record<string, unknown>
      });

      res.status(201).json(source);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/notes", async (req: Request, res: Response) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req: Request, res: Response) => {
    try {
      const validated = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validated);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages, model, conversationId, systemPrompt } = req.body;
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      
      for await (const token of streamChat(messages, { 
        model: model as ModelId,
        systemPrompt: systemPrompt || "You are a helpful research assistant. When appropriate, format your responses with structured data that can be rendered as interactive components."
      })) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token, type: "token" })}\n\n`);
      }

      if (conversationId) {
        await storage.createMessage({
          conversationId,
          role: "user",
          content: messages[messages.length - 1].content,
        });
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
        });
      }

      res.write(`data: ${JSON.stringify({ type: "done", content: fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  app.post("/api/chat/simple", async (req: Request, res: Response) => {
    try {
      const { messages, model, systemPrompt } = req.body;
      const response = await chat(messages, { 
        model: model as ModelId,
        systemPrompt
      });
      res.json({ content: response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const { type, sourceIds, model, customPrompt } = req.body;
      
      const sources = await Promise.all(
        (sourceIds || []).map((id: string) => storage.getSource(id))
      );
      const sourceContents = sources.filter(Boolean).map(s => s!.content);
      
      if (sourceContents.length === 0 && !customPrompt) {
        return res.status(400).json({ error: "No sources or custom prompt provided" });
      }
      
      const content = await generateContent(
        type as ContentType,
        sourceContents,
        { model: model as ModelId, customPrompt }
      );

      const generated = await storage.createGeneratedContent({
        type,
        title: `${type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} - ${new Date().toLocaleDateString()}`,
        content,
        sourceIds: sourceIds || [],
      });

      res.json(generated);
    } catch (error) {
      console.error("Generate error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  app.get("/api/generated", async (req: Request, res: Response) => {
    try {
      const content = await storage.getGeneratedContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated content" });
    }
  });

  app.get("/api/generated/:id", async (req: Request, res: Response) => {
    try {
      const content = await storage.getGeneratedContentById(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.delete("/api/generated/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteGeneratedContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  app.post("/api/images/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, size } = req.body;
      const imageBase64 = await generateImage(prompt, { size });
      res.json({ image: imageBase64 });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.get("/api/workflows", async (req: Request, res: Response) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", async (req: Request, res: Response) => {
    try {
      const validated = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validated);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create workflow" });
    }
  });

  app.patch("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  return httpServer;
}
