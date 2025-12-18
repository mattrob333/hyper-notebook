import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamChat, chat, generateContent, summarizeSource, generateImage, availableModels, getModelsByProvider, DEFAULT_MODEL, type ModelId } from "./ai-service";
import { insertSourceSchema, insertNoteSchema, insertWorkflowSchema, insertNotebookSchema, sources, type ContentType, type SpreadsheetContent } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { extractText } from "unpdf";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { getWorkflowByTrigger } from "./workflows";
import Papa from "papaparse";
import { getUserId, authRequired } from "./auth";

// Auto-detect column types from headers
function detectColumns(headers: string[]): SpreadsheetContent['detectedColumns'] {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  // More flexible matching - find columns that contain these keywords
  const findColumn = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const idx = lowerHeaders.findIndex(h => pattern.test(h));
      if (idx !== -1) return headers[idx];
    }
    return undefined;
  };
  
  return {
    email: findColumn([/email/, /e-mail/, /mail/]),
    name: findColumn([/^name$/, /^name\s/, /\sname$/, /full.?name/, /contact.?name/, /respondent/]),
    firstName: findColumn([/first.?name/, /fname/, /given.?name/]),
    lastName: findColumn([/last.?name/, /lname/, /surname/, /family.?name/]),
    company: findColumn([/company/, /organization/, /org/, /business/, /employer/]),
    title: findColumn([/title/, /role/, /position/, /job.?title/]),
    phone: findColumn([/phone/, /tel/, /mobile/, /cell/]),
  };
}

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
      const userId = getUserId(req);
      const notebooks = await storage.getNotebooks(userId);
      res.json(notebooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notebooks" });
    }
  });

  app.get("/api/notebooks/:id", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const notebook = await storage.getNotebook(req.params.id, userId);
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
      const userId = getUserId(req);
      const validated = insertNotebookSchema.parse(req.body);
      const notebook = await storage.createNotebook(validated, userId);
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
      const userId = getUserId(req);
      const notebook = await storage.updateNotebook(req.params.id, req.body, userId);
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
      const userId = getUserId(req);
      await storage.deleteNotebook(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notebook" });
    }
  });

  // Claim unclaimed notebooks (migrate notebooks with null userId to current user)
  app.post("/api/notebooks/claim", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId || userId === 'dev-user') {
        return res.status(401).json({ error: "Must be signed in to claim notebooks" });
      }
      const claimed = await storage.claimUnclaimedNotebooks(userId);
      res.json({ claimed });
    } catch (error) {
      res.status(500).json({ error: "Failed to claim notebooks" });
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

  // Feeds API
  app.get("/api/feeds", async (req: Request, res: Response) => {
    try {
      const notebookId = req.query.notebookId as string | undefined;
      const feedsList = await storage.getFeeds(notebookId);
      res.json(feedsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feeds" });
    }
  });

  app.get("/api/notebooks/:notebookId/feeds", async (req: Request, res: Response) => {
    try {
      const feedsList = await storage.getFeeds(req.params.notebookId);
      res.json(feedsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feeds" });
    }
  });

  app.post("/api/feeds", async (req: Request, res: Response) => {
    try {
      const feed = await storage.createFeed(req.body);
      res.status(201).json(feed);
    } catch (error) {
      console.error('[Create Feed] Error:', error);
      res.status(500).json({ error: "Failed to create feed" });
    }
  });

  app.delete("/api/feeds/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteFeed(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feed" });
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

      let contentToSummarize = source.content;

      // For URL sources, fetch the actual content using Firecrawl
      if (source.type === 'url') {
        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        const url = source.content;

        if (firecrawlKey) {
          console.log('[Summarize] Fetching URL content via Firecrawl:', url);
          try {
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firecrawlKey}`,
              },
              body: JSON.stringify({
                url,
                formats: ['markdown'],
                onlyMainContent: true,
              }),
            });

            if (scrapeResponse.ok) {
              const scrapeResult = await scrapeResponse.json();
              if (scrapeResult.success && scrapeResult.data?.markdown) {
                contentToSummarize = scrapeResult.data.markdown;
                // Also update the source content with the scraped data
                await storage.updateSource(req.params.id, { 
                  content: contentToSummarize.slice(0, 50000) // Limit stored content
                });
              }
            }
          } catch (scrapeError) {
            console.error('[Summarize] Firecrawl error:', scrapeError);
          }
        } else {
          // Fallback to basic fetch
          try {
            const response = await fetch(url);
            const html = await response.text();
            contentToSummarize = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000);
          } catch (fetchError) {
            console.error('[Summarize] Fetch error:', fetchError);
          }
        }
      }

      const summary = await summarizeSource(contentToSummarize, { model: req.body.model });
      await storage.updateSource(req.params.id, { summary });
      res.json({ summary });
    } catch (error) {
      console.error('[Summarize] Error:', error);
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

  app.patch("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      const { category, summary, content, name } = req.body;
      const updates: Record<string, any> = {};
      
      if (category) updates.category = category;
      if (summary !== undefined) updates.summary = summary;
      if (content !== undefined) updates.content = content;
      if (name !== undefined) updates.name = name;
      
      await storage.updateSource(req.params.id, updates);
      const updated = await storage.getSource(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error('[PATCH Source] Error:', error);
      res.status(500).json({ error: "Failed to update source" });
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

  // Firecrawl fast scrape endpoint
  app.post("/api/firecrawl-scrape", async (req: Request, res: Response) => {
    try {
      const { url, formats = ['markdown'] } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        console.log('[Firecrawl] No API key, falling back to Hyperbrowser/fetch');
        // Redirect to the regular scrape endpoint
        return res.redirect(307, '/api/scrape');
      }

      console.log('[Firecrawl] Scraping:', url);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats,
          onlyMainContent: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Firecrawl] API error:', response.status, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Firecrawl scrape failed');
      }

      const data = result.data;
      const title = data?.metadata?.title || new URL(url).hostname;
      const content = data?.markdown || data?.content || "";

      res.json({
        title,
        content,
        text: content,
        url,
        metadata: data?.metadata,
      });
    } catch (error) {
      console.error("[Firecrawl] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Firecrawl Search endpoint - web search with content
  app.post("/api/firecrawl-search", async (req: Request, res: Response) => {
    try {
      const { query, limit = 5 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Firecrawl API key not configured" });
      }

      console.log('[Firecrawl Search] Query:', query);
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          limit,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Firecrawl Search] API error:', response.status, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      
      res.json({
        success: true,
        results: result.data || [],
        query,
      });
    } catch (error) {
      console.error("[Firecrawl Search] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Firecrawl Crawl endpoint - crawl multiple pages from a site
  app.post("/api/firecrawl-crawl", async (req: Request, res: Response) => {
    try {
      const { url, limit = 10, maxDepth = 2 } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Firecrawl API key not configured" });
      }

      console.log('[Firecrawl Crawl] URL:', url);
      
      const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          limit,
          maxDiscoveryDepth: maxDepth,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Firecrawl Crawl] API error:', response.status, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Crawl returns a job ID - we need to poll for results
      res.json({
        success: true,
        jobId: result.id,
        status: result.status,
        message: "Crawl job started. Use /api/firecrawl-crawl-status to check progress.",
      });
    } catch (error) {
      console.error("[Firecrawl Crawl] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Firecrawl Crawl Status endpoint
  app.get("/api/firecrawl-crawl-status/:jobId", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Firecrawl API key not configured" });
      }

      const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      
      res.json(result);
    } catch (error) {
      console.error("[Firecrawl Crawl Status] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Firecrawl Extract endpoint - extract structured data
  app.post("/api/firecrawl-extract", async (req: Request, res: Response) => {
    try {
      const { urls, prompt, schema } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "URLs array is required" });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Firecrawl API key not configured" });
      }

      console.log('[Firecrawl Extract] URLs:', urls);
      
      const response = await fetch('https://api.firecrawl.dev/v1/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          urls,
          prompt: prompt || "Extract the main content and key information from this page",
          schema: schema || {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              mainContent: { type: "string" },
              keyPoints: { type: "array", items: { type: "string" } },
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Firecrawl Extract] API error:', response.status, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      
      res.json({
        success: true,
        data: result.data || result,
      });
    } catch (error) {
      console.error("[Firecrawl Extract] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // RSS Feed Discovery endpoint - extracts RSS feed links from a website
  app.post("/api/discover-rss", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Firecrawl API key not configured" });
      }

      console.log('[RSS Discovery] URL:', url);
      
      // Scrape the page and look for RSS/Atom feed links
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'links'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const result = await response.json();
      const html = result.data?.html || '';
      const links = result.data?.links || [];
      
      // Extract RSS/Atom feed URLs from link tags and common patterns
      const feedPatterns = [
        /href=["']([^"']*(?:rss|feed|atom)[^"']*)["']/gi,
        /href=["']([^"']*\.xml)["']/gi,
        /href=["']([^"']*\/feed\/?)["']/gi,
      ];
      
      const feedUrls = new Set<string>();
      
      // Check link tags for RSS
      const linkTagRegex = /<link[^>]*type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = linkTagRegex.exec(html)) !== null) {
        feedUrls.add(match[2]);
      }
      
      // Also check alternate link format
      const altLinkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/(rss|atom)\+xml["'][^>]*>/gi;
      while ((match = altLinkRegex.exec(html)) !== null) {
        feedUrls.add(match[1]);
      }
      
      // Check links array for common feed patterns
      for (const link of links) {
        const linkUrl = typeof link === 'string' ? link : link.url;
        if (linkUrl && (
          linkUrl.includes('/rss') ||
          linkUrl.includes('/feed') ||
          linkUrl.includes('/atom') ||
          linkUrl.endsWith('.xml') ||
          linkUrl.includes('feeds.')
        )) {
          feedUrls.add(linkUrl);
        }
      }
      
      // Resolve relative URLs
      const baseUrl = new URL(url);
      const resolvedFeeds = Array.from(feedUrls).map(feedUrl => {
        try {
          return new URL(feedUrl, baseUrl).href;
        } catch {
          return feedUrl;
        }
      });
      
      res.json({
        success: true,
        feeds: resolvedFeeds,
        sourceUrl: url,
      });
    } catch (error) {
      console.error("[RSS Discovery] Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  // Refresh feeds endpoint - scrapes all feed-category sources
  app.post("/api/refresh-feeds", async (req: Request, res: Response) => {
    try {
      const { notebookId } = req.body;
      
      if (!notebookId) {
        return res.status(400).json({ error: "notebookId is required" });
      }

      // Get all feed sources for this notebook
      const feedSources = await db.select()
        .from(sources)
        .where(and(
          eq(sources.notebookId, notebookId),
          eq(sources.category, 'feed')
        ));

      if (feedSources.length === 0) {
        return res.json({ 
          message: "No feed sources found",
          results: [],
          digest: null 
        });
      }

      console.log(`[RefreshFeeds] Scraping ${feedSources.length} feed sources`);

      // Scrape all feeds in parallel
      const firecrawlKey = process.env.FIRECRAWL_API_KEY;
      const scrapePromises = feedSources
        .filter(source => source.type === 'url')
        .map(async (source) => {
          try {
            let content = '';
            let title = source.name;

            if (firecrawlKey) {
              // Use Firecrawl for fast scraping
              const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${firecrawlKey}`,
                },
                body: JSON.stringify({
                  url: source.content,
                  formats: ['markdown'],
                  onlyMainContent: true,
                }),
              });

              if (response.ok) {
                const result = await response.json();
                if (result.success) {
                  content = result.data?.markdown || '';
                  title = result.data?.metadata?.title || source.name;
                }
              }
            } else {
              // Fallback to basic fetch
              const response = await fetch(source.content);
              const html = await response.text();
              content = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
            }

            return {
              id: source.id,
              name: title,
              url: source.content,
              content: content.slice(0, 3000), // Limit content size
              success: true,
            };
          } catch (err) {
            console.error(`[RefreshFeeds] Error scraping ${source.name}:`, err);
            return {
              id: source.id,
              name: source.name,
              url: source.content,
              content: '',
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            };
          }
        });

      const results = await Promise.all(scrapePromises);
      const successfulResults = results.filter(r => r.success && r.content);

      // Generate AI digest if we have content
      let digest = null;
      if (successfulResults.length > 0) {
        const combinedContent = successfulResults
          .map(r => `## ${r.name}\nSource: ${r.url}\n\n${r.content}`)
          .join('\n\n---\n\n');

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (apiKey) {
          try {
            const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "anthropic/claude-3.5-sonnet",
                messages: [
                  {
                    role: "system",
                    content: "You are a news digest assistant. Summarize the following articles into a concise news digest with key highlights and takeaways. Format with clear sections and bullet points."
                  },
                  {
                    role: "user",
                    content: `Create a news digest from these ${successfulResults.length} sources:\n\n${combinedContent}`
                  }
                ],
                max_tokens: 2000,
              }),
            });

            if (aiResponse.ok) {
              const aiResult = await aiResponse.json();
              digest = aiResult.choices?.[0]?.message?.content || null;
            }
          } catch (aiError) {
            console.error('[RefreshFeeds] AI digest error:', aiError);
          }
        }
      }

      res.json({
        message: `Refreshed ${successfulResults.length} of ${feedSources.length} feeds`,
        results,
        digest,
      });
    } catch (error) {
      console.error("[RefreshFeeds] Error:", error);
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
      
      const allowedMimeTypes = ['application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/vnd.ms-excel'];
      const allowedExtensions = ['.pdf', '.txt', '.md', '.csv'];
      const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
      
      if (!allowedMimeTypes.includes(mimeType) && !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF, TXT, Markdown, or CSV files." });
      }
      
      let content = '';
      let sourceType: 'pdf' | 'text' | 'csv' = 'text';

      // Handle CSV files
      if (fileExtension === '.csv' || mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') {
        sourceType = 'csv';
        try {
          const csvText = file.buffer.toString('utf-8');
          const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
          });
          
          if (parseResult.errors.length > 0) {
            console.warn('CSV parse warnings:', parseResult.errors);
          }
          
          const headers = parseResult.meta.fields || [];
          const rows = parseResult.data as Record<string, string>[];
          
          // Limit to 5000 rows
          const MAX_ROWS = 5000;
          if (rows.length > MAX_ROWS) {
            return res.status(400).json({ 
              error: `CSV file too large. Maximum ${MAX_ROWS} rows allowed. Your file has ${rows.length} rows.` 
            });
          }
          
          const spreadsheetContent: SpreadsheetContent = {
            type: 'spreadsheet',
            headers,
            rows: rows.slice(0, MAX_ROWS),
            rowCount: Math.min(rows.length, MAX_ROWS),
            fileName,
            detectedColumns: detectColumns(headers),
          };
          
          content = JSON.stringify(spreadsheetContent);
        } catch (csvError) {
          console.error('CSV parsing error:', csvError);
          return res.status(400).json({ error: "Failed to parse CSV file" });
        }
      } else if (mimeType === 'application/pdf') {
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

      // Auto-generate a title from the content (skip for CSV - use filename)
      let generatedTitle = fileName;
      if (sourceType !== 'csv') {
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
      } else {
        // For CSV, create a descriptive title
        try {
          const parsed = JSON.parse(content) as SpreadsheetContent;
          generatedTitle = `${fileName.replace('.csv', '')} (${parsed.rowCount} rows)`;
        } catch {
          generatedTitle = fileName;
        }
      }

      // Create the source
      const source = await storage.createSource({
        type: sourceType,
        category: 'context',
        name: generatedTitle,
        content: content,
        notebookId: notebookId,
        metadata: { 
          originalName: fileName,
          mimeType: mimeType,
          size: String(file.size)
        }
      });

      // Auto-generate summary in background (skip for CSV files)
      if (sourceType !== 'csv') {
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
      }

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
      const { messages, model, conversationId, systemPrompt, sources, sourceSummaries, selectedLead } = req.body;
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      
      // Check if this is a workflow trigger
      const lastMessage = messages[messages.length - 1]?.content || '';
      const workflow = getWorkflowByTrigger(lastMessage);
      
      // Build selected lead context if provided
      let leadContextSection = '';
      if (selectedLead) {
        leadContextSection = `\n\n## Selected Lead\n\nThe user has selected a lead from their contacts. Use this information when they ask about "this lead", "this person", "them", or request emails/research:\n\n`;
        leadContextSection += `- **Name:** ${selectedLead.name || 'Unknown'}\n`;
        leadContextSection += `- **Email:** ${selectedLead.email || 'Not provided'}\n`;
        if (selectedLead.company) {
          leadContextSection += `- **Company:** ${selectedLead.company}\n`;
        }
        if (selectedLead.data && Object.keys(selectedLead.data).length > 0) {
          leadContextSection += `- **Additional Info:**\n`;
          Object.entries(selectedLead.data).forEach(([key, value]) => {
            if (value && key !== 'name' && key !== 'email' && key !== 'company') {
              leadContextSection += `  - ${key}: ${value}\n`;
            }
          });
        }
        leadContextSection += `\nWhen writing emails to this lead, address them by name and use their email address: ${selectedLead.email}\n`;
      }
      
      // Build source context section if sources are provided
      let sourceContextSection = '';
      if (sources && sources.length > 0) {
        sourceContextSection = `\n\n## Available Sources\n\nThe user has provided the following sources for context. Use this information to answer their questions:\n\n`;
        sources.forEach((source: { name: string; type: string; content?: string; summary?: string }, idx: number) => {
          sourceContextSection += `### Source ${idx + 1}: ${source.name}\n`;
          sourceContextSection += `- **Type:** ${source.type}\n`;
          if (source.summary) {
            sourceContextSection += `- **Summary:** ${source.summary}\n`;
          }
          if (source.content) {
            sourceContextSection += `- **Content:**\n\`\`\`\n${source.content.slice(0, 3000)}${source.content.length > 3000 ? '\n...(truncated)' : ''}\n\`\`\`\n`;
          }
          sourceContextSection += '\n';
        });
      }
      
      // Use workflow system prompt if detected, otherwise default
      let finalSystemPrompt: string;
      
      if (workflow) {
        // Workflow-specific prompt with lead and source context appended
        finalSystemPrompt = workflow.systemPrompt + leadContextSection + sourceContextSection;
      } else if (systemPrompt) {
        finalSystemPrompt = systemPrompt;
      } else {
        finalSystemPrompt = `You are a helpful research assistant. When appropriate, format your responses with markdown for readability.

## Your Role

You help users analyze and work with their sources. When the user asks about their sources:
- Read and understand the source content provided below
- Synthesize information across multiple sources
- Create summaries, newsletters, reports, or other content based on the sources
- Answer questions using the source material

## Report Creation

When the user asks you to create a report, article, blog post, or other formatted content, you have two options:

1. **Write it directly** in the chat for quick previews
2. **Suggest opening the Report Editor** for full editing capabilities

When the user wants to create content like:
- Blog posts, articles, or thought leadership pieces
- LinkedIn posts or Twitter threads
- Executive summaries or briefing documents
- Case studies or whitepapers
- Newsletters or email content

You can suggest they use the Reports feature in Studio by including this A2UI component in your response:

\`\`\`json
{
  "type": "report_suggestion",
  "properties": {
    "format": "LinkedIn Article",
    "description": "from this research",
    "showPreview": true,
    "showEditor": true
  }
}
\`\`\`

Available report formats: Briefing Doc, Blog Post, LinkedIn Article, Twitter Thread, Executive Summary, Case Study, Newsletter, Whitepaper, Strategic Plan, Technical Spec

## Response Format

- Use markdown formatting (headers, bold, lists, etc.)
- Structure long responses with clear sections
- When creating newsletters or content, use professional formatting
- Cite which sources you're drawing from when relevant${leadContextSection}${sourceContextSection}`;
      }

      for await (const token of streamChat(messages, { 
        model: model as ModelId,
        systemPrompt: finalSystemPrompt
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
      
      let content = await generateContent(
        type as ContentType,
        sourceContents,
        { model: model as ModelId, customPrompt }
      );

      console.log('[Generate] Type:', type, 'Content keys:', Object.keys(content || {}));

      // For audio_overview, also generate actual audio via ElevenLabs
      if (type === 'audio_overview') {
        console.log('[Audio] Content has segments:', !!content?.segments, 'Is array:', Array.isArray(content));
        // Handle case where content IS the segments array directly
        if (Array.isArray(content)) {
          content = { segments: content };
        }
      }
      
      if (type === 'audio_overview' && content.segments) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        console.log('[Audio] Checking ElevenLabs - API key exists:', !!apiKey, 'Segments:', content.segments?.length);
        
        if (apiKey) {
          try {
            console.log('[Audio] Starting ElevenLabs audio generation...');
            // Combine all segment text for TTS
            const fullScript = content.segments
              .map((seg: any) => `${seg.speaker}: ${seg.text}`)
              .join('\n\n');
            
            // Use two different voices for the two hosts
            const voice1Id = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
            const voice2Id = '21m00Tcm4TlvDq8ikWAM'; // Rachel
            
            // Generate audio for each segment or use a single voice for simplicity
            const elevenLabsResponse = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voice1Id}`,
              {
                method: 'POST',
                headers: {
                  'Accept': 'audio/mpeg',
                  'Content-Type': 'application/json',
                  'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                  text: fullScript.slice(0, 5000), // ElevenLabs has limits
                  model_id: 'eleven_turbo_v2_5',
                  voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                  },
                }),
              }
            );

            if (elevenLabsResponse.ok) {
              const audioBuffer = await elevenLabsResponse.arrayBuffer();
              const base64Audio = Buffer.from(audioBuffer).toString('base64');
              content.audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
              console.log('[Audio] Generated audio for audio_overview');
            } else {
              console.error('[Audio] ElevenLabs error:', await elevenLabsResponse.text());
            }
          } catch (audioError) {
            console.error('[Audio] Failed to generate audio:', audioError);
            // Continue without audio - transcript still works
          }
        } else {
          console.log('[Audio] No ELEVENLABS_API_KEY configured, skipping audio generation');
        }
      }

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

  // Save workflow-generated content directly
  app.post("/api/generated/save", async (req: Request, res: Response) => {
    try {
      const { type, title, content, sourceIds, metadata } = req.body;
      
      const generated = await storage.createGeneratedContent({
        type: type || 'workflow_content',
        title: title || `Generated Content - ${new Date().toLocaleDateString()}`,
        content: content,
        sourceIds: sourceIds || [],
      });

      res.json(generated);
    } catch (error) {
      console.error("Save generated content error:", error);
      res.status(500).json({ error: "Failed to save generated content" });
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

  // AI Rewrite endpoint for report editing
  app.post("/api/ai/rewrite", async (req: Request, res: Response) => {
    try {
      const { text, prompt } = req.body;
      
      if (!text || !prompt) {
        return res.status(400).json({ error: "Text and prompt are required" });
      }

      const systemPrompt = `You are a professional editor working with a rich text editor. Rewrite the following text according to the user's instructions.

CRITICAL: Return the text as clean HTML, NOT markdown. Use these HTML tags:
- <h1>, <h2>, <h3> for headings
- <strong> for bold text
- <em> for italic text
- <ul><li> for bullet lists
- <ol><li> for numbered lists
- <p> for paragraphs
- <blockquote> for quotes

Only output the rewritten HTML content, nothing else. Do not include explanations, commentary, or markdown syntax like # or **.`;

      const userPrompt = `Instructions: ${prompt}

Text to rewrite:
${text}`;

      const rewritten = await chat([{ role: 'user', content: userPrompt }], {
        model: DEFAULT_MODEL,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      res.json({ rewritten: rewritten || text });
    } catch (error: any) {
      console.error("AI rewrite error:", error);
      res.status(500).json({ error: error.message || "Failed to rewrite text" });
    }
  });

  // Source analyzer for dynamic report suggestions
  app.post("/api/reports/analyze-sources", async (req: Request, res: Response) => {
    try {
      const { sourceIds } = req.body;
      
      if (!sourceIds || sourceIds.length === 0) {
        return res.json({ suggestions: [] });
      }

      // Get sources
      const allSources = await storage.getSources();
      const sourcesToAnalyze = allSources.filter((s: any) => sourceIds.includes(s.id));
      
      if (sourcesToAnalyze.length === 0) {
        return res.json({ suggestions: [] });
      }

      // Combine source content for analysis (limit to first 3000 chars each)
      const combinedContent = sourcesToAnalyze
        .map((s: any) => `[${s.name}]: ${s.content?.substring(0, 3000) || ''}`)
        .join('\n\n');

      const systemPrompt = `Analyze the provided source content and suggest the most appropriate report formats.
Return a JSON array of suggestions, each with:
- id: unique identifier (kebab-case)
- name: display name
- description: brief description of why this format fits
- reason: one sentence explaining the match

Suggest 2-4 formats from this list based on content type:
- linkedin-article: For thought leadership, professional insights
- twitter-thread: For breaking down complex topics into digestible points
- case-study: For success stories, implementations, results
- trend-analysis: For news, market data, industry developments
- investment-memo: For company/financial analysis
- product-brief: For product/feature documentation
- newsletter: For curated content, updates, digests
- whitepaper: For in-depth technical or research content
- competitive-analysis: For comparing companies/products
- executive-summary: For condensing lengthy documents

Only return valid JSON array, no other text.`;

      const response = await chat(
        [{ role: 'user', content: `Analyze these sources:\n\n${combinedContent.substring(0, 8000)}` }],
        {
          model: DEFAULT_MODEL,
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1000,
        }
      );

      let suggestions = [];
      try {
        const content = response || '[]';
        suggestions = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
      } catch (e) {
        console.error("Failed to parse suggestions:", e);
        suggestions = [];
      }

      res.json({ suggestions });
    } catch (error: any) {
      console.error("Source analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze sources" });
    }
  });

  // Generate report as plain markdown (for TipTap editor)
  app.post("/api/reports/generate", async (req: Request, res: Response) => {
    try {
      const { title, systemPrompt, sourceIds, model } = req.body;
      
      if (!systemPrompt) {
        return res.status(400).json({ error: "System prompt is required" });
      }

      // Get source contents
      const sources = await Promise.all(
        (sourceIds || []).map((id: string) => storage.getSource(id))
      );
      const sourceContents = sources.filter(Boolean).map(s => `[${s!.name}]:\n${s!.content}`);
      
      if (sourceContents.length === 0) {
        return res.status(400).json({ error: "No sources provided" });
      }

      const sourcesText = sourceContents.join('\n\n---\n\n');

      const reportPrompt = `${systemPrompt}

Based on these sources:

${sourcesText}

Write the report in clean markdown format. Use proper headings (##, ###), bullet points, bold text for emphasis, and blockquotes for key insights. Do NOT wrap in code blocks. Just output the markdown directly.`;

      const content = await chat(
        [{ role: 'user', content: reportPrompt }],
        {
          model: (model as ModelId) || DEFAULT_MODEL,
          systemPrompt: 'You are an expert report writer. Generate well-formatted markdown reports. Output markdown directly without code block wrappers.',
          maxTokens: 4000,
        }
      );

      res.json({ 
        title: title || 'Report',
        content: content || '',
      });
    } catch (error: any) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate report" });
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

  // ========== HyperBrowser API Routes ==========
  
  const hyperbrowserService = await import('./hyperbrowser-service');

  // Get all workflow templates
  app.get("/api/hyperbrowser/workflows", async (_req: Request, res: Response) => {
    try {
      const workflows = hyperbrowserService.getAllWorkflows();
      const configured = hyperbrowserService.isConfigured();
      res.json({ workflows, configured });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single workflow template
  app.get("/api/hyperbrowser/workflows/:id", async (req: Request, res: Response) => {
    try {
      const workflow = hyperbrowserService.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute a workflow
  app.post("/api/hyperbrowser/execute", async (req: Request, res: Response) => {
    try {
      const { workflowId, variables } = req.body;
      
      if (!hyperbrowserService.isConfigured()) {
        return res.status(400).json({ error: "HyperBrowser API key not configured" });
      }

      console.log(`[HyperBrowser] Executing workflow: ${workflowId}`);
      
      const execution = await hyperbrowserService.executeWorkflow(
        workflowId,
        variables,
        (log) => console.log(`[HyperBrowser] ${log}`)
      );

      res.json(execution);
    } catch (error: any) {
      console.error('[HyperBrowser] Execution error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get execution status
  app.get("/api/hyperbrowser/executions/:id", async (req: Request, res: Response) => {
    try {
      const execution = hyperbrowserService.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate workflow code preview
  app.post("/api/hyperbrowser/preview-code", async (req: Request, res: Response) => {
    try {
      const { workflowId, variables } = req.body;
      const code = hyperbrowserService.generateWorkflowCode(workflowId, variables);
      res.json({ code });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simple URL scrape
  app.post("/api/hyperbrowser/scrape", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!hyperbrowserService.isConfigured()) {
        return res.status(400).json({ error: "HyperBrowser API key not configured" });
      }

      console.log(`[HyperBrowser] Scraping URL: ${url}`);
      const result = await hyperbrowserService.scrapeUrl(url);
      res.json(result);
    } catch (error: any) {
      console.error('[HyperBrowser] Scrape error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check if HyperBrowser is configured
  app.get("/api/hyperbrowser/status", async (_req: Request, res: Response) => {
    res.json({ 
      configured: hyperbrowserService.isConfigured(),
      workflowCount: hyperbrowserService.getAllWorkflows().length
    });
  });

  // ==========================================================================
  // UI WORKFLOWS API
  // ==========================================================================

  // Get workflow preferences (favorites, hidden)
  app.get("/api/workflows/preferences", async (req: Request, res: Response) => {
    try {
      const { notebookId } = req.query;
      
      // For now, return from a simple in-memory/localStorage approach
      // In production, this would come from the database
      const preferences = {
        favorites: [],
        hidden: [],
        customOrder: [],
      };
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save workflow preferences
  app.post("/api/workflows/preferences", async (req: Request, res: Response) => {
    try {
      const { notebookId, favorites, hidden, customOrder } = req.body;
      
      // For now, just acknowledge - in production, save to database
      res.json({ 
        success: true,
        favorites: favorites || [],
        hidden: hidden || [],
        customOrder: customOrder || [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all UI workflows (built-in + custom)
  app.get("/api/workflows/ui", async (req: Request, res: Response) => {
    try {
      const { notebookId, category } = req.query;
      
      // Import built-in workflows
      const { BUILTIN_WORKFLOWS } = await import('@shared/builtin-workflows');
      
      let workflows = [...BUILTIN_WORKFLOWS];
      
      // Filter by category if provided
      if (category && category !== 'all') {
        workflows = workflows.filter(w => w.category === category);
      }
      
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific workflow by ID
  app.get("/api/workflows/ui/:id", async (req: Request, res: Response) => {
    try {
      const { BUILTIN_WORKFLOWS } = await import('@shared/builtin-workflows');
      const workflow = BUILTIN_WORKFLOWS.find(w => w.id === req.params.id);
      
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save workflow run/output
  app.post("/api/workflows/run", async (req: Request, res: Response) => {
    try {
      const { workflowId, notebookId, state, status, outputId } = req.body;
      
      // Log the workflow run (in production, save to workflow_runs table)
      console.log(`[Workflow] Run completed: ${workflowId}, status: ${status}`);
      
      res.json({ 
        success: true,
        workflowId,
        status,
        outputId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
