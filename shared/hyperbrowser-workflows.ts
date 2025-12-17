// HyperBrowser Workflow Templates and Types

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'boolean' | 'enum' | 'csv-column';
  required?: boolean;
  default?: any;
  values?: string[]; // For enum type
  description?: string;
  placeholder?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'research' | 'scraping' | 'monitoring' | 'enrichment';
  variables: WorkflowVariable[];
  outputs: string[];
  code: string; // Puppeteer code template with {{variable}} placeholders
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  variables: Record<string, any>;
  output?: WorkflowOutput;
  logs: string[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowOutput {
  type: 'table' | 'markdown' | 'json' | 'csv';
  title: string;
  data: any;
  columns?: string[];
}

// Pre-built workflow templates
export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'hacker-news-top',
    name: 'Hacker News Top Stories',
    icon: '📰',
    description: 'Extract top stories from Hacker News with titles, links, and points',
    category: 'scraping',
    variables: [
      { name: 'count', type: 'number', default: 10, description: 'Number of stories to extract' }
    ],
    outputs: ['stories'],
    code: `/**
 * Hacker News Top Stories
 * Extracts top {{count}} stories from Hacker News
 */

await page.goto("https://news.ycombinator.com", { timeout: 30000 });
console.log("Loaded Hacker News homepage");

const stories = await page.evaluate((count) => {
  const results = [];
  const rows = document.querySelectorAll('.athing');
  
  for (let i = 0; i < Math.min(count, rows.length); i++) {
    const row = rows[i];
    const subtext = row.nextElementSibling;
    const rankEl = row.querySelector('.rank');
    const titleEl = row.querySelector('.titleline > a');
    const scoreEl = subtext?.querySelector('.score');
    
    if (!titleEl) continue;
    
    results.push({
      rank: parseInt(rankEl?.textContent?.replace('.', '') || '0'),
      title: titleEl.textContent || '',
      link: titleEl.href,
      points: parseInt(scoreEl?.textContent || '0')
    });
  }
  return results;
}, {{count}});

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'Hacker News Top Stories', data: stories, columns: ['rank', 'title', 'link', 'points'] }));`
  },
  {
    id: 'company-website-scrape',
    name: 'Company Website Research',
    icon: '🏢',
    description: 'Scrape a company website for description, team info, and products',
    category: 'research',
    variables: [
      { name: 'url', type: 'string', required: true, description: 'Company website URL', placeholder: 'https://example.com' },
      { name: 'companyName', type: 'string', required: true, description: 'Company name', placeholder: 'Acme Corp' }
    ],
    outputs: ['companyInfo'],
    code: `/**
 * Company Website Research
 * Scrapes {{companyName}} website for key information
 */

const baseUrl = "{{url}}";
console.log("Researching: {{companyName}}");

await page.goto(baseUrl, { timeout: 30000, waitUntil: 'networkidle2' });

// Extract main page info
const mainInfo = await page.evaluate(() => {
  const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
  const getMeta = (name) => document.querySelector(\`meta[name="\${name}"]\`)?.getAttribute('content') || 
                           document.querySelector(\`meta[property="og:\${name}"]\`)?.getAttribute('content') || '';
  
  return {
    title: document.title,
    description: getMeta('description'),
    ogDescription: getMeta('description'),
    h1: getText('h1'),
    paragraphs: Array.from(document.querySelectorAll('p')).slice(0, 5).map(p => p.textContent?.trim()).filter(Boolean)
  };
});

// Try to find About page
let aboutInfo = null;
const aboutLink = await page.$('a[href*="about"]');
if (aboutLink) {
  await aboutLink.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  aboutInfo = await page.evaluate(() => {
    return {
      content: Array.from(document.querySelectorAll('p, h2, h3')).slice(0, 10).map(el => el.textContent?.trim()).filter(Boolean).join('\\n')
    };
  });
}

const result = {
  company: "{{companyName}}",
  website: "{{url}}",
  title: mainInfo.title,
  description: mainInfo.description || mainInfo.paragraphs.join(' ').slice(0, 500),
  aboutSummary: aboutInfo?.content?.slice(0, 1000) || 'No about page found'
};

console.log("OUTPUT:" + JSON.stringify({ type: 'markdown', title: '{{companyName}} Research', data: \`# {{companyName}}\\n\\n**Website:** {{url}}\\n\\n## Description\\n\${result.description}\\n\\n## About\\n\${result.aboutSummary}\` }));`
  },
  {
    id: 'google-search-scrape',
    name: 'Google Search Results',
    icon: '🔍',
    description: 'Search Google and extract top results',
    category: 'research',
    variables: [
      { name: 'query', type: 'string', required: true, description: 'Search query', placeholder: 'AI startups 2024' },
      { name: 'count', type: 'number', default: 10, description: 'Number of results' }
    ],
    outputs: ['searchResults'],
    code: `/**
 * Google Search Results
 * Searches for: {{query}}
 */

const query = encodeURIComponent("{{query}}");
await page.goto(\`https://www.google.com/search?q=\${query}\`, { timeout: 30000 });

console.log("Searching Google for: {{query}}");

// Wait for results
await page.waitForSelector('#search', { timeout: 10000 });

const results = await page.evaluate((maxResults) => {
  const items = [];
  const searchResults = document.querySelectorAll('#search .g');
  
  for (let i = 0; i < Math.min(maxResults, searchResults.length); i++) {
    const result = searchResults[i];
    const titleEl = result.querySelector('h3');
    const linkEl = result.querySelector('a');
    const snippetEl = result.querySelector('[data-sncf], .VwiC3b');
    
    if (titleEl && linkEl) {
      items.push({
        position: i + 1,
        title: titleEl.textContent || '',
        link: linkEl.href,
        snippet: snippetEl?.textContent || ''
      });
    }
  }
  return items;
}, {{count}});

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'Search Results: {{query}}', data: results, columns: ['position', 'title', 'link', 'snippet'] }));`
  },
  {
    id: 'linkedin-company-scrape',
    name: 'LinkedIn Company Profile',
    icon: '💼',
    description: 'Extract company info from LinkedIn (requires login session)',
    category: 'enrichment',
    variables: [
      { name: 'companySlug', type: 'string', required: true, description: 'LinkedIn company URL slug', placeholder: 'microsoft' }
    ],
    outputs: ['companyProfile'],
    code: `/**
 * LinkedIn Company Profile
 * Note: May require authentication for full data
 */

const companyUrl = "https://www.linkedin.com/company/{{companySlug}}/about/";
console.log("Fetching LinkedIn profile: {{companySlug}}");

await page.goto(companyUrl, { timeout: 30000, waitUntil: 'networkidle2' });

// Wait for content to load
await new Promise(r => setTimeout(r, 2000));

const companyInfo = await page.evaluate(() => {
  const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
  
  // Try to extract what's available on public page
  const name = getText('h1') || getText('.org-top-card-summary__title');
  const tagline = getText('.org-top-card-summary__tagline');
  const about = getText('.org-about-company-module__description');
  
  // Get details from the about section
  const details = {};
  document.querySelectorAll('.org-page-details__definition-term').forEach((term, i) => {
    const value = term.nextElementSibling?.textContent?.trim();
    if (value) details[term.textContent.trim()] = value;
  });
  
  return { name, tagline, about, details };
});

const result = {
  company: companyInfo.name || "{{companySlug}}",
  tagline: companyInfo.tagline,
  about: companyInfo.about,
  ...companyInfo.details
};

console.log("OUTPUT:" + JSON.stringify({ type: 'json', title: 'LinkedIn: {{companySlug}}', data: result }));`
  },
  {
    id: 'product-hunt-trending',
    name: 'Product Hunt Trending',
    icon: '🚀',
    description: 'Get trending products from Product Hunt',
    category: 'scraping',
    variables: [
      { name: 'count', type: 'number', default: 10, description: 'Number of products' }
    ],
    outputs: ['products'],
    code: `/**
 * Product Hunt Trending Products
 */

await page.goto("https://www.producthunt.com", { timeout: 30000, waitUntil: 'networkidle2' });
console.log("Loading Product Hunt...");

await new Promise(r => setTimeout(r, 2000));

const products = await page.evaluate((maxCount) => {
  const items = [];
  const productCards = document.querySelectorAll('[data-test="post-item"]');
  
  productCards.forEach((card, index) => {
    if (index >= maxCount) return;
    
    const nameEl = card.querySelector('h3, [data-test="post-name"]');
    const taglineEl = card.querySelector('[data-test="post-tagline"], h3 + div');
    const linkEl = card.querySelector('a[href*="/posts/"]');
    const votesEl = card.querySelector('[data-test="vote-button"] span, button span');
    
    if (nameEl) {
      items.push({
        rank: index + 1,
        name: nameEl.textContent?.trim() || '',
        tagline: taglineEl?.textContent?.trim() || '',
        link: linkEl?.href || '',
        votes: votesEl?.textContent?.trim() || '0'
      });
    }
  });
  
  return items;
}, {{count}});

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'Product Hunt Trending', data: products, columns: ['rank', 'name', 'tagline', 'votes', 'link'] }));`
  },
  {
    id: 'news-topic-search',
    name: 'News Topic Search',
    icon: '📡',
    description: 'Search news articles on a specific topic via Google News',
    category: 'research',
    variables: [
      { name: 'topic', type: 'string', required: true, description: 'News topic to search', placeholder: 'artificial intelligence' },
      { name: 'count', type: 'number', default: 10, description: 'Number of articles' }
    ],
    outputs: ['articles'],
    code: `/**
 * News Topic Search
 * Searches Google News for: {{topic}}
 */

const topic = encodeURIComponent("{{topic}}");
await page.goto(\`https://news.google.com/search?q=\${topic}&hl=en-US&gl=US&ceid=US:en\`, { timeout: 30000 });

console.log("Searching news for: {{topic}}");
await new Promise(r => setTimeout(r, 2000));

const articles = await page.evaluate((maxCount) => {
  const items = [];
  const articleEls = document.querySelectorAll('article');
  
  articleEls.forEach((article, index) => {
    if (index >= maxCount) return;
    
    const titleEl = article.querySelector('h3, h4, a');
    const sourceEl = article.querySelector('[data-n-tid], time');
    const linkEl = article.querySelector('a[href*="./articles/"]') || article.querySelector('a');
    
    if (titleEl) {
      items.push({
        rank: index + 1,
        title: titleEl.textContent?.trim() || '',
        source: sourceEl?.textContent?.trim() || '',
        link: linkEl?.href || ''
      });
    }
  });
  
  return items;
}, {{count}});

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'News: {{topic}}', data: articles, columns: ['rank', 'title', 'source', 'link'] }));`
  },
  {
    id: 'github-repo-info',
    name: 'GitHub Repository Info',
    icon: '🐙',
    description: 'Extract information from a GitHub repository',
    category: 'research',
    variables: [
      { name: 'owner', type: 'string', required: true, description: 'Repository owner', placeholder: 'facebook' },
      { name: 'repo', type: 'string', required: true, description: 'Repository name', placeholder: 'react' }
    ],
    outputs: ['repoInfo'],
    code: `/**
 * GitHub Repository Info
 * Fetching: {{owner}}/{{repo}}
 */

await page.goto("https://github.com/{{owner}}/{{repo}}", { timeout: 30000 });
console.log("Loading GitHub repo: {{owner}}/{{repo}}");

const repoInfo = await page.evaluate(() => {
  const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
  const getNum = (sel) => {
    const text = document.querySelector(sel)?.textContent?.trim() || '0';
    return text.replace(/[^0-9.km]/gi, '');
  };
  
  return {
    name: getText('[itemprop="name"] a') || getText('strong[itemprop="name"]'),
    description: getText('[itemprop="about"], .f4.my-3'),
    stars: getNum('#repo-stars-counter-star, [href$="/stargazers"]'),
    forks: getNum('#repo-network-counter, [href$="/forks"]'),
    watchers: getNum('[href$="/watchers"] strong'),
    language: getText('[itemprop="programmingLanguage"]'),
    topics: Array.from(document.querySelectorAll('.topic-tag')).map(t => t.textContent.trim()),
    lastUpdated: getText('relative-time')
  };
});

const result = {
  repository: "{{owner}}/{{repo}}",
  ...repoInfo,
  url: "https://github.com/{{owner}}/{{repo}}"
};

console.log("OUTPUT:" + JSON.stringify({ type: 'json', title: 'GitHub: {{owner}}/{{repo}}', data: result }));`
  },
  {
    id: 'reddit-subreddit-top',
    name: 'Reddit Subreddit Top Posts',
    icon: '🤖',
    description: 'Extract top posts from a subreddit',
    category: 'scraping',
    variables: [
      { name: 'subreddit', type: 'string', required: true, description: 'Subreddit name (without r/)', placeholder: 'technology' },
      { name: 'timeframe', type: 'enum', values: ['day', 'week', 'month', 'year', 'all'], default: 'week', description: 'Time period' },
      { name: 'count', type: 'number', default: 10, description: 'Number of posts' }
    ],
    outputs: ['posts'],
    code: `/**
 * Reddit Top Posts
 * Subreddit: r/{{subreddit}}
 */

await page.goto("https://old.reddit.com/r/{{subreddit}}/top/?t={{timeframe}}", { timeout: 30000 });
console.log("Loading r/{{subreddit}} top posts...");

const posts = await page.evaluate((maxCount) => {
  const items = [];
  const postEls = document.querySelectorAll('.thing.link');
  
  postEls.forEach((post, index) => {
    if (index >= maxCount) return;
    
    const titleEl = post.querySelector('a.title');
    const scoreEl = post.querySelector('.score.unvoted');
    const commentsEl = post.querySelector('.comments');
    const authorEl = post.querySelector('.author');
    
    if (titleEl) {
      items.push({
        rank: index + 1,
        title: titleEl.textContent?.trim() || '',
        score: scoreEl?.textContent?.trim() || '0',
        comments: commentsEl?.textContent?.trim() || '0 comments',
        author: authorEl?.textContent?.trim() || '',
        link: titleEl.href
      });
    }
  });
  
  return items;
}, {{count}});

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'r/{{subreddit}} Top Posts', data: posts, columns: ['rank', 'title', 'score', 'comments', 'author'] }));`
  },
  {
    id: 'webpage-extract',
    name: 'Webpage Content Extract',
    icon: '📄',
    description: 'Extract main content from any webpage as markdown',
    category: 'scraping',
    variables: [
      { name: 'url', type: 'string', required: true, description: 'URL to extract', placeholder: 'https://example.com/article' }
    ],
    outputs: ['content'],
    code: `/**
 * Webpage Content Extractor
 * URL: {{url}}
 */

await page.goto("{{url}}", { timeout: 30000, waitUntil: 'networkidle2' });
console.log("Extracting content from: {{url}}");

const content = await page.evaluate(() => {
  // Remove unwanted elements
  ['script', 'style', 'nav', 'footer', 'header', 'aside', '.ad', '.advertisement', '.sidebar'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });
  
  const title = document.title;
  const h1 = document.querySelector('h1')?.textContent?.trim() || '';
  
  // Get main content
  const mainEl = document.querySelector('main, article, .content, .post, #content') || document.body;
  
  // Extract text with structure
  let markdown = '';
  const processNode = (node, depth = 0) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) markdown += text + ' ';
      return;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    
    const tag = node.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
      markdown += '\\n' + '#'.repeat(parseInt(tag[1])) + ' ' + node.textContent.trim() + '\\n\\n';
    } else if (tag === 'p') {
      markdown += node.textContent.trim() + '\\n\\n';
    } else if (tag === 'li') {
      markdown += '- ' + node.textContent.trim() + '\\n';
    } else if (tag === 'a') {
      markdown += '[' + node.textContent.trim() + '](' + node.href + ') ';
    } else {
      node.childNodes.forEach(child => processNode(child, depth + 1));
    }
  };
  
  processNode(mainEl);
  
  return { title, h1, markdown: markdown.slice(0, 5000) };
});

const result = \`# \${content.h1 || content.title}\\n\\n\${content.markdown}\`;

console.log("OUTPUT:" + JSON.stringify({ type: 'markdown', title: content.title, data: result }));`
  },
  {
    id: 'batch-company-research',
    name: 'Batch Company Research',
    icon: '📊',
    description: 'Research multiple companies from a list (for CSV integration)',
    category: 'enrichment',
    variables: [
      { name: 'companies', type: 'array', required: true, description: 'List of company names or URLs' }
    ],
    outputs: ['companiesData'],
    code: `/**
 * Batch Company Research
 * Researching {{companies.length}} companies
 */

const companies = {{companies}};
const results = [];

for (let i = 0; i < companies.length; i++) {
  const company = companies[i];
  console.log(\`Processing \${i + 1}/\${companies.length}: \${company}\`);
  
  try {
    // Search for company
    const searchUrl = \`https://www.google.com/search?q=\${encodeURIComponent(company + ' company')}\`;
    await page.goto(searchUrl, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    
    const info = await page.evaluate((companyName) => {
      const firstResult = document.querySelector('#search .g a');
      const snippet = document.querySelector('#search .g .VwiC3b')?.textContent || '';
      
      return {
        company: companyName,
        website: firstResult?.href || '',
        description: snippet.slice(0, 300),
        status: 'found'
      };
    }, company);
    
    results.push(info);
  } catch (err) {
    results.push({ company, website: '', description: 'Error fetching', status: 'error' });
  }
  
  // Rate limiting
  await new Promise(r => setTimeout(r, 1000));
}

console.log("OUTPUT:" + JSON.stringify({ type: 'table', title: 'Company Research Results', data: results, columns: ['company', 'website', 'description', 'status'] }));`
  }
];

export function getWorkflowById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(w => w.id === id);
}

export function getWorkflowsByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(w => w.category === category);
}

export function interpolateCode(template: WorkflowTemplate, variables: Record<string, any>): string {
  let code = template.code;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    code = code.replace(placeholder, stringValue);
  }
  
  return code;
}
