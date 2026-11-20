import { createElement, type ReactNode } from 'react';

interface RichNode {
  type?: string;
  text?: string;
  marks?: { type?: string; attrs?: { href?: string } }[];
  content?: RichNode[];
}

export function safeRichTextHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? href : null;
  } catch {
    return null;
  }
}

function renderNode(node: RichNode, key: string): ReactNode {
  if (node.type === 'text') {
    let content: ReactNode = node.text ?? '';
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === 'bold')
        content = createElement('strong', { key: `${key}-${index}` }, content);
      else if (mark.type === 'italic')
        content = createElement('em', { key: `${key}-${index}` }, content);
      else if (mark.type === 'link') {
        const href = safeRichTextHref(mark.attrs?.href);
        if (href) {
          content = createElement(
            'a',
            { href, rel: 'noopener noreferrer', key: `${key}-${index}` },
            content
          );
        }
      }
    }
    return content;
  }
  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === 'paragraph') return createElement('p', { key }, children);
  if (node.type === 'doc') return createElement('div', { key }, children);
  return null;
}

export function RichTextRenderer({ value }: { value: unknown }) {
  const root = value as RichNode | null;
  return root?.type === 'doc' ? renderNode(root, 'doc') : null;
}
