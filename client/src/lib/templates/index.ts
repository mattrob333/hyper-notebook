/**
 * Document Templates
 *
 * Pre-built templates for common document types.
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'document' | 'report' | 'proposal';
  icon?: string;
  content: string;
  variables?: Array<{
    key: string;
    label: string;
    placeholder: string;
    required?: boolean;
  }>;
}

// Email templates
export const EMAIL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'email-intro',
    name: 'Introduction Email',
    description: 'Professional introduction email for networking',
    category: 'email',
    content: `<p>Hi {{recipientName}},</p>

<p>I hope this email finds you well. My name is {{senderName}}, and I'm reaching out to introduce myself and {{company}}.</p>

<p>{{introBody}}</p>

<p>I'd love to connect and learn more about your work. Would you be available for a brief call this week?</p>

<p>Best regards,<br>{{senderName}}</p>`,
    variables: [
      { key: 'recipientName', label: 'Recipient Name', placeholder: 'John' },
      { key: 'senderName', label: 'Your Name', placeholder: 'Jane Smith' },
      { key: 'company', label: 'Company', placeholder: 'Acme Inc.' },
      { key: 'introBody', label: 'Introduction Body', placeholder: 'A brief introduction about your purpose...' },
    ],
  },
  {
    id: 'email-followup',
    name: 'Follow-up Email',
    description: 'Follow up after a meeting or conversation',
    category: 'email',
    content: `<p>Hi {{recipientName}},</p>

<p>Thank you for taking the time to speak with me {{meetingContext}}. I really enjoyed our conversation about {{topic}}.</p>

<p>As discussed, {{nextSteps}}</p>

<p>Please don't hesitate to reach out if you have any questions.</p>

<p>Best regards,<br>{{senderName}}</p>`,
    variables: [
      { key: 'recipientName', label: 'Recipient Name', placeholder: 'John' },
      { key: 'meetingContext', label: 'Meeting Context', placeholder: 'yesterday' },
      { key: 'topic', label: 'Discussion Topic', placeholder: 'our partnership opportunity' },
      { key: 'nextSteps', label: 'Next Steps', placeholder: 'I will send over the proposal by Friday.' },
      { key: 'senderName', label: 'Your Name', placeholder: 'Jane Smith' },
    ],
  },
  {
    id: 'email-sales',
    name: 'Sales Outreach',
    description: 'Cold outreach for sales',
    category: 'email',
    content: `<p>Hi {{recipientName}},</p>

<p>I noticed {{personalization}} and thought you might be interested in how {{company}} is helping teams like yours {{valueProposition}}.</p>

<p>{{briefPitch}}</p>

<p>Would you be open to a quick 15-minute call to explore if this could be valuable for {{companyName}}?</p>

<p>Best,<br>{{senderName}}</p>`,
    variables: [
      { key: 'recipientName', label: 'Recipient Name', placeholder: 'John' },
      { key: 'personalization', label: 'Personalization', placeholder: 'your recent expansion' },
      { key: 'company', label: 'Your Company', placeholder: 'Acme Inc.' },
      { key: 'valueProposition', label: 'Value Proposition', placeholder: 'increase efficiency by 30%' },
      { key: 'briefPitch', label: 'Brief Pitch', placeholder: 'We recently helped [similar company] achieve [result].' },
      { key: 'companyName', label: 'Their Company', placeholder: 'their company' },
      { key: 'senderName', label: 'Your Name', placeholder: 'Jane Smith' },
    ],
  },
];

// Proposal templates
export const PROPOSAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'proposal-sow',
    name: 'Statement of Work',
    description: 'Professional SOW template',
    category: 'proposal',
    content: `<h1>Statement of Work</h1>

<h2>Project Overview</h2>
<p>{{projectOverview}}</p>

<h2>Scope of Work</h2>
<p>{{scopeOfWork}}</p>

<h2>Deliverables</h2>
<ul>
  <li>{{deliverable1}}</li>
  <li>{{deliverable2}}</li>
  <li>{{deliverable3}}</li>
</ul>

<h2>Timeline</h2>
<p>{{timeline}}</p>

<h2>Investment</h2>
<p>{{investment}}</p>

<h2>Terms & Conditions</h2>
<p>{{terms}}</p>`,
    variables: [
      { key: 'projectOverview', label: 'Project Overview', placeholder: 'Brief description of the project...' },
      { key: 'scopeOfWork', label: 'Scope of Work', placeholder: 'Detailed scope...' },
      { key: 'deliverable1', label: 'Deliverable 1', placeholder: 'First deliverable' },
      { key: 'deliverable2', label: 'Deliverable 2', placeholder: 'Second deliverable' },
      { key: 'deliverable3', label: 'Deliverable 3', placeholder: 'Third deliverable' },
      { key: 'timeline', label: 'Timeline', placeholder: 'Project timeline...' },
      { key: 'investment', label: 'Investment', placeholder: 'Pricing details...' },
      { key: 'terms', label: 'Terms', placeholder: 'Payment terms...' },
    ],
  },
];

// Report templates
export const REPORT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'report-executive-summary',
    name: 'Executive Summary',
    description: 'High-level summary report',
    category: 'report',
    content: `<h1>Executive Summary</h1>

<h2>Overview</h2>
<p>{{overview}}</p>

<h2>Key Findings</h2>
<ul>
  <li>{{finding1}}</li>
  <li>{{finding2}}</li>
  <li>{{finding3}}</li>
</ul>

<h2>Recommendations</h2>
<p>{{recommendations}}</p>

<h2>Next Steps</h2>
<p>{{nextSteps}}</p>`,
    variables: [
      { key: 'overview', label: 'Overview', placeholder: 'Brief overview...' },
      { key: 'finding1', label: 'Finding 1', placeholder: 'First key finding' },
      { key: 'finding2', label: 'Finding 2', placeholder: 'Second key finding' },
      { key: 'finding3', label: 'Finding 3', placeholder: 'Third key finding' },
      { key: 'recommendations', label: 'Recommendations', placeholder: 'Key recommendations...' },
      { key: 'nextSteps', label: 'Next Steps', placeholder: 'Proposed next steps...' },
    ],
  },
];

// Blog/article templates
export const ARTICLE_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Standard blog post structure',
    category: 'document',
    content: `<h1>{{title}}</h1>

<p><em>{{introduction}}</em></p>

<h2>{{section1Title}}</h2>
<p>{{section1Content}}</p>

<h2>{{section2Title}}</h2>
<p>{{section2Content}}</p>

<h2>{{section3Title}}</h2>
<p>{{section3Content}}</p>

<h2>Conclusion</h2>
<p>{{conclusion}}</p>`,
    variables: [
      { key: 'title', label: 'Title', placeholder: 'Your Blog Post Title' },
      { key: 'introduction', label: 'Introduction', placeholder: 'Hook your readers...' },
      { key: 'section1Title', label: 'Section 1 Title', placeholder: 'First Section' },
      { key: 'section1Content', label: 'Section 1 Content', placeholder: 'Content...' },
      { key: 'section2Title', label: 'Section 2 Title', placeholder: 'Second Section' },
      { key: 'section2Content', label: 'Section 2 Content', placeholder: 'Content...' },
      { key: 'section3Title', label: 'Section 3 Title', placeholder: 'Third Section' },
      { key: 'section3Content', label: 'Section 3 Content', placeholder: 'Content...' },
      { key: 'conclusion', label: 'Conclusion', placeholder: 'Wrap up and CTA...' },
    ],
  },
];

// All templates combined
export const ALL_TEMPLATES: DocumentTemplate[] = [
  ...EMAIL_TEMPLATES,
  ...PROPOSAL_TEMPLATES,
  ...REPORT_TEMPLATES,
  ...ARTICLE_TEMPLATES,
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): DocumentTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Apply variables to a template
 */
export function applyTemplateVariables(
  template: DocumentTemplate,
  variables: Record<string, string>
): string {
  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return content;
}

export default ALL_TEMPLATES;
