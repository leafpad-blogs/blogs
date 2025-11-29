import { BLOG_CONFIG, type BlogsConfigType } from './blog_config.js';
import type { BlogApiConfig, BlogPost, FetchPostOptions, FetchPostsOptions, BlogApiResponse, DocsResponse, DocItem } from '../types/types.js';
import BlogApiError from './BlogsError.js';
import { attachObserverToTOCLinks } from '../utils/createToc.js';

export class BlogsService {

  private config: Required<BlogApiConfig>

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

        console.log('Fetch attempt', attempt, 'for URL:', url);

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
      search = ''
    } = options;

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (includeHtml) {
      params.append('html', 'true');
    }
    
    if (tags.length > 0) {
      params.append('tags', tags.join(','));
    }
    
    if (search.trim()) {
      params.append('search', search.trim());
    }

    const url = this.buildUrl('', params);
    return this.makeRequest<BlogApiResponse>(url);
  }

  async fetchDocs(options: FetchPostsOptions = {}): Promise<DocsResponse> {
    const blogsResponse = await this.fetchItems(options);

    const inPlaceSort = (arr: DocItem[], compareFn: (a: any, b: any) => number) => {
      arr.sort(compareFn)
      arr.forEach(item => {
        if(item.children && item.children.length > 0) {
          inPlaceSort(item.children, compareFn)
        }
      })
    }
    // format response in docs format
    // nest all blogsResponse.posts into children based on DocItem each item has parentId
    const items: {
      [key: number]: { id: number, label: string; path: string; children: DocItem[]; parentId?: number | undefined }
    } = {}

    blogsResponse.posts.forEach(post => {
      items[post.id] = { id: post.id, label: post.name, path: `/docs/${post.slug}`, children: [], parentId: post.parentId };
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
      path: `/docs/${post.slug}`,
      children: items[post.id]?.children || []
    }))

    // sort all docs by id and all the deep nested children too
    const sortItems = (a: any, b: any) => a.id - b.id > 0 ? 1 : -1;
    inPlaceSort(docsItems, sortItems);

    return {
      items: docsItems,
      pagination: blogsResponse.pagination,
      organization: blogsResponse.organization
    };
  }

  /**
   * Fetch multiple blog posts with pagination and filtering
   */
  async fetchPosts(options: FetchPostsOptions = {}): Promise<BlogApiResponse> {
    return this.fetchItems(options);
  }

  async fetchBlog(slug: string, options: FetchPostOptions = {}): Promise<BlogPost | null> {
    const { includeHtml = true } = options;

    const params = new URLSearchParams();
    if (includeHtml) {
      params.append('html', 'true');
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