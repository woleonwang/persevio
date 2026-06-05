export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const escapeAttr = (text: string): string => escapeHtml(text);

export const stripMarkdown = (text: string): string =>
  text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

export const truncate = (text: string, max: number): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
};

export const markdownToSimpleHtml = (markdown: string): string => {
  if (!markdown.trim()) return "";

  return markdown
    .split(/\n\n+/)
    .map((paragraph) => {
      const text = escapeHtml(paragraph.trim()).replace(/\n/g, "<br />");
      return text ? `<p>${text}</p>` : "";
    })
    .filter(Boolean)
    .join("\n");
};

export const buildSeoMetaTags = (options: {
  title: string;
  description: string;
  canonicalUrl: string;
  noindex: boolean;
}): string => {
  const { title, description, canonicalUrl, noindex } = options;
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";

  return `
    <meta name="description" content="${escapeAttr(description)}" />
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="${robotsContent}" />
  `;
};

export const injectSeoIntoIndexHtml = (
  indexHtml: string,
  options: {
    title: string;
    description: string;
    canonicalUrl: string;
    noindex: boolean;
    bodyHtml: string;
  },
): string => {
  const { title, description, canonicalUrl, noindex, bodyHtml } = options;
  const metaTags = buildSeoMetaTags({
    title,
    description,
    canonicalUrl,
    noindex,
  });

  return indexHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", `${metaTags}</head>`)
    .replace("<div id=\"root\"></div>", `<div id="root">${bodyHtml}</div>`);
};
