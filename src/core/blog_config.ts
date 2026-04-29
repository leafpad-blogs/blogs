/**
 * Configuration options for BlogsService.
 * All fields are optional — omit to use defaults from BLOG_CONFIG.
 */
export type BlogsConfigType = {
  baseUrl?: string;
  apiPath?: string;
  defaultLimit?: number;
  maxPostsForFiltering?: number;
  cacheRevalidateInterval?: number;
  staticParamsRevalidateInterval?: number;
  wordsPerMinute?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Default configuration values used by BlogsService.
 * Override individual fields by passing a BlogsConfigType to the constructor.
 */
export const BLOG_CONFIG = {
  baseUrl: "https://leafpad.io",
  apiPath: '/api/public/v1/post',
  defaultLimit: 10,
  maxPostsForFiltering: 50,
  cacheRevalidateInterval: 300, // 5 minutes
  staticParamsRevalidateInterval: 3600, // 1 hour
  wordsPerMinute: 200,
  timeout: 10000, // 10 seconds
  retries: 3
} as const;