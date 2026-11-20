import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RichTextRenderer, safeRichTextHref } from '../../src/components/common/rich-text-renderer';

describe('rich text renderer links', () => {
  it.each(['https://example.com', 'http://example.com', 'mailto:press@example.com'])(
    'allows %s links',
    (href) => expect(safeRichTextHref(href)).toBe(href)
  );
  it('rejects javascript links', () => expect(safeRichTextHref('javascript:alert(1)')).toBeNull());
  it('rejects relative and malformed links', () => {
    expect(safeRichTextHref('/team')).toBeNull();
    expect(safeRichTextHref('not a url')).toBeNull();
  });
  it('renders only paragraph, emphasis, and safe links', () => {
    const view = renderToStaticMarkup(
      createElement(RichTextRenderer, {
        value: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'hello', marks: [{ type: 'bold' }, { type: 'italic' }] },
                {
                  type: 'text',
                  text: ' unsafe',
                  marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
                },
              ],
            },
          ],
        },
      })
    );
    expect(view).toContain('<p><em><strong>hello</strong></em> unsafe</p>');
    expect(view).not.toContain('<a');
  });
});
