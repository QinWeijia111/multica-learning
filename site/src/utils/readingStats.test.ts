import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateReadingStats } from './readingStats.ts';

test('counts program source but excludes Mermaid diagram source', () => {
  const source = `正文

\`\`\`ts
const first = 1;

const second = 2;
\`\`\`

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`;

  const stats = calculateReadingStats(source);

  assert.equal(stats.codeLines, 2);
  assert.equal(stats.proseUnits, 2);
  assert.equal(stats.minutes, 1);
});

test('recognizes a Mermaid fence with trailing metadata deterministically', () => {
  const stats = calculateReadingStats(`\`\`\`mermaid title="示例"
sequenceDiagram
  A->>B: 请求
\`\`\``);

  assert.equal(stats.codeLines, 0);
  assert.equal(stats.proseUnits, 0);
});
