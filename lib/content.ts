import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { z } from "zod";
import { renderMarkdown } from "@/lib/markdown";

const CONTENT_DIR = path.join(process.cwd(), "content");

const workFrontmatter = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  icon: z.string().optional(),
  href: z.string().optional(),
  order: z.number().default(100),
  draft: z.boolean().default(false),
});

const pageFrontmatter = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export type WorkItem = z.infer<typeof workFrontmatter> & {
  slug: string;
  html: string;
};

export type Page = z.infer<typeof pageFrontmatter> & {
  slug: string;
  html: string;
};

async function readMarkdownFile(...segments: string[]) {
  const filePath = path.join(CONTENT_DIR, ...segments);
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  return { filePath, data, content };
}

function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  filePath: string,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in ${filePath}:\n${issues}`);
  }

  return result.data;
}

async function listSlugs(collection: string): Promise<string[]> {
  const dir = path.join(CONTENT_DIR, collection);
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""));
}

export const getWorkItems = cache(async (): Promise<WorkItem[]> => {
  const slugs = await listSlugs("work");

  const items = await Promise.all(
    slugs.map(async (slug) => {
      const { filePath, data, content } = await readMarkdownFile(
        "work",
        `${slug}.md`,
      );

      return {
        slug,
        ...parseOrThrow(workFrontmatter, data, filePath),
        html: await renderMarkdown(content),
      };
    }),
  );

  return items
    .filter((item) => !item.draft)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
});

export const getPage = cache(async (slug: string): Promise<Page> => {
  const { filePath, data, content } = await readMarkdownFile(
    "pages",
    `${slug}.md`,
  );

  return {
    slug,
    ...parseOrThrow(pageFrontmatter, data, filePath),
    html: await renderMarkdown(content),
  };
});
