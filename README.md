# @leafpad/blogs

> **LeafPad** — Click. Write. Grow.

TypeScript/JavaScript SDK for integrating [LeafPad](https://leafpad.io) blogs into any web application. Fetch posts, render HTML, build documentation trees, and generate table-of-contents — all with zero runtime dependencies.

## Installation

```bash
npm install @leafpad/blogs
# or
pnpm add @leafpad/blogs
# or
yarn add @leafpad/blogs
```

## Quick Start

```ts
import { BlogsService } from '@leafpad/blogs';

const blogs = new BlogsService('your-org-slug');

// Fetch a list of posts
const { posts, pagination } = await blogs.fetchPosts({ limit: 10 });

// Fetch a single post by slug
const post = await blogs.fetchBlog('my-post-slug', { includeHtml: true });

// Fetch documentation tree
const { items } = await blogs.fetchDocs();
```

## Stylesheet

Import the bundled stylesheet once in your app entry point:

```ts
import '@leafpad/blogs/src/styles/style.css';
```

---

## API Reference

### `BlogsService`

The primary API client. Instantiate with your **organization slug** from LeafPad.

```ts
import { BlogsService } from '@leafpad/blogs';

const blogs = new BlogsService(organizationSlug: string, config?: BlogsConfigType);
```

#### Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `organizationSlug` | `string` | Your organization's unique slug from LeafPad |
| `config` | `BlogsConfigType` (optional) | Override default configuration values |

#### `fetchPosts(options?)`

Fetch a paginated list of published blog posts.

```ts
const { posts, pagination, organization } = await blogs.fetchPosts({
  page: 1,
  limit: 10,
  includeHtml: true,
  md: false,
  tags: ['engineering', 'product'],
  search: 'typescript',
});
```

**Options (`FetchPostsOptions`):**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `page` | `number` | `1` | Page number for pagination |
| `limit` | `number` | `10` | Posts per page |
| `includeHtml` | `boolean` | `true` | Include pre-rendered HTML content |
| `md` | `boolean` | `false` | Include raw Markdown content |
| `tags` | `string[]` | `[]` | Filter by tag names |
| `search` | `string` | `''` | Full-text search query |
| `docs` | `boolean` | `false` | Fetch documentation posts only |

**Returns:** `Promise<BlogApiResponse>` — `{ posts: BlogPost[], pagination: BlogPagination, organization: BlogOrganization }`

#### `fetchBlog(slug, options?)`

Fetch a single blog post by its slug.

```ts
const post = await blogs.fetchBlog('getting-started', { includeHtml: true, md: false });
if (!post) console.log('Post not found');
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `slug` | `string` | — | The post's URL slug |
| `options.includeHtml` | `boolean` | `true` | Include pre-rendered HTML |
| `options.md` | `boolean` | `false` | Include raw Markdown |

**Returns:** `Promise<BlogPost | null>`

#### `fetchDocs(options?)`

Fetch documentation posts structured as a **hierarchical tree** (parent → children, sorted by `position`).

```ts
const { items, pagination, organization } = await blogs.fetchDocs();
// items is a nested DocItem[] tree ready for sidebar rendering
```

**Returns:** `Promise<DocsResponse>` — `{ items: DocItem[], pagination: BlogPagination, organization: BlogOrganization }`

---

### `BlogPostFormat`

Static utility class for rendering blog data as HTML strings. All methods return `string`.

```ts
import { BlogPostFormat } from '@leafpad/blogs';
```

#### Rendering a Complete Post

```ts
// Full post with all sections
const html = BlogPostFormat.completeBlogPost({ post, config });

// Full post with an aside TOC
const html = BlogPostFormat.blogPostWithToc({ post });

// Conditionally include TOC
const html = BlogPostFormat.blogPost({ post, toc: true });
```

**`CompleteBlogPostItemsConfig`** — control which sections are rendered:

```ts
{
  title?: boolean;       // default: true
  description?: boolean; // default: true
  meta?: boolean;        // default: true
  author?: boolean;      // default: true
  divider?: boolean;     // default: true
  image?: boolean;       // default: true
  content?: boolean;     // default: true
  tags?: boolean;        // default: true
}
```

#### Individual Section Methods

| Method | Description |
|--------|-------------|
| `BlogPostFormat.header(props)` | Full header (image + title + description + tags + meta) |
| `BlogPostFormat.headerImage({ image, title })` | `<img>` element or empty string |
| `BlogPostFormat.headerTitle({ title })` | `<h1>` with slugified `id` |
| `BlogPostFormat.headerDescription({ description })` | `<p>` or empty string |
| `BlogPostFormat.headerTags({ tags })` | Tag badge spans |
| `BlogPostFormat.headerMeta({ author, date, readTime })` | Date + read time with icons |
| `BlogPostFormat.content({ htmlContent })` | Content wrapped in `<section>` |
| `BlogPostFormat.tags({ tags })` | Tags section with heading |
| `BlogPostFormat.author({ author, organization })` | Author avatar + name + org |
| `BlogPostFormat.meta({ date, readTime })` | Date and read time display |
| `BlogPostFormat.divider()` | `<hr>` element |
| `BlogPostFormat.toc(tocItems)` | TOC HTML from `tocItems` array |

#### Blog Cards (Listing Pages)

```ts
// Render multiple posts as cards
const html = BlogPostFormat.blogCards({ posts, urlPrefix: '/blog' });

// Render a single card
const html = BlogPostFormat.blogCard({ post, urlPrefix: '/blog' });
```

---

### `BlogUtils`

Static utility helpers for content processing.

```ts
import BlogUtils from '@leafpad/blogs';
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `calculateReadTime` | `(content: string) => string` | Returns `"N min read"` based on word count |
| `formatDate` | `(dateString: string, options?: Intl.DateTimeFormatOptions) => string` | Returns `"January 15, 2024"` |
| `extractTextFromHtml` | `(html: string, maxLength?: number) => string` | Strips tags, optionally truncates |
| `slugify` | `(text: string) => string` | Converts text to `url-safe-slug` |
| `attachTocListener` | `(tocId?: string) => { observer, destroy }` | Attaches scroll observer to TOC |

---

### `renderTOCHTML` / `attachObserverToTOCLinks`

Functions for building and activating a table of contents.

```ts
import { renderTOCHTML, attachObserverToTOCLinks } from '@leafpad/blogs';
```

#### `renderTOCHTML(headingsData, opts?)`

Pure function — returns an HTML string of anchor links. Does **not** touch the DOM.

```ts
const tocHtml = renderTOCHTML(post.tocItems, { addNumbers: false, linkClass: 'toc-link' });
```

Each item in `headingsData`: `{ id: string; text: string; level: number }`

#### `attachObserverToTOCLinks(tocId, options?)`

Attaches an `IntersectionObserver` to an existing TOC element in the DOM. When headings scroll into view, the corresponding TOC link receives the `active` class.

```ts
// Call this client-side after the page has rendered
const { destroy } = attachObserverToTOCLinks('toc', {
  activeClass: 'active',
  rootMargin: '10% 0px -35% 0px',
});

// Cleanup (e.g., on component unmount)
destroy();
```

---

### `BlogApiError`

Custom error class thrown by `BlogsService` on request failures.

```ts
import BlogApiError from '@leafpad/blogs';

try {
  const post = await blogs.fetchBlog('missing-slug');
} catch (error) {
  if (error instanceof BlogApiError) {
    console.log(error.status); // e.g. 404
    console.log(error.code);   // e.g. 'HTTP_404', 'TIMEOUT', 'MAX_RETRIES_EXCEEDED'
  }
}
```

**Error codes:**
- `HTTP_4XX` — Client error (not retried)
- `HTTP_5XX` — Server error (retried with exponential backoff)
- `TIMEOUT` — Request exceeded configured timeout
- `MAX_RETRIES_EXCEEDED` — All retry attempts failed

---

## Configuration

Override defaults by passing a `BlogsConfigType` object to the constructor:

```ts
import { BlogsService, BLOG_CONFIG } from '@leafpad/blogs';

const blogs = new BlogsService('my-org', {
  baseUrl: 'https://leafpad.io',      // API base URL
  defaultLimit: 20,                    // Posts per page
  cacheRevalidateInterval: 300,        // Seconds (for Next.js fetch cache)
  staticParamsRevalidateInterval: 3600,
  timeout: 10000,                      // ms per request
  retries: 3,                          // Retry attempts on 5xx
  wordsPerMinute: 200,                 // For read time calculation
});
```

**Default values (`BLOG_CONFIG`):**

| Key | Default | Description |
|-----|---------|-------------|
| `baseUrl` | `https://leafpad.io` | API base URL |
| `apiPath` | `/api/public/v1/post` | API path |
| `defaultLimit` | `10` | Default page size |
| `maxPostsForFiltering` | `50` | Max posts fetched for filter operations |
| `cacheRevalidateInterval` | `300` | Cache TTL in seconds |
| `staticParamsRevalidateInterval` | `3600` | Static params cache TTL |
| `wordsPerMinute` | `200` | Reading speed for time calculation |
| `timeout` | `10000` | Request timeout in ms |
| `retries` | `3` | Max retry attempts |

---

## CSS Class Reference

All HTML rendered by `BlogPostFormat` uses these classes for styling:

| Class | Element |
|-------|---------|
| `blog-post-header` | Post header wrapper |
| `blog-post-header-image` | Hero image |
| `blog-post-title` | H1 title |
| `blog-post-description` | Description paragraph |
| `blog-post-tags` | Tags container |
| `blog-post-tag` | Individual tag span |
| `blog-post-meta` | Meta (date + read time) wrapper |
| `blog-post-date` | Date span |
| `blog-post-readtime` | Read time span |
| `blog-post-content` | Content section |
| `blog-post-tags-section` | Bottom tags section |
| `blog-post-author-section` | Author container |
| `blog-post-author-avatar` | Author avatar (initials) |
| `blog-post-author-name` | Author name |
| `blog-post-author-organization` | Organization name |
| `blog-post-divider` | HR divider |
| `blog-post-with-toc` | TOC layout wrapper |
| `blog-post-toc` | TOC aside element |
| `blog-post-toc-title` | TOC heading |
| `blogs-container` | Full post container |
| `blog-cards-container` | Cards grid container |
| `blog-card` | Individual card |
| `toc-link` | TOC anchor link |
| `active` | Active TOC link (set by observer) |

---

## Next.js Integration Example

```ts
// app/blogs/page.tsx
import { BlogsService, BlogPostFormat } from '@leafpad/blogs';

const blogs = new BlogsService(process.env.LEAFPAD_ORG_SLUG!);

export default async function BlogsPage() {
  const { posts } = await blogs.fetchPosts({ limit: 12, includeHtml: false });
  const cardsHtml = BlogPostFormat.blogCards({ posts, urlPrefix: '/blogs' });
  return <div dangerouslySetInnerHTML={{ __html: cardsHtml }} />;
}

// app/blogs/[slug]/page.tsx
export default async function BlogPage({ params }: { params: { slug: string } }) {
  const post = await blogs.fetchBlog(params.slug, { includeHtml: true });
  if (!post) notFound();

  const html = BlogPostFormat.blogPost({ post, toc: true });
  return <article dangerouslySetInnerHTML={{ __html: html }} />;
}

// Generate static paths
export async function generateStaticParams() {
  const { posts } = await blogs.fetchPosts({ limit: 50 });
  return posts.map(p => ({ slug: p.slug }));
}
```

---

## License

ISC — [LeafPad](https://leafpad.io)
