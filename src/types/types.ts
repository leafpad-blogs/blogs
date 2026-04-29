/** Cursor-based pagination parameters for API requests. */
export type Pagination = {
  limit: number;
  after?: string;
  before?: string;
}

/** Options for filtering blog posts. Extend as needed for future filter fields. */
export type BlogsFilterOptions = {

}

export type BlogSearch = {
  filter: BlogsFilterOptions
  pagination?: Pagination;
}

/**
 * Configuration for the BlogsService API client.
 * Pass to `new BlogsService(slug, config)` to override defaults from BLOG_CONFIG.
 */
export interface BlogApiConfig {
  // Organization settings
  organizationSlug: string;
  
  // API settings
  baseUrl?: string;
  apiPath?: string;
  
  // Default fetch options
  defaultLimit?: number;
  maxPostsForFiltering?: number;
  
  // Cache settings (in seconds)
  cacheRevalidateInterval?: number;
  staticParamsRevalidateInterval?: number;
  
  // Content settings
  wordsPerMinute?: number;
  
  // Request settings
  timeout?: number;
  retries?: number;
}

/** A tag associated with a blog post. */
export interface BlogTag {
  id: number;
  name: string;
}

/** SEO metadata for a blog post. All fields optional. */
export interface BlogSEO {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
}

/** The LeafPad organization that owns the blog post. */
export interface BlogOrganization {
  id: string;
  name: string;
  slug: string;
}


/** Pagination metadata returned alongside post lists. */
export interface BlogPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Response shape from fetchPosts — posts with pagination and organization info. */
export interface BlogApiResponse {
  posts: BlogPost[];
  pagination: BlogPagination;
  organization: BlogOrganization;
}

/**
 * A single node in the documentation tree returned by fetchDocs.
 * Children are nested DocItem arrays for subsections.
 */
export type DocItem = {
  id: number;
  label: string;
  path?: string;
  position: string;
  children?: DocItem[];
}

/** Response shape from fetchDocs — hierarchical DocItem tree with pagination. */
export interface DocsResponse {
  items: DocItem[];
  pagination: BlogPagination;
  organization: BlogOrganization;
}

/**
 * Options for fetching a list of posts via fetchPosts or fetchDocs.
 * All fields are optional — omit to use defaults.
 */
export interface FetchPostsOptions {
  page?: number;
  limit?: number;
  includeHtml?: boolean;
  md?: boolean;
  tags?: string[];
  search?: string;
  docs?: boolean;
}

/**
 * A blog post returned by the LeafPad API.
 * `htmlContent` and `md` are only populated when requested via fetch options.
 * `tocItems` is always present but may be empty for posts without headings.
 */
export interface BlogPost {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  hasChildren: boolean;
  seo?: BlogSEO;
  tags: BlogTag[];
  organization: BlogOrganization;
  content?: any;
  parentId?: number;
  position: string;
  htmlContent?: string;
  md?: string;
  textContent?: string;
  tocItems: { level: number; text: string; id: string }[];
  createdByUser: {
    name: string;
    image?: string;
  }
}

/** Options for fetching a single post via fetchBlog. */
export interface FetchPostOptions {
  /** Include pre-rendered HTML. Default: true. */
  includeHtml?: boolean;
  /** Include raw Markdown source. Default: false. */
  md?: boolean;
}

export {};
