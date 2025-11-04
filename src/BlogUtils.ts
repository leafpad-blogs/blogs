

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
}