import DOMPurify from "isomorphic-dompurify"

import { cn } from "@/lib/utils"

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "u",
    "s",
    "code",
    "pre",
    "blockquote",
    "a",
    "img",
    "figure",
    "figcaption",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "div",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "rel",
    "src",
    "alt",
    "title",
    "loading",
    "class",
    "style",
    "colspan",
    "rowspan",
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
}

interface ProductDescriptionProps {
  html: string
  className?: string
}

export function ProductDescription({
  html,
  className,
}: ProductDescriptionProps) {
  const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG)

  return (
    <article
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-6",
        "prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mt-12 prose-h3:mb-4",
        "prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed",
        "prose-li:text-base md:prose-li:text-lg",
        "prose-img:rounded-2xl prose-img:my-10",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
