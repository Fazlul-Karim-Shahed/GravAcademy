const ALLOWED_TAGS = new Set(['A', 'BLOCKQUOTE', 'BR', 'CODE', 'EM', 'H1', 'H2', 'H3', 'HR', 'LI', 'OL', 'P', 'PRE', 'S', 'STRONG', 'U', 'UL']);
const ALLOWED_ATTRIBUTES = new Set(['href', 'target', 'rel']);

export function sanitizeRichHtml(input: string): string {
  if (typeof window === 'undefined' || !input) return '';
  const template = document.createElement('template');
  template.innerHTML = input;
  const clean = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) { node.parentNode?.removeChild(node); return; }
    const element = node as HTMLElement;
    if (!ALLOWED_TAGS.has(element.tagName)) {
      while (element.firstChild) element.parentNode?.insertBefore(element.firstChild, element);
      element.remove();
      return;
    }
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (!ALLOWED_ATTRIBUTES.has(name) || (name === 'href' && !/^(https?:|mailto:)/i.test(value))) element.removeAttribute(attribute.name);
    });
    if (element.tagName === 'A') element.setAttribute('rel', 'noopener noreferrer nofollow');
    Array.from(element.childNodes).forEach(clean);
  };
  Array.from(template.content.childNodes).forEach(clean);
  return template.innerHTML;
}
