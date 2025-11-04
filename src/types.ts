export type Pagination = {
  limit: number;
  after?: string;
  before?: string;
}

export type BlogsFilterOptions = {

}

export type BlogSearch = {
  filter: BlogsFilterOptions
  pagination?: Pagination;
}

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

export interface BlogTag {
  id: number;
  name: string;
}

export interface BlogSEO {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
}

export interface BlogOrganization {
  id: string;
  name: string;
  slug: string;
}


export interface BlogPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BlogApiResponse {
  posts: BlogPost[];
  pagination: BlogPagination;
  organization: BlogOrganization;
}

// Fetch options
export interface FetchPostsOptions {
  page?: number;
  limit?: number;
  includeHtml?: boolean;
  tags?: string[];
  search?: string;
}

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
  htmlContent?: string;
  createdByUser: {
    name: string;
    image?: string;
  }
}

export interface FetchPostOptions {
  includeHtml?: boolean;
}

export {};
