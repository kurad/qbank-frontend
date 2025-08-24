import katex from 'katex';

export function renderMath(content) {
  if (!content) return '';
  try {
    // Check for delimiters and render accordingly
    const hasBlockDelimiters = /\\\[.*\\\]|\$\$.*\$\$/s.test(content);
    const hasInlineDelimiters = /\\\(.*\\\)|\$.*\$/s.test(content);

    if (hasBlockDelimiters) {
      // Remove block delimiters for rendering
      const cleaned = content.replace(/^\\\[|\\\]$/g, '').replace(/^\$\$|\$\$$/g, '');
      return katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
    } else if (hasInlineDelimiters) {
      // Remove inline delimiters for rendering
      const cleaned = content.replace(/^\\\(|\\\)$/g, '').replace(/^\$|\$$/g, '');
      return katex.renderToString(cleaned, { displayMode: false, throwOnError: false });
    } else {
      // Render entire content as inline math
      return katex.renderToString(content, { displayMode: false, throwOnError: false });
    }
  } catch (error) {
    return `<span style=\"color:red;\">KaTeX error: ${error.message}</span>`;
  }
}