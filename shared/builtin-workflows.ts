/**
 * Built-in MVP Workflows for Hyper-Notebook
 * 
 * These workflows are pre-loaded into the system and showcase the A2UI capabilities.
 */

import { WorkflowDefinition } from './workflow-schema';

// =============================================================================
// CONTEXT SETUP WIZARD (First-run onboarding)
// =============================================================================

export const CONTEXT_SETUP_WORKFLOW: WorkflowDefinition = {
  id: 'context-setup-wizard',
  name: 'Context Setup Wizard',
  description: 'Get started with Hyper-Notebook by telling us about yourself, your role, and adding your first sources. This personalized setup helps the AI understand your needs and recommend the best workflows for you.',
  shortDescription: 'Personalized first-run setup',
  category: 'onboarding',
  tags: ['setup', 'onboarding', 'getting-started', 'profile'],
  icon: 'Sparkles',
  emoji: '✨',
  color: '#8B5CF6',
  estimatedMinutes: 8,
  difficulty: 'beginner',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Hyper-Notebook',
      description: 'Your AI-powered research and intelligence platform',
      icon: 'Sparkles',
      components: [
        {
          type: 'hero_card',
          stateKey: '_welcome',
          props: {
            title: 'Welcome to Hyper-Notebook! 🎉',
            content: "Let's personalize your experience. This quick setup will help us understand your work so we can provide better AI assistance and recommend the right workflows for you.",
            icon: 'Sparkles',
          },
        },
      ],
    },
    {
      id: 'role',
      title: 'Your Role',
      description: "What's your primary role?",
      icon: 'User',
      components: [
        {
          type: 'card_selector',
          stateKey: 'role',
          props: {
            label: 'Select the role that best describes your work',
            columns: 2,
            required: true,
            options: [
              { id: 'consultant', label: 'Consultant / Agency', icon: '💼', description: 'Client services, strategy, delivery' },
              { id: 'founder', label: 'Founder / Executive', icon: '🚀', description: 'Strategy, growth, decision-making' },
              { id: 'sales', label: 'Sales / Business Dev', icon: '📊', description: 'Pipeline, outreach, closing deals' },
              { id: 'marketing', label: 'Marketing / Content', icon: '📣', description: 'Campaigns, content, brand' },
              { id: 'product', label: 'Product / Engineering', icon: '🔧', description: 'Building, shipping, iterating' },
              { id: 'operations', label: 'Operations / PM', icon: '⚙️', description: 'Processes, coordination, delivery' },
            ],
          },
        },
      ],
    },
    {
      id: 'daily-focus',
      title: 'Daily Focus',
      description: 'What do you spend most of your time on?',
      icon: 'Clock',
      aiEnhanced: true,
      components: [
        {
          type: 'checkbox_list',
          stateKey: 'dailyTasks',
          props: {
            label: 'Select all that apply',
            multiSelect: true,
            options: [
              { id: 'research', label: 'Research & Analysis', icon: '🔍', description: 'Finding information, competitive intel' },
              { id: 'writing', label: 'Writing & Content', icon: '✍️', description: 'Reports, emails, documentation' },
              { id: 'meetings', label: 'Meetings & Calls', icon: '📞', description: 'Client calls, team syncs' },
              { id: 'strategy', label: 'Strategy & Planning', icon: '🎯', description: 'Roadmaps, proposals, decisions' },
              { id: 'outreach', label: 'Outreach & Communication', icon: '📧', description: 'Emails, follow-ups, networking' },
              { id: 'data', label: 'Data & Reporting', icon: '📊', description: 'Dashboards, metrics, analysis' },
            ],
          },
        },
        {
          type: 'slider',
          stateKey: 'researchTime',
          props: {
            label: 'How many hours per week do you spend on research?',
            min: 0,
            max: 40,
            step: 2,
            defaultValue: 10,
            showValue: true,
            leftLabel: '0 hrs',
            rightLabel: '40 hrs',
          },
        },
      ],
    },
    {
      id: 'information-assets',
      title: 'Your Information',
      description: 'What type of information do you work with?',
      icon: 'FolderOpen',
      components: [
        {
          type: 'checkbox_list',
          stateKey: 'infoTypes',
          props: {
            label: 'Select all types of information you have access to',
            multiSelect: true,
            options: [
              { id: 'client_docs', label: 'Client Documents', icon: '📁', description: 'Briefs, contracts, requirements' },
              { id: 'market_research', label: 'Market Research', icon: '📈', description: 'Industry reports, trends' },
              { id: 'competitor_intel', label: 'Competitor Intelligence', icon: '🎯', description: 'Competitor analysis, positioning' },
              { id: 'internal_docs', label: 'Internal Documents', icon: '🏢', description: 'SOPs, playbooks, templates' },
              { id: 'contact_lists', label: 'Contact Lists / CRM', icon: '👥', description: 'Leads, prospects, clients' },
              { id: 'news_feeds', label: 'News & RSS Feeds', icon: '📰', description: 'Industry news, updates' },
            ],
          },
        },
      ],
    },
    {
      id: 'add-sources',
      title: 'Add Your First Sources',
      description: 'Upload documents or add URLs to get started',
      icon: 'Upload',
      canSkip: true,
      components: [
        {
          type: 'info_card',
          stateKey: '_sourceInfo',
          props: {
            title: 'Sources power your AI',
            content: 'The more context you add, the smarter your AI assistant becomes. You can always add more later.',
            variant: 'info',
          },
        },
        {
          type: 'file_upload',
          stateKey: 'uploadedFiles',
          props: {
            label: 'Upload documents (PDF, TXT, MD)',
            acceptedTypes: ['.pdf', '.txt', '.md', '.docx'],
            maxFiles: 5,
            showPreview: true,
          },
        },
        {
          type: 'url_input',
          stateKey: 'urls',
          props: {
            label: 'Or add website URLs',
            placeholder: 'https://example.com/article',
          },
        },
      ],
    },
    {
      id: 'ai-profile',
      title: 'Your Intelligence Profile',
      description: 'AI is building your personalized profile',
      icon: 'Brain',
      components: [
        {
          type: 'ai_generate',
          stateKey: 'intelligenceProfile',
          props: {
            prompt: `Based on this user profile, create a brief intelligence profile:
Role: {{role}}
Daily Focus: {{dailyTasks}}
Research Hours/Week: {{researchTime}}
Information Types: {{infoTypes}}

Write a 2-3 sentence summary of who this user is and what they need. Then list 3 specific ways Hyper-Notebook can help them. Format as markdown.`,
            outputFormat: 'markdown',
            loadingText: 'Building your intelligence profile...',
            autoTrigger: true,
          },
        },
        {
          type: 'ai_summary',
          stateKey: '_profileDisplay',
          props: {
            sourceKey: 'intelligenceProfile',
          },
        },
      ],
    },
    {
      id: 'recommended-workflows',
      title: 'Recommended Workflows',
      description: 'Based on your profile, we recommend these workflows',
      icon: 'Workflow',
      components: [
        {
          type: 'info_card',
          stateKey: '_workflowRec',
          props: {
            title: 'Your Top Workflows',
            content: 'Based on your role and focus areas, these workflows will be most valuable to you. They\'ll be pinned to your favorites.',
            variant: 'success',
          },
        },
        {
          type: 'checkbox_list',
          stateKey: 'selectedWorkflows',
          props: {
            label: 'Select workflows to add to your favorites',
            multiSelect: true,
            options: [
              { id: 'client-discovery', label: 'Client Discovery Wizard', icon: '🤝', description: 'Structured intake for new clients' },
              { id: 'competitive-landscape', label: 'Competitive Landscape Builder', icon: '🎯', description: 'Research and compare competitors' },
              { id: 'proposal-generator', label: 'Proposal Generator', icon: '📝', description: 'Create professional proposals' },
              { id: 'marketing-campaign', label: 'Marketing Campaign Creator', icon: '📣', description: 'Plan end-to-end campaigns' },
            ],
          },
        },
      ],
    },
    {
      id: 'daily-ritual',
      title: 'Daily Check-in',
      description: 'Set up your daily intelligence ritual',
      icon: 'Calendar',
      canSkip: true,
      components: [
        {
          type: 'info_card',
          stateKey: '_ritualInfo',
          props: {
            title: 'Build a daily habit',
            content: 'Set a reminder to check in daily. We\'ll prepare a briefing based on your sources and recent activity.',
            variant: 'info',
          },
        },
        {
          type: 'card_selector',
          stateKey: 'checkInTime',
          props: {
            label: 'When do you want your daily briefing?',
            columns: 3,
            options: [
              { id: 'morning', label: 'Morning', icon: '🌅', description: '8:00 AM' },
              { id: 'midday', label: 'Midday', icon: '☀️', description: '12:00 PM' },
              { id: 'evening', label: 'Evening', icon: '🌆', description: '5:00 PM' },
            ],
          },
        },
      ],
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'Your notebook is ready to use',
      icon: 'CheckCircle',
      components: [
        {
          type: 'celebration',
          stateKey: '_celebration',
          props: {
            title: 'Welcome to Hyper-Notebook! 🎉',
            message: 'Your personalized workspace is ready. Start chatting with AI, run workflows, or add more sources.',
          },
        },
        {
          type: 'button_group',
          stateKey: '_nextActions',
          props: {
            buttons: [
              { id: 'chat', label: 'Start Chatting', icon: 'MessageSquare', variant: 'default', action: 'navigate:/chat' },
              { id: 'workflows', label: 'Browse Workflows', icon: 'Workflow', variant: 'outline', action: 'navigate:/workflows' },
              { id: 'sources', label: 'Add More Sources', icon: 'Plus', variant: 'outline', action: 'navigate:/sources' },
            ],
          },
        },
      ],
    },
  ],
  output: {
    type: 'profile',
    title: 'User Profile - {{role}}',
    template: '{{intelligenceProfile}}',
  },
};

// =============================================================================
// CLIENT DISCOVERY WORKFLOW
// =============================================================================

export const CLIENT_DISCOVERY_WORKFLOW: WorkflowDefinition = {
  id: 'client-discovery',
  name: 'Client Discovery & Onboarding',
  description: 'Structured intake process for new client engagements. Gather company info, pain points, goals, and generate a professional client brief document.',
  shortDescription: 'New client intake wizard',
  category: 'sales',
  tags: ['client', 'discovery', 'onboarding', 'intake', 'sales'],
  icon: 'Users',
  emoji: '🤝',
  color: '#10B981',
  estimatedMinutes: 12,
  difficulty: 'beginner',
  steps: [
    {
      id: 'company-info',
      title: 'Company Information',
      description: 'Basic details about the client company',
      icon: 'Building',
      components: [
        {
          type: 'text_input',
          stateKey: 'companyName',
          props: {
            label: 'Company Name',
            placeholder: 'Enter company name',
            required: true,
          },
        },
        {
          type: 'text_input',
          stateKey: 'contactName',
          props: {
            label: 'Primary Contact Name',
            placeholder: 'Enter contact name',
          },
        },
        {
          type: 'text_input',
          stateKey: 'contactEmail',
          props: {
            label: 'Contact Email',
            placeholder: 'email@company.com',
          },
        },
        {
          type: 'dropdown',
          stateKey: 'industry',
          props: {
            label: 'Industry',
            required: true,
            options: [
              { id: 'tech', label: 'Technology / Software' },
              { id: 'finance', label: 'Finance / Banking' },
              { id: 'healthcare', label: 'Healthcare' },
              { id: 'retail', label: 'Retail / E-commerce' },
              { id: 'manufacturing', label: 'Manufacturing' },
              { id: 'professional', label: 'Professional Services' },
              { id: 'media', label: 'Media / Entertainment' },
              { id: 'education', label: 'Education' },
              { id: 'nonprofit', label: 'Non-profit' },
              { id: 'other', label: 'Other' },
            ],
          },
        },
        {
          type: 'card_selector',
          stateKey: 'companySize',
          props: {
            label: 'Company Size',
            columns: 4,
            required: true,
            options: [
              { id: 'startup', label: 'Startup', icon: '🚀', description: '1-10 employees' },
              { id: 'small', label: 'Small', icon: '🏢', description: '11-50 employees' },
              { id: 'medium', label: 'Medium', icon: '🏛️', description: '51-200 employees' },
              { id: 'enterprise', label: 'Enterprise', icon: '🌐', description: '200+ employees' },
            ],
          },
        },
      ],
    },
    {
      id: 'current-situation',
      title: 'Current Situation',
      description: "What's happening in their business right now?",
      icon: 'Info',
      components: [
        {
          type: 'textarea',
          stateKey: 'currentSituation',
          props: {
            label: 'Describe their current situation',
            placeholder: "What's going on in their business? What triggered this conversation?",
            required: true,
          },
        },
        {
          type: 'checkbox_list',
          stateKey: 'triggerEvents',
          props: {
            label: 'What triggered this engagement?',
            multiSelect: true,
            options: [
              { id: 'growth', label: 'Rapid growth / scaling challenges', icon: '📈' },
              { id: 'new_leader', label: 'New leadership / restructuring', icon: '👔' },
              { id: 'competitive', label: 'Competitive pressure', icon: '🎯' },
              { id: 'digital', label: 'Digital transformation', icon: '💻' },
              { id: 'efficiency', label: 'Need for efficiency', icon: '⚡' },
              { id: 'expansion', label: 'Market expansion', icon: '🌍' },
            ],
          },
        },
      ],
    },
    {
      id: 'pain-points',
      title: 'Pain Points & Challenges',
      description: 'What problems are they trying to solve?',
      icon: 'AlertTriangle',
      components: [
        {
          type: 'checkbox_list',
          stateKey: 'painPoints',
          props: {
            label: 'Select all challenges that apply',
            multiSelect: true,
            required: true,
            options: [
              { id: 'revenue', label: 'Revenue growth stalled', icon: '💰' },
              { id: 'efficiency', label: 'Operational inefficiency', icon: '⚙️' },
              { id: 'competition', label: 'Losing to competitors', icon: '🏃' },
              { id: 'talent', label: 'Talent acquisition/retention', icon: '👥' },
              { id: 'technology', label: 'Outdated technology', icon: '🖥️' },
              { id: 'customer', label: 'Customer satisfaction issues', icon: '😕' },
              { id: 'process', label: 'Broken processes', icon: '🔄' },
              { id: 'data', label: 'Lack of data/insights', icon: '📊' },
            ],
          },
        },
        {
          type: 'textarea',
          stateKey: 'painDetails',
          props: {
            label: 'Describe the main challenge in detail',
            placeholder: "What's keeping them up at night? What have they tried?",
          },
        },
        {
          type: 'slider',
          stateKey: 'urgency',
          props: {
            label: 'How urgent is solving this problem?',
            min: 1,
            max: 10,
            step: 1,
            defaultValue: 5,
            leftLabel: 'Nice to have',
            rightLabel: 'Critical',
          },
        },
      ],
    },
    {
      id: 'goals',
      title: 'Goals & Desired Outcomes',
      description: 'What does success look like for them?',
      icon: 'Target',
      components: [
        {
          type: 'tag_input',
          stateKey: 'goals',
          props: {
            label: 'Key goals (press Enter to add each)',
            placeholder: 'e.g., Increase revenue by 20%',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'successMetrics',
          props: {
            label: 'How will they measure success?',
            placeholder: 'What specific metrics or outcomes would indicate success?',
          },
        },
        {
          type: 'card_selector',
          stateKey: 'timeline',
          props: {
            label: 'Expected timeline for results',
            columns: 3,
            required: true,
            options: [
              { id: 'immediate', label: 'Immediate', description: 'Within 1 month', icon: '⚡' },
              { id: 'quarter', label: 'This Quarter', description: '1-3 months', icon: '📅' },
              { id: 'halfyear', label: '6 Months', description: '3-6 months', icon: '📆' },
              { id: 'year', label: 'This Year', description: '6-12 months', icon: '🗓️' },
            ],
          },
        },
      ],
    },
    {
      id: 'budget',
      title: 'Budget & Decision Process',
      description: 'Understanding their investment capacity',
      icon: 'DollarSign',
      components: [
        {
          type: 'card_selector',
          stateKey: 'budgetRange',
          props: {
            label: 'Approximate budget range',
            columns: 2,
            options: [
              { id: 'small', label: '$5K - $25K', icon: '💵', description: 'Small project' },
              { id: 'medium', label: '$25K - $100K', icon: '💰', description: 'Medium engagement' },
              { id: 'large', label: '$100K - $500K', icon: '🏦', description: 'Large project' },
              { id: 'enterprise', label: '$500K+', icon: '💎', description: 'Enterprise deal' },
            ],
          },
        },
        {
          type: 'checkbox_list',
          stateKey: 'decisionFactors',
          props: {
            label: 'Decision-making factors',
            multiSelect: true,
            options: [
              { id: 'budget_approved', label: 'Budget already approved', icon: '✅' },
              { id: 'committee', label: 'Committee decision', icon: '👥' },
              { id: 'single', label: 'Single decision maker', icon: '👤' },
              { id: 'competitive', label: 'Evaluating multiple vendors', icon: '⚖️' },
              { id: 'timeline_pressure', label: 'Urgent timeline', icon: '⏰' },
            ],
          },
        },
        {
          type: 'text_input',
          stateKey: 'decisionMaker',
          props: {
            label: 'Who is the final decision maker?',
            placeholder: 'Name and title',
          },
        },
      ],
    },
    {
      id: 'generate-brief',
      title: 'Client Discovery Brief',
      description: 'AI-generated summary document',
      icon: 'FileText',
      components: [
        {
          type: 'ai_generate',
          stateKey: 'clientBrief',
          props: {
            prompt: `Generate a professional Client Discovery Brief based on this information:

## Client Information
- **Company**: {{companyName}}
- **Contact**: {{contactName}} ({{contactEmail}})
- **Industry**: {{industry}}
- **Size**: {{companySize}}

## Current Situation
{{currentSituation}}

**Trigger Events**: {{triggerEvents}}

## Challenges
**Pain Points**: {{painPoints}}
**Details**: {{painDetails}}
**Urgency Level**: {{urgency}}/10

## Goals & Success Criteria
**Goals**: {{goals}}
**Success Metrics**: {{successMetrics}}
**Timeline**: {{timeline}}

## Budget & Decision Process
**Budget Range**: {{budgetRange}}
**Decision Factors**: {{decisionFactors}}
**Decision Maker**: {{decisionMaker}}

---

Create a well-structured markdown document with:
1. Executive Summary (2-3 sentences)
2. Company Overview
3. Current Challenges (prioritized)
4. Desired Outcomes
5. Budget & Timeline
6. Recommended Next Steps
7. Risk Factors to Address

Make it professional and actionable.`,
            outputFormat: 'markdown',
            loadingText: 'Generating client brief...',
            autoTrigger: true,
          },
        },
        {
          type: 'ai_summary',
          stateKey: '_briefDisplay',
          props: {
            sourceKey: 'clientBrief',
          },
        },
      ],
    },
  ],
  output: {
    type: 'source',
    title: 'Client Brief - {{companyName}}',
    template: '{{clientBrief}}',
  },
};

// =============================================================================
// COMPETITIVE LANDSCAPE WORKFLOW
// =============================================================================

export const COMPETITIVE_LANDSCAPE_WORKFLOW: WorkflowDefinition = {
  id: 'competitive-landscape',
  name: 'Competitive Landscape Builder',
  description: 'Research and analyze your competitive landscape. Identify key competitors, compare features, and develop positioning strategy.',
  shortDescription: 'Research & compare competitors',
  category: 'strategy',
  tags: ['competitive', 'research', 'analysis', 'strategy', 'positioning'],
  icon: 'Target',
  emoji: '🎯',
  color: '#F59E0B',
  estimatedMinutes: 15,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'your-company',
      title: 'Your Company',
      description: 'Tell us about your product/service',
      icon: 'Building',
      components: [
        {
          type: 'text_input',
          stateKey: 'yourCompany',
          props: {
            label: 'Your Company/Product Name',
            placeholder: 'Enter your company or product name',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'yourDescription',
          props: {
            label: 'What do you do? (1-2 sentences)',
            placeholder: 'Briefly describe your product or service',
            required: true,
          },
        },
        {
          type: 'dropdown',
          stateKey: 'yourCategory',
          props: {
            label: 'Primary Category',
            required: true,
            options: [
              { id: 'saas', label: 'SaaS / Software' },
              { id: 'marketplace', label: 'Marketplace / Platform' },
              { id: 'services', label: 'Professional Services' },
              { id: 'ecommerce', label: 'E-commerce / Retail' },
              { id: 'fintech', label: 'Fintech' },
              { id: 'healthtech', label: 'Healthcare / Healthtech' },
              { id: 'edtech', label: 'Education / Edtech' },
              { id: 'other', label: 'Other' },
            ],
          },
        },
      ],
    },
    {
      id: 'competitors',
      title: 'Identify Competitors',
      description: 'Who are you competing against?',
      icon: 'Users',
      components: [
        {
          type: 'tag_input',
          stateKey: 'competitors',
          props: {
            label: 'Enter competitor names (press Enter after each)',
            placeholder: 'e.g., Competitor A',
            required: true,
          },
        },
        {
          type: 'info_card',
          stateKey: '_competitorTip',
          props: {
            title: '💡 Tip',
            content: 'Include both direct competitors (similar products) and indirect competitors (alternative solutions to the same problem).',
            variant: 'info',
          },
        },
      ],
    },
    {
      id: 'comparison-criteria',
      title: 'Comparison Criteria',
      description: 'What factors matter most?',
      icon: 'ListChecks',
      components: [
        {
          type: 'checkbox_list',
          stateKey: 'criteria',
          props: {
            label: 'Select comparison criteria',
            multiSelect: true,
            required: true,
            options: [
              { id: 'pricing', label: 'Pricing & Plans', icon: '💰' },
              { id: 'features', label: 'Core Features', icon: '⚙️' },
              { id: 'ux', label: 'User Experience', icon: '✨' },
              { id: 'integrations', label: 'Integrations', icon: '🔗' },
              { id: 'support', label: 'Customer Support', icon: '💬' },
              { id: 'scalability', label: 'Scalability', icon: '📈' },
              { id: 'security', label: 'Security & Compliance', icon: '🔒' },
              { id: 'market', label: 'Market Position', icon: '🏆' },
            ],
          },
        },
        {
          type: 'card_selector',
          stateKey: 'primaryFocus',
          props: {
            label: 'What is your PRIMARY competitive advantage?',
            columns: 2,
            required: true,
            options: [
              { id: 'price', label: 'Price Leader', icon: '💵', description: 'Most affordable option' },
              { id: 'features', label: 'Feature Rich', icon: '🚀', description: 'Most comprehensive' },
              { id: 'ease', label: 'Easiest to Use', icon: '✨', description: 'Best UX/simplicity' },
              { id: 'service', label: 'Best Service', icon: '🤝', description: 'Superior support' },
              { id: 'niche', label: 'Niche Expert', icon: '🎯', description: 'Specialized solution' },
              { id: 'innovation', label: 'Most Innovative', icon: '💡', description: 'Cutting-edge tech' },
            ],
          },
        },
      ],
    },
    {
      id: 'target-audience',
      title: 'Target Audience',
      description: 'Who are you selling to?',
      icon: 'UserCheck',
      components: [
        {
          type: 'card_selector',
          stateKey: 'targetSize',
          props: {
            label: 'Target company size',
            columns: 4,
            multiSelect: true,
            options: [
              { id: 'smb', label: 'SMB', icon: '🏠', description: '1-50 employees' },
              { id: 'midmarket', label: 'Mid-Market', icon: '🏢', description: '51-500 employees' },
              { id: 'enterprise', label: 'Enterprise', icon: '🏛️', description: '500+ employees' },
              { id: 'consumer', label: 'Consumer', icon: '👤', description: 'B2C / Individual' },
            ],
          },
        },
        {
          type: 'tag_input',
          stateKey: 'targetRoles',
          props: {
            label: 'Target buyer roles (press Enter after each)',
            placeholder: 'e.g., CTO, Marketing Director',
          },
        },
      ],
    },
    {
      id: 'generate-analysis',
      title: 'Competitive Analysis',
      description: 'AI-generated competitive landscape report',
      icon: 'FileText',
      components: [
        {
          type: 'ai_generate',
          stateKey: 'competitiveAnalysis',
          props: {
            prompt: `Generate a comprehensive Competitive Landscape Analysis:

## Your Company
- **Name**: {{yourCompany}}
- **Description**: {{yourDescription}}
- **Category**: {{yourCategory}}
- **Primary Advantage**: {{primaryFocus}}

## Competitors
{{competitors}}

## Comparison Criteria
{{criteria}}

## Target Market
- **Company Size**: {{targetSize}}
- **Buyer Roles**: {{targetRoles}}

---

Create a detailed competitive analysis document with:

1. **Executive Summary** - Key findings in 3 bullets

2. **Competitive Landscape Overview**
   - Market dynamics
   - Key players and their positioning

3. **Competitor Profiles** (for each competitor):
   - Brief description
   - Strengths
   - Weaknesses
   - Target market

4. **Feature Comparison Matrix** (markdown table)
   - Compare across selected criteria
   - Rate: ✅ Strong | ⚠️ Average | ❌ Weak

5. **Positioning Analysis**
   - Where you fit in the market
   - Differentiation opportunities
   - Competitive gaps to exploit

6. **Strategic Recommendations**
   - 3-5 actionable recommendations
   - Messaging angles to emphasize
   - Features to highlight or develop

7. **Risks & Threats**
   - Competitive threats to monitor
   - Market shifts to watch

Format as professional markdown with headers, bullets, and tables.`,
            outputFormat: 'markdown',
            loadingText: 'Analyzing competitive landscape...',
            autoTrigger: true,
          },
        },
        {
          type: 'ai_summary',
          stateKey: '_analysisDisplay',
          props: {
            sourceKey: 'competitiveAnalysis',
          },
        },
      ],
    },
  ],
  output: {
    type: 'source',
    title: 'Competitive Analysis - {{yourCompany}}',
    template: '{{competitiveAnalysis}}',
  },
};

// =============================================================================
// PROPOSAL GENERATOR WORKFLOW
// =============================================================================

export const PROPOSAL_GENERATOR_WORKFLOW: WorkflowDefinition = {
  id: 'proposal-generator',
  name: 'Proposal & SOW Generator',
  description: 'Create professional proposals and statements of work. Define scope, deliverables, timeline, and pricing to close more deals.',
  shortDescription: 'Generate winning proposals',
  category: 'sales',
  tags: ['proposal', 'sow', 'sales', 'pricing', 'scope'],
  icon: 'FileText',
  emoji: '📝',
  color: '#3B82F6',
  estimatedMinutes: 15,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'client-details',
      title: 'Client Details',
      description: 'Who is this proposal for?',
      icon: 'User',
      components: [
        {
          type: 'text_input',
          stateKey: 'clientName',
          props: {
            label: 'Client Company Name',
            placeholder: 'Enter client company',
            required: true,
          },
        },
        {
          type: 'text_input',
          stateKey: 'clientContact',
          props: {
            label: 'Primary Contact',
            placeholder: 'Contact name',
          },
        },
        {
          type: 'text_input',
          stateKey: 'projectName',
          props: {
            label: 'Project Name',
            placeholder: 'e.g., Website Redesign, AI Implementation',
            required: true,
          },
        },
      ],
    },
    {
      id: 'project-overview',
      title: 'Project Overview',
      description: 'Describe the engagement',
      icon: 'FileText',
      components: [
        {
          type: 'textarea',
          stateKey: 'projectBackground',
          props: {
            label: 'Project Background',
            placeholder: 'Why is the client pursuing this project? What problem are they solving?',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'objectives',
          props: {
            label: 'Project Objectives',
            placeholder: 'What are the main goals and desired outcomes?',
            required: true,
          },
        },
      ],
    },
    {
      id: 'scope',
      title: 'Scope & Deliverables',
      description: 'Define what you will deliver',
      icon: 'Package',
      components: [
        {
          type: 'tag_input',
          stateKey: 'deliverables',
          props: {
            label: 'Key Deliverables (press Enter after each)',
            placeholder: 'e.g., Strategy document, Implementation plan',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'scopeDetails',
          props: {
            label: 'Scope Details',
            placeholder: 'Describe the work included in detail',
          },
        },
        {
          type: 'textarea',
          stateKey: 'outOfScope',
          props: {
            label: 'Out of Scope (Exclusions)',
            placeholder: "What's explicitly NOT included?",
          },
        },
      ],
    },
    {
      id: 'approach',
      title: 'Approach & Methodology',
      description: 'How will you execute?',
      icon: 'Route',
      components: [
        {
          type: 'card_selector',
          stateKey: 'methodology',
          props: {
            label: 'Project Approach',
            columns: 2,
            options: [
              { id: 'agile', label: 'Agile / Iterative', icon: '🔄', description: 'Sprints, continuous delivery' },
              { id: 'waterfall', label: 'Waterfall', icon: '📊', description: 'Sequential phases' },
              { id: 'hybrid', label: 'Hybrid', icon: '🔀', description: 'Mix of approaches' },
              { id: 'consulting', label: 'Consulting', icon: '💼', description: 'Advisory engagement' },
            ],
          },
        },
        {
          type: 'tag_input',
          stateKey: 'phases',
          props: {
            label: 'Project Phases (press Enter after each)',
            placeholder: 'e.g., Discovery, Design, Development, Launch',
          },
        },
      ],
    },
    {
      id: 'timeline',
      title: 'Timeline',
      description: 'Project schedule',
      icon: 'Calendar',
      components: [
        {
          type: 'card_selector',
          stateKey: 'duration',
          props: {
            label: 'Estimated Duration',
            columns: 4,
            required: true,
            options: [
              { id: '2weeks', label: '2 Weeks', icon: '⚡' },
              { id: '1month', label: '1 Month', icon: '📅' },
              { id: '3months', label: '3 Months', icon: '📆' },
              { id: '6months', label: '6 Months', icon: '🗓️' },
              { id: 'ongoing', label: 'Ongoing', icon: '♾️' },
            ],
          },
        },
        {
          type: 'date_picker',
          stateKey: 'startDate',
          props: {
            label: 'Proposed Start Date',
          },
        },
      ],
    },
    {
      id: 'pricing',
      title: 'Pricing',
      description: 'Investment details',
      icon: 'DollarSign',
      components: [
        {
          type: 'card_selector',
          stateKey: 'pricingModel',
          props: {
            label: 'Pricing Model',
            columns: 3,
            required: true,
            options: [
              { id: 'fixed', label: 'Fixed Price', icon: '💵', description: 'Set project fee' },
              { id: 'hourly', label: 'Time & Materials', icon: '⏱️', description: 'Hourly rate' },
              { id: 'retainer', label: 'Retainer', icon: '📋', description: 'Monthly fee' },
            ],
          },
        },
        {
          type: 'number_input',
          stateKey: 'totalPrice',
          props: {
            label: 'Total Investment ($)',
            placeholder: 'Enter amount',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'pricingNotes',
          props: {
            label: 'Pricing Notes',
            placeholder: 'Payment terms, milestones, what\'s included/excluded',
          },
        },
      ],
    },
    {
      id: 'generate-proposal',
      title: 'Generate Proposal',
      description: 'AI-generated proposal document',
      icon: 'FileText',
      components: [
        {
          type: 'ai_generate',
          stateKey: 'proposal',
          props: {
            prompt: `Generate a professional project proposal:

## Client
- **Company**: {{clientName}}
- **Contact**: {{clientContact}}
- **Project**: {{projectName}}

## Project Details
**Background**: {{projectBackground}}
**Objectives**: {{objectives}}

## Scope
**Deliverables**: {{deliverables}}
**Details**: {{scopeDetails}}
**Exclusions**: {{outOfScope}}

## Approach
**Methodology**: {{methodology}}
**Phases**: {{phases}}

## Timeline
**Duration**: {{duration}}
**Start Date**: {{startDate}}

## Investment
**Model**: {{pricingModel}}
**Amount**: \${{totalPrice}}
**Notes**: {{pricingNotes}}

---

Create a professional proposal document with:

1. **Cover Page Section** (title, date, prepared for)

2. **Executive Summary** (compelling 2-3 paragraph overview)

3. **Understanding Your Needs** (restate the problem/opportunity)

4. **Proposed Solution** (our approach and what we'll deliver)

5. **Scope of Work**
   - Deliverables (detailed list)
   - What's Included
   - What's Not Included

6. **Methodology & Approach**

7. **Project Timeline**
   - Phases with durations
   - Key milestones

8. **Investment**
   - Pricing breakdown
   - Payment terms

9. **Why Choose Us** (differentiators, relevant experience)

10. **Next Steps** (call to action)

Format as professional markdown. Make it compelling and client-focused.`,
            outputFormat: 'markdown',
            loadingText: 'Generating proposal...',
            autoTrigger: true,
          },
        },
        {
          type: 'ai_summary',
          stateKey: '_proposalDisplay',
          props: {
            sourceKey: 'proposal',
          },
        },
      ],
    },
  ],
  output: {
    type: 'source',
    title: 'Proposal - {{projectName}} for {{clientName}}',
    template: '{{proposal}}',
  },
};

// =============================================================================
// MARKETING CAMPAIGN WORKFLOW
// =============================================================================

export const MARKETING_CAMPAIGN_WORKFLOW: WorkflowDefinition = {
  id: 'marketing-campaign',
  name: 'Marketing Campaign Creator',
  description: 'Plan end-to-end marketing campaigns. Define objectives, audience, channels, messaging, and create a content calendar.',
  shortDescription: 'Plan complete marketing campaigns',
  category: 'marketing',
  tags: ['marketing', 'campaign', 'content', 'strategy', 'planning'],
  icon: 'Megaphone',
  emoji: '📣',
  color: '#EC4899',
  estimatedMinutes: 18,
  difficulty: 'intermediate',
  steps: [
    {
      id: 'campaign-basics',
      title: 'Campaign Basics',
      description: 'Define your campaign',
      icon: 'Target',
      components: [
        {
          type: 'text_input',
          stateKey: 'campaignName',
          props: {
            label: 'Campaign Name',
            placeholder: 'e.g., Q1 Product Launch, Summer Sale',
            required: true,
          },
        },
        {
          type: 'card_selector',
          stateKey: 'campaignObjective',
          props: {
            label: 'Primary Objective',
            columns: 3,
            required: true,
            options: [
              { id: 'awareness', label: 'Brand Awareness', icon: '👁️', description: 'Get seen by new audiences' },
              { id: 'leads', label: 'Lead Generation', icon: '📧', description: 'Capture qualified leads' },
              { id: 'sales', label: 'Drive Sales', icon: '💰', description: 'Convert to customers' },
              { id: 'engagement', label: 'Engagement', icon: '❤️', description: 'Build community' },
              { id: 'retention', label: 'Retention', icon: '🔄', description: 'Keep existing customers' },
              { id: 'launch', label: 'Product Launch', icon: '🚀', description: 'Launch something new' },
            ],
          },
        },
        {
          type: 'textarea',
          stateKey: 'campaignDescription',
          props: {
            label: 'Campaign Description',
            placeholder: 'Briefly describe what this campaign is about and why',
          },
        },
      ],
    },
    {
      id: 'target-audience',
      title: 'Target Audience',
      description: 'Who are you trying to reach?',
      icon: 'Users',
      components: [
        {
          type: 'textarea',
          stateKey: 'audienceDescription',
          props: {
            label: 'Describe Your Target Audience',
            placeholder: 'Demographics, psychographics, behaviors...',
            required: true,
          },
        },
        {
          type: 'tag_input',
          stateKey: 'audiencePainPoints',
          props: {
            label: 'Pain Points (press Enter after each)',
            placeholder: 'What problems do they have?',
          },
        },
        {
          type: 'tag_input',
          stateKey: 'audienceGoals',
          props: {
            label: 'Their Goals (press Enter after each)',
            placeholder: 'What do they want to achieve?',
          },
        },
      ],
    },
    {
      id: 'channels',
      title: 'Channels & Tactics',
      description: 'Where will you reach them?',
      icon: 'Share2',
      components: [
        {
          type: 'checkbox_list',
          stateKey: 'channels',
          props: {
            label: 'Select marketing channels',
            multiSelect: true,
            required: true,
            options: [
              { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
              { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
              { id: 'instagram', label: 'Instagram', icon: '📸' },
              { id: 'facebook', label: 'Facebook', icon: '👥' },
              { id: 'email', label: 'Email Marketing', icon: '📧' },
              { id: 'blog', label: 'Blog/SEO', icon: '✍️' },
              { id: 'paid', label: 'Paid Ads', icon: '💰' },
              { id: 'webinar', label: 'Webinars/Events', icon: '🎥' },
              { id: 'podcast', label: 'Podcast', icon: '🎙️' },
              { id: 'pr', label: 'PR/Media', icon: '📰' },
            ],
          },
        },
      ],
    },
    {
      id: 'messaging',
      title: 'Messaging & Creative',
      description: 'What will you say?',
      icon: 'MessageSquare',
      components: [
        {
          type: 'text_input',
          stateKey: 'headline',
          props: {
            label: 'Core Campaign Headline/Hook',
            placeholder: 'The main message or tagline',
            required: true,
          },
        },
        {
          type: 'textarea',
          stateKey: 'keyMessages',
          props: {
            label: 'Key Messages (2-3 supporting points)',
            placeholder: 'What are the main things you want to communicate?',
          },
        },
        {
          type: 'text_input',
          stateKey: 'cta',
          props: {
            label: 'Call to Action',
            placeholder: 'e.g., Sign up now, Learn more, Get started',
            required: true,
          },
        },
        {
          type: 'card_selector',
          stateKey: 'tone',
          props: {
            label: 'Campaign Tone',
            columns: 3,
            options: [
              { id: 'professional', label: 'Professional', icon: '💼' },
              { id: 'friendly', label: 'Friendly', icon: '😊' },
              { id: 'bold', label: 'Bold/Edgy', icon: '🔥' },
              { id: 'educational', label: 'Educational', icon: '📚' },
              { id: 'inspiring', label: 'Inspiring', icon: '✨' },
              { id: 'urgent', label: 'Urgent', icon: '⚡' },
            ],
          },
        },
      ],
    },
    {
      id: 'timeline-budget',
      title: 'Timeline & Budget',
      description: 'When and how much?',
      icon: 'Calendar',
      components: [
        {
          type: 'card_selector',
          stateKey: 'campaignDuration',
          props: {
            label: 'Campaign Duration',
            columns: 4,
            required: true,
            options: [
              { id: '1week', label: '1 Week', icon: '📅' },
              { id: '2weeks', label: '2 Weeks', icon: '📆' },
              { id: '1month', label: '1 Month', icon: '🗓️' },
              { id: '3months', label: 'Quarter', icon: '📊' },
            ],
          },
        },
        {
          type: 'date_picker',
          stateKey: 'launchDate',
          props: {
            label: 'Launch Date',
          },
        },
        {
          type: 'card_selector',
          stateKey: 'budget',
          props: {
            label: 'Campaign Budget',
            columns: 4,
            options: [
              { id: 'minimal', label: 'Minimal', description: '< $1K', icon: '💵' },
              { id: 'small', label: 'Small', description: '$1K - $5K', icon: '💰' },
              { id: 'medium', label: 'Medium', description: '$5K - $25K', icon: '🏦' },
              { id: 'large', label: 'Large', description: '$25K+', icon: '💎' },
            ],
          },
        },
      ],
    },
    {
      id: 'generate-plan',
      title: 'Campaign Plan',
      description: 'AI-generated campaign strategy',
      icon: 'FileText',
      components: [
        {
          type: 'ai_generate',
          stateKey: 'campaignPlan',
          props: {
            prompt: `Create a comprehensive marketing campaign plan:

## Campaign Overview
- **Name**: {{campaignName}}
- **Objective**: {{campaignObjective}}
- **Description**: {{campaignDescription}}

## Target Audience
{{audienceDescription}}
- **Pain Points**: {{audiencePainPoints}}
- **Goals**: {{audienceGoals}}

## Channels
{{channels}}

## Messaging
- **Headline**: {{headline}}
- **Key Messages**: {{keyMessages}}
- **CTA**: {{cta}}
- **Tone**: {{tone}}

## Timeline & Budget
- **Duration**: {{campaignDuration}}
- **Launch**: {{launchDate}}
- **Budget**: {{budget}}

---

Generate a detailed campaign plan with:

1. **Executive Summary**
   - Campaign at a glance
   - Expected outcomes

2. **Audience Deep Dive**
   - Detailed persona
   - Where they hang out
   - What resonates with them

3. **Channel Strategy**
   - For each selected channel:
     - Role in the campaign
     - Content types
     - Posting frequency
     - Key tactics

4. **Content Calendar** (markdown table)
   - Week-by-week breakdown
   - Content pieces per channel
   - Key milestones

5. **Messaging Framework**
   - Primary message
   - Supporting messages
   - Proof points
   - Objection handling

6. **Creative Brief**
   - Visual direction
   - Copy guidelines
   - Examples of headlines/hooks

7. **Success Metrics**
   - KPIs to track
   - Targets by channel
   - How to measure

8. **Budget Allocation**
   - Breakdown by channel
   - Production vs. distribution

Format as professional markdown.`,
            outputFormat: 'markdown',
            loadingText: 'Creating your campaign plan...',
            autoTrigger: true,
          },
        },
        {
          type: 'ai_summary',
          stateKey: '_planDisplay',
          props: {
            sourceKey: 'campaignPlan',
          },
        },
      ],
    },
  ],
  output: {
    type: 'source',
    title: 'Campaign Plan - {{campaignName}}',
    template: '{{campaignPlan}}',
  },
};

// =============================================================================
// EXPORT ALL BUILT-IN WORKFLOWS
// =============================================================================

export const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  CONTEXT_SETUP_WORKFLOW,
  CLIENT_DISCOVERY_WORKFLOW,
  COMPETITIVE_LANDSCAPE_WORKFLOW,
  PROPOSAL_GENERATOR_WORKFLOW,
  MARKETING_CAMPAIGN_WORKFLOW,
];

/**
 * Get a built-in workflow by ID
 */
export function getBuiltinWorkflow(id: string): WorkflowDefinition | undefined {
  return BUILTIN_WORKFLOWS.find(w => w.id === id);
}

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: string): WorkflowDefinition[] {
  return BUILTIN_WORKFLOWS.filter(w => w.category === category);
}
