import { BLOG_CONFIG, type BlogsConfigType } from './blog_config.js';
import type { BlogApiConfig, BlogPost, FetchPostOptions, FetchPostsOptions, BlogApiResponse, DocsResponse, DocItem } from '../types/types.js';
import BlogApiError from './BlogsError.js';

/**
 * Primary API client for fetching blog content from LeafPad.
 *
 * Handles HTTP requests with timeout, automatic retries (exponential backoff),
 * and structured error reporting via `BlogApiError`.
 *
 * @example
 * ```ts
 * const blogs = new BlogsService('my-org-slug');
 * const { posts } = await blogs.fetchPosts({ limit: 10 });
 * const post = await blogs.fetchBlog('my-post-slug');
 * const { items } = await blogs.fetchDocs();
 * ```
 */
export class BlogsService {

  private config: Required<BlogApiConfig>

  /**
   * @param organizationSlug - Your organization's unique slug from LeafPad.
   * @param blogsConfig - Optional overrides for default configuration values.
   */
  constructor(organizationSlug: string, blogsConfig?: BlogsConfigType) {
    this.config = {
      organizationSlug,
      ...BLOG_CONFIG,
      ...blogsConfig
    }
  }

  /**
   * Build the API URL for blog posts
   */
  private buildUrl(endpoint: string = '', params?: URLSearchParams): string {
    const baseUrl = `${this.config.baseUrl}${this.config.apiPath}/${this.config.organizationSlug}`;
    const url = endpoint ? `${baseUrl}/${endpoint}` : baseUrl;
    return params ? `${url}?${params.toString()}` : url;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          throw new BlogApiError(
            `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
            response.status,
            `HTTP_${response.status}`
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on 4xx errors or abort errors
        if (error instanceof BlogApiError && error.status && error.status < 500) {
          throw error;
        }
        
        if (lastError.name === 'AbortError') {
          throw new BlogApiError('Request timeout', undefined, 'TIMEOUT');
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    clearTimeout(timeoutId);
    throw new BlogApiError(`Failed after ${this.config.retries} attempts: ${lastError.message}`, undefined, 'MAX_RETRIES_EXCEEDED');
  }

  private async fetchItems(options: FetchPostsOptions = {}): Promise<BlogApiResponse> {
    const {
      page = 1,
      limit = this.config.defaultLimit,
      includeHtml = true,
      tags = [],
      search = '',
      docs = false,
      md = false
    } = options;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (includeHtml) {
      params.append('html', Boolean(includeHtml).toString());
    }

    if (md) {
      params.append('md', Boolean(md).toString());
    }
    
    if (tags.length > 0) {
      params.append('tags', tags.join(','));
    }
    
    if (search.trim()) {
      params.append('search', search.trim());
    }

    if (docs) {
      params.append('docs', Boolean(docs).toString());
    }

    const url = this.buildUrl('', params);
    return this.makeRequest<BlogApiResponse>(url);
  }

  /**
   * Fetch documentation posts structured as a hierarchical tree.
   *
   * Posts with a `parentId` are nested inside their parent's `children` array.
   * All levels are sorted by the `position` field (string compare), falling back to `id`.
   *
   * @param options - Same options as fetchPosts (excluding `docs`, which is forced to `true`)
   * @returns Hierarchical `DocItem[]` tree suitable for sidebar rendering
   */
  async fetchDocs(options: FetchPostsOptions = {}): Promise<DocsResponse> {
    const blogsResponse = await this.fetchItems({...options, docs: true });

    const inPlaceSort = (arr: DocItem[], compareFn: (a: any, b: any) => number) => {
      arr.sort(compareFn)
      arr.forEach(item => {
        if(item.children && item.children.length > 0) {
          inPlaceSort(item.children, compareFn)
        }
      })
    }

    const items: {
      [key: number]: { id: number, label: string; slug: string; children: DocItem[]; parentId?: number | undefined, position: string }
    } = {}

    blogsResponse.posts.forEach(post => {
      items[post.id] = { id: post.id, label: post.name, slug: `${post.slug}`, children: [], parentId: post.parentId, position: post.position};
    })

    blogsResponse.posts.forEach(post => {
      if(post.parentId && items[post.id]) {
        items[post.parentId]?.children
          //@ts-ignore
          .push(items[post.id]);
      }
    })

    const docsItems = blogsResponse.posts.filter(post => !post.parentId).map(post => ({
      id: post.id,
      label: post.name,
      slug: post.slug,
      position: post.position,
      children: items[post.id]?.children || []
    })).sort((a, b) => {
      // sort top level items by position or id
      if(a.position) {
        return a.position.localeCompare(b.position)
      }
      return a.id - b.id
    })

    // sort all docs by id and all the deep nested children too
    const sortItems = (a: BlogPost, b: BlogPost) => {
      if(a.position) {
        return a.position.localeCompare(b.position)
      }
      return a.id - b.id
    };
    inPlaceSort(docsItems, sortItems);

    return {
      items: docsItems,
      pagination: blogsResponse.pagination,
      organization: blogsResponse.organization
    };
  }

  /**
   * Fetch a paginated list of published blog posts.
   *
   * @param options.page - Page number (default: 1)
   * @param options.limit - Posts per page (default: config.defaultLimit)
   * @param options.includeHtml - Include pre-rendered HTML content (default: true)
   * @param options.md - Include raw Markdown content (default: false)
   * @param options.tags - Filter by tag names
   * @param options.search - Full-text search query
   * @returns posts[], pagination metadata, and organization info
   */
  async fetchPosts(options: FetchPostsOptions = {}): Promise<BlogApiResponse> {
    return this.fetchItems(options);
  }

  /**
   * Fetch a single blog post by its URL slug.
   *
   * @param slug - The post's URL slug (e.g. 'getting-started')
   * @param options.includeHtml - Include pre-rendered HTML content (default: true)
   * @param options.md - Include raw Markdown content (default: false)
   * @returns The `BlogPost` object, or `null` if not found (404)
   * @throws {BlogApiError} On network errors, timeouts, or non-404 HTTP errors
   */
  async fetchBlog(slug: string, options: FetchPostOptions = {}): Promise<BlogPost | null> {
    const { includeHtml = true } = options;

    const params = new URLSearchParams();
    if (includeHtml) {
      params.append('html', 'true');
    }

    if(options.md) {
      params.append('md', 'true');
    }

    try {
      const url = this.buildUrl(slug, params);
      const post = await this.makeRequest<BlogPost>(url);
      return post;
    } catch (error) {
      throw error;
    }
  }

}