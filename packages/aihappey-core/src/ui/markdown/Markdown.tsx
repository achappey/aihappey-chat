import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useTheme } from "aihappey-components";
import { CodeBlock } from "./Codeblock";
import rehypeHighlight from "rehype-highlight";
import "@google/model-viewer";

// Extend sanitizer to allow <details> and <summary>
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
    "audio",
    "source",
    "video",
    "iframe",
    "model-viewer", // 👈 nieuw
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height"], // ← overwrite
    audio: [
      ...(defaultSchema.attributes?.audio ?? []),
      "controls",
      "src",
      "type",
      "style",
    ],
    source: [...(defaultSchema.attributes?.source ?? []), "src", "type"],
    video: [
      "src",
      "controls",
      "autoplay",
      "loop",
      "muted",
      "playsinline",
      "poster",
      "width",
      "height",
      "style",
    ],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "allowfullscreen",
      "frameborder",
    ],
    // 👇 belangrijkste stukje: sta attributes van <model-viewer> toe
    "model-viewer": [
      "src",
      "alt",
      "camera-controls",
      "auto-rotate",
      "shadow-intensity",
      "exposure",
      "environment-image",
      "poster",
      "ar",
      "style",
      "class",
      "width",
      "height",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data", "blob"], // 👈 key line
  },
};

export const Markdown = ({ text, status }: { text: string, status?: string }) => {
  const { Image } = useTheme();
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeHighlight]}
      urlTransform={(uri) => uri}
      components={{
        code: ({ node, className = "", children, ...props }) => {
          const match = /language-(\w+)/.exec(className);
          const language = match?.[1] ?? "plaintext";

          return (
            <CodeBlock language={language} {...props} status={status}>
              {children}
            </CodeBlock>
          );
        },
        p: ({ node, ...props }) => (
          <p style={{ margin: "0.5em 0" }} {...props} />
        ),
        img: ({ node, ...props }) => <Image {...props} fit="contain" />,
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#5eb9f0", textDecoration: "underline" }}
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};