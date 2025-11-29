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