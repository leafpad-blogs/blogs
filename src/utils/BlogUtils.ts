import { attachObserverToTOCLinks } from "./createToc.js";


/**
 * Static utility methods for blog content processing.
 *
 * @example
 * ```ts
 * import BlogUtils from '@leafpad/blogs';
 *
 * BlogUtils.calculateReadTime(post.htmlContent); // '4 min read'
 * BlogUtils.formatDate(post.createdAt);          // 'January 15, 2024'
 * BlogUtils.slugify('Hello World!');             // 'hello-world'
 * ```
 */
export default class BlogUtils {
    /**
   * Utility: Calculate reading time for content
   */
  static calculateReadTime(content: string): string {
    if (!content) return '1 min read';
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 100);
    return `${minutes} min read`;
  }

  /**
   * Utility: Format date for display
   */
  static formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', {
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Utility: Extract text content from HTML
   */
  static extractTextFromHtml(html: string, maxLength?: number): string {
    const text = html.replace(/<[^>]*>/g, '').trim();
    if (maxLength && text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    return text;
  }

  /**
   * Convert text to a URL-safe slug.
   * Lowercases, removes special characters, replaces spaces/underscores with hyphens.
   * @example `"Hello World!"` → `"hello-world"`
   */
  static slugify(text: string): string {
    return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Attach an IntersectionObserver to a TOC element by id.
   * Call this client-side after the page has rendered.
   * @param tocId - The id of the TOC container element (default: 'toc')
   * @returns `{ observer, destroy }` — call `destroy()` on component unmount
   */
  static attachTocListener(tocId: string = 'toc') {
    return attachObserverToTOCLinks(tocId);
  }
}