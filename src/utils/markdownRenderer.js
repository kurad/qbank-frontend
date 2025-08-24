import { marked } from 'marked';

export function renderMarkdown(content) {
  if (!content) return '';
  try {
    return marked.parse(content);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return content;
  }
}