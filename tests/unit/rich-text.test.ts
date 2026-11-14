import { describe, expect, it } from 'vitest';

import { richTextSchema } from '../../src/features/content/shared/schemas';

describe('rich text allowlist', () => {
  const text = (href: string) => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href } }] }],
      },
    ],
  });

  it.each(['https://example.com/path', 'http://example.com', 'mailto:press@lumen.example'])(
    'accepts safe href %s',
    (href) => expect(richTextSchema.safeParse(text(href)).success).toBe(true)
  );
  it.each(['javascript:alert(1)', 'data:text/html,bad'])('rejects unsafe href %s', (href) =>
    expect(richTextSchema.safeParse(text(href)).success).toBe(false)
  );
  it('rejects unknown nodes, extra attributes, and malformed marks', () => {
    expect(richTextSchema.safeParse({ type: 'doc', content: [{ type: 'image' }] }).success).toBe(
      false
    );
    expect(richTextSchema.safeParse({ ...text('https://example.com'), extra: true }).success).toBe(
      false
    );
    expect(
      richTextSchema.safeParse({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'x', marks: [[{ type: 'bold' }]] }],
          },
        ],
      }).success
    ).toBe(false);
  });
});
