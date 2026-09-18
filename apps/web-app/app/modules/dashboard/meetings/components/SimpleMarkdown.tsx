import { Fragment, type ReactNode } from "react";

/**
 * Minimal Markdown renderer for LLM output: headings, bullet lists, paragraphs and **bold**.
 * Deliberately tiny — the API returns trusted, schema-validated text and we avoid a runtime dep.
 */
export function SimpleMarkdown({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: string, key: number): ReactNode {
  const lines = block.split("\n").map((line) => line.trimEnd());

  if (lines.every((line) => /^\s*([-*•]|\d+\.)\s+/.test(line))) {
    const ordered = /^\s*\d+\./.test(lines[0]);
    const List = ordered ? "ol" : "ul";
    return (
      <List
        key={key}
        className={
          ordered ? "my-2 list-decimal space-y-1 pl-5" : "my-2 list-disc space-y-1 pl-5"
        }
      >
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>
        ))}
      </List>
    );
  }

  const heading = lines[0].match(/^(#{1,4})\s+(.*)$/);
  if (heading && lines.length === 1) {
    const level = heading[1].length;
    const Tag = `h${Math.min(level + 2, 6)}` as "h3" | "h4" | "h5" | "h6";
    return (
      <Tag key={key} className="mt-4 mb-1 text-base font-semibold first:mt-0">
        {renderInline(heading[2])}
      </Tag>
    );
  }

  return (
    <p key={key} className="my-2 leading-relaxed first:mt-0">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderInline(line)}
        </Fragment>
      ))}
    </p>
  );
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
