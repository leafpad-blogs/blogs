import BlogUtils from "./BlogUtils.js";
import { renderTOCHTML } from "./createToc.js";
import type { BlogTag, BlogPost } from "./types.js";

export interface BlogPostHeaderProps {
  title: string;
  description: string | undefined;
  image: string | undefined;
  tags: BlogTag[] | undefined;
  author: string;
  date: string;
  readTime: string;
}

export interface BlogPostContentProps {
  htmlContent: string;
}

export interface BlogPostTagsProps {
  tags?: BlogTag[];
}

export interface BlogPostAuthorProps {
  author: string;
  organization?: string;
}

export interface BlogPostMetaProps {
  date: string;
  readTime: string;
}

export class BlogPostFormat {
  static header({ title, description, image, tags, author, date, readTime }: BlogPostHeaderProps) {
    return `
      <header class="blog-post-header">
        ${BlogPostFormat.headerImage({ image, title })}
        ${BlogPostFormat.headerTitle({ title })}
        ${BlogPostFormat.headerDescription({ description })}
        ${BlogPostFormat.headerTags({ tags })}
        ${BlogPostFormat.headerMeta({ author, date, readTime })}
      </header>
    `;
  }

  static headerImage({ image, title }: { image: string | undefined; title: string }) {
    return image ? `<img src='${image}' alt='${title}' class="blog-post-header-image" />` : "";
  }

  static headerTitle({ title }: { title: string }) {
    return `<h1 class="blog-post-title" id="${BlogUtils.slugify(title)}">${title}</h1>`;
  }

  static headerDescription({ description }: { description: string | undefined }) {
    return description ? `<p class="blog-post-description">${description}</p>` : "";
  }

  static headerTags({ tags }: { tags: BlogTag[] | undefined }) {
    let tagsArr = Array.isArray(tags) ? tags : [];
    if (!tagsArr.length) return "";
    return `<div class="blog-post-tags">${tagsArr.map(tag => `<span class="blog-post-tag">${tag.name}</span>`).join("")}</div>`;
  }

  static headerMeta({ author, date, readTime }: { author: string; date: string; readTime: string }) {
    return `<div class="blog-post-meta">
      <span class="blog-post-date">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
        ${date}
      </span>
      <span class="blog-post-readtime">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>
        ${readTime}
      </span>
    </div>`;
  }

  static content({ htmlContent }: BlogPostContentProps) {
    return `
      <section class="blog-post-content">
        <div>${htmlContent}</div>
      </section>
    `;
  }

  static tags({ tags }: BlogPostTagsProps) {
    let tagsArr = Array.isArray(tags) ? tags : [];
    if (!tagsArr.length) return "";
    return `
      <section class="blog-post-tags-section">
        <h3 class="blog-post-tags-title">Tags</h3>
        <div class="blog-post-tags">
          ${tagsArr.map(tag => `<span class="blog-post-tag">${tag.name}</span>`).join("")}
        </div>
      </section>
    `;
  }

  static author({ author, organization }: BlogPostAuthorProps) {
    return `<div class="blog-post-author-section">
      <div class="blog-post-author-avatar">
        ${author.charAt(0).toUpperCase()}
      </div>
      <div>
        <div class="blog-post-author-name">${author}</div>
        <div class="blog-post-author-organization">
          Published in ${organization}
        </div>
      </div>
    </div>`
  }

  static meta({ date, readTime }: BlogPostMetaProps) {
    return `<div class="blog-post-meta-section"><span class="blog-post-date">${date}</span><span class="blog-post-readtime">${readTime}</span></div>`;
  }

  static divider() {
    return '<hr class="blog-post-divider" />';
  }

  static blogCards({ posts, urlPrefix = "/blog" }: { posts: BlogPost[]; urlPrefix?: string }) {
    return `<div class="blog-cards-container">
      ${posts.map(post => this.blogCard({ post, urlPrefix })).join("")}
    </div>`;
  }

  static blogCard({post, urlPrefix = "/blog"}: {post: BlogPost, urlPrefix?: string}) {
    return `<div class="blog-card">
        <div class="image-container"> 
          ${BlogPostFormat.headerImage({image: post.seo?.image || "", title: post.name})}
        </div>
        <h4 class="post-title">${post.name}</h4>
        <p class="post-excerpt">${post.seo?.description || post.textContent || 
                         (post.htmlContent ? BlogUtils.extractTextFromHtml(post.htmlContent, 150) : '')}</p>
        ${BlogPostFormat.headerMeta({author: post.createdByUser.name, date: BlogUtils.formatDate(post.createdAt), readTime: BlogUtils.calculateReadTime(post.htmlContent || "")})}
        <a href="${urlPrefix}/${post.slug}" class="btn btn-outline btn-sm">Read More</a>
        </div>`
  }

  static blogPostWithToc({ post }: { post: BlogPost }) {
    const htmlContent = this.completeBlogPost({ post });
    const tocHtml = this.toc(post.tocItems);

    return `<div class="blog-post-with-toc">
        ${htmlContent}
      <aside class="blog-post-toc" id="toc">
        <h3 class="blog-post-toc-title">Table of Contents</h3>
        <nav>${tocHtml}</nav>
      </aside>
    </div>`;
  }

  static completeBlogPost({ post }: { post: BlogPost }) {
      const headerHtml = [
      BlogPostFormat.headerTitle({ title: post.name }),
      BlogPostFormat.headerDescription({ description: post.seo?.description || "" }),
      BlogPostFormat.headerMeta({ author: post.createdByUser.name, date: BlogUtils.formatDate(post.updatedAt), readTime: BlogUtils.calculateReadTime(post.htmlContent || "") }),
      BlogPostFormat.author({ author: post.createdByUser.name, organization: post.organization.name }),
      // BlogPostFormat.headerTags({ tags }),
      BlogPostFormat.divider(),
      BlogPostFormat.headerImage({ image: post.seo?.image || "", title: post.name }),
    ].join("");
    return [
      `<div class="blogs-container"><header class="blog-post-header">${headerHtml}</header>`,
      BlogPostFormat.content({ htmlContent: post.htmlContent || "" }),
      BlogPostFormat.tags({ tags: post.tags || [] })+"</div>",
    ].join("");
  }

  static toc(tocItems: { level: number; text: string; id: string }[]) {
    return renderTOCHTML(tocItems)
  }
}
