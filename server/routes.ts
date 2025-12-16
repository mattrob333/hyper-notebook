import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamChat, chat, generateContent, summarizeSource, generateImage, availableModels, getModelsByProvider, DEFAULT_MODEL, type ModelId } from "./ai-service";
import { insertSourceSchema, insertNoteSchema, insertWorkflowSchema, insertNotebookSchema, type ContentType } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { extractText } from "unpdf";
import { Hyperbrowser } from "@hyperbrowser/sdk";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Models endpoint
  app.get("/api/models", (req: Request, res: Response) => {
    res.json({
      models: availableModels,
      byProvider: getModelsByProvider(),
      defaultModel: DEFAULT_MODEL,
    });
  });

  // Notebooks endpoints
  app.get("/api/notebooks", async (req: Request, res: Response) => {
    try {
      const notebooks = await storage.getNotebooks();
      res.json(notebooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notebooks" });
    }
  });

  app.get("/api/notebooks/:id", async (req: Request, res: Response) => {
    try {
      const notebook = await storage.getNotebook(req.params.id);
      if (!notebook) {
        return res.status(404).json({ error: "Notebook not found" });
      }
      res.json(notebook);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notebook" });
    }
  });

  app.post("/api/notebooks", async (req: Request, res: Response) => {
    try {
      const validated = insertNotebookSchema.parse(req.body);
      const notebook = await storage.createNotebook(validated);
      res.status(201).json(notebook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create notebook" });
    }
  });

  app.patch("/api/notebooks/:id", async (req: Request, res: Response) => {
    try {
      const notebook = await storage.updateNotebook(req.params.id, req.body);
      if (!notebook) {
        return res.status(404).json({ error: "Notebook not found" });
      }
      res.json(notebook);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notebook" });
    }
  });

  app.delete("/api/notebooks/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNotebook(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notebook" });
    }
  });

  // Get sources for a specific notebook
  app.get("/api/notebooks/:notebookId/sources", async (req: Request, res: Response) => {
    try {
      const sources = await storage.getSources(req.params.notebookId);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  // Get generated content for a specific notebook
  app.get("/api/notebooks/:notebookId/generated", async (req: Request, res: Response) => {
    try {
      const content = await storage.getGeneratedContent(req.params.notebookId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated content" });
    }
  });

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

  // Audio Overview endpoint using ElevenLabs TTS
  app.post("/api/audio/generate", async (req: Request, res: Response) => {
    try {
      const { text, sourceIds } = req.body;
      
      if (!text && !sourceIds) {
        return res.status(400).json({ error: "Text or sourceIds required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: "ElevenLabs API key not configured",
          message: "Add ELEVENLABS_API_KEY to your .env file"
        });
      }

      // If sourceIds provided, generate a podcast script from sources
      let scriptText = text;
      if (sourceIds && sourceIds.length > 0) {
        const sources = await Promise.all(
          sourceIds.map((id: string) => storage.getSource(id))
        );
        const sourceContent = sources
          .filter(Boolean)
          .map((s: any) => s?.content || '')
          .join('\n\n');

        // Generate podcast script
        const scriptPrompt = `Create a brief, engaging podcast-style summary (2-3 minutes when spoken) based on the following content. 
        
Write it as a natural monologue that:
- Starts with an attention-grabbing hook
- Covers the main points conversationally
- Ends with a memorable takeaway

Content:
${sourceContent.slice(0, 8000)}

Write ONLY the script text, no stage directions or speaker labels.`;

        scriptText = await chat([{ role: 'user', content: scriptPrompt }], {
          model: DEFAULT_MODEL,
          systemPrompt: 'You are a podcast script writer. Write natural, conversational content.',
          maxTokens: 1500,
        });
      }

      // Call ElevenLabs API
      const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - clear, professional voice
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: scriptText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        console.error('[Audio] ElevenLabs error:', errorText);
        return res.status(500).json({ error: "Failed to generate audio" });
      }

      // Return audio as base64 data URL
      const audioBuffer = await elevenLabsResponse.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      res.json({
        audioUrl,
        script: scriptText,
        duration: Math.ceil(scriptText.split(' ').length / 150 * 60), // Estimate duration
      });
    } catch (error) {
      console.error("[Audio] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Hyperbrowser scrape endpoint for deep research
  app.post("/api/scrape", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const apiKey = process.env.HYPERBROWSER_API_KEY;
      
      if (!apiKey) {
        // Fallback to basic fetch if no Hyperbrowser key
        console.log('[Scrape] No Hyperbrowser API key, using basic fetch');
        try {
          const response = await fetch(url);
          const html = await response.text();
          // Extract title from HTML
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
          // Extract text content (basic)
          const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000);
          
          return res.json({
            title,
            content: textContent,
            text: textContent,
            url,
          });
        } catch (fetchError) {
          console.error('[Scrape] Fetch error:', fetchError);
          return res.status(500).json({ error: "Failed to fetch URL" });
        }
      }

      const client = new Hyperbrowser({ apiKey });

      const scrapeResult = await client.scrape.startAndWait({
        url,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        },
      });

      const data = scrapeResult.data as any;
      const title = data?.metadata?.title || new URL(url).hostname;
      const content = data?.markdown || data?.text || "";
      const text = data?.text || data?.markdown || "";

      res.json({
        title,
        content,
        text,
        url,
      });
    } catch (error) {
      console.error("[Scrape] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
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
        model: DEFAULT_MODEL,
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
      const notebookId = req.body.notebookId || null;
      
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

      // Auto-generate a title from the content
      let generatedTitle = fileName;
      try {
        const titleResponse = await chat(
          [{ role: 'user', content: `Based on the following content, generate a short, descriptive title (max 60 characters). Just respond with the title, no quotes or explanation:\n\n${content.slice(0, 2000)}` }],
          { maxTokens: 50, temperature: 0.3 }
        );
        if (titleResponse && titleResponse.trim().length > 0 && titleResponse.trim().length <= 80) {
          generatedTitle = titleResponse.trim().replace(/^["']|["']$/g, '');
        }
      } catch (titleError) {
        console.log('Could not generate title, using filename:', titleError);
      }

      // Create the source
      const source = await storage.createSource({
        type: sourceType,
        name: generatedTitle,
        content: content,
        notebookId: notebookId,
        metadata: { 
          originalName: fileName,
          mimeType: mimeType,
          size: String(file.size)
        }
      });

      // Auto-generate summary in background (don't wait for it)
      (async () => {
        try {
          const summary = await summarizeSource(content);
          if (summary) {
            await storage.updateSource(source.id, { summary });
          }
        } catch (summaryError) {
          console.log('Could not generate summary:', summaryError);
        }
      })();

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
