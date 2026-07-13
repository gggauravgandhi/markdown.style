/** Catalogue of markdown components shown on theme pages, one specimen per
    component. Each entry is raw markdown source; the page generator renders
    it through the pipeline and shows source and render side by side. Adding
    a component later means adding one entry here and nothing else. */
export interface Specimen {
  readonly id: string
  readonly name: string
  readonly markdown: string
}

export const SPECIMENS: readonly Specimen[] = [
  {
    id: 'headings',
    name: 'Headings',
    markdown: `# Quarterly report
## Revenue summary
### Regional breakdown
#### North America`,
  },
  {
    id: 'text',
    name: 'Text',
    markdown:
      'The rollout finished on schedule, and adoption **exceeded projections** within the first week. Support tickets stayed *manageable* throughout, thanks to the `deploy.sh` script.',
  },
  {
    id: 'links',
    name: 'Links',
    markdown: 'Read the [full changelog](https://example.com/changelog) or check the [migration guide](https://example.com/migrate) before upgrading.',
  },
  {
    id: 'unordered-list',
    name: 'Unordered list',
    markdown: `- Draft the proposal
- Circulate for feedback
- Ship the final version`,
  },
  {
    id: 'ordered-list',
    name: 'Ordered list',
    markdown: `1. Clone the repository
2. Install dependencies
3. Run the test suite`,
  },
  {
    id: 'nested-list',
    name: 'Nested list',
    markdown: `- Frontend
  - Component library
  - Routing
- Backend
  - Database schema
  - API endpoints`,
  },
  {
    id: 'task-list',
    name: 'Task list',
    markdown: `- [x] Write the proposal
- [x] Get sign-off from legal
- [ ] Schedule the launch`,
  },
  {
    id: 'blockquote',
    name: 'Blockquote',
    markdown: '> Ship small, ship often, and let the data tell you when to stop.',
  },
  {
    id: 'code-block',
    name: 'Code block',
    markdown: `\`\`\`ts
export function total(items: number[]): number {
  return items.reduce((sum, n) => sum + n, 0)
}
\`\`\``,
  },
  {
    id: 'table',
    name: 'Table',
    markdown: `| Quarter | Revenue | Growth |
|---------|---------|--------|
| Q1      | $2.1M   | 12%    |
| Q2      | $2.6M   | 24%    |`,
  },
  {
    id: 'footnote',
    name: 'Footnote',
    markdown: `Revenue grew faster than any prior quarter.[^1]

[^1]: Figures are unaudited and subject to restatement.`,
  },
  {
    id: 'horizontal-rule',
    name: 'Horizontal rule',
    markdown: `The first half closed strong.

---

The second half opened even stronger.`,
  },
  {
    id: 'image',
    name: 'Image',
    markdown: '![Quarterly revenue chart](/specimen-chart.svg)',
  },
  {
    id: 'math',
    name: 'Math',
    markdown: `The compound growth rate is $r = (V_f/V_i)^{1/n} - 1$.

Averaged across all quarters:

$$\\bar{r} = \\frac{1}{n}\\sum_{i=1}^{n} r_i$$`,
  },
  {
    id: 'mermaid',
    name: 'Mermaid diagram',
    markdown: `\`\`\`mermaid
graph TD
  A[Draft] --> B[Review]
  B --> C[Publish]
\`\`\``,
  },
]
