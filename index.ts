import { BlogsService } from './src/blogs.js';

// Re-export public API from the library's source so consumers can import from the package root.
export * from './src/blogs.js';
export * from './src/blog_config.js';
export * from './src/types.js';
export * from './src/BlogPostFormat.js';
export { default as BlogApiError } from './src/BlogsError.js';


const blogApi = new BlogsService('smler-email')
console.log(blogApi.fetchBlog('untitled-post-1762279327649').then(post => {
  console.log('Fetched blog post:', post);
}).catch(error => {
  console.error('Error fetching blog post:', error.message);
}));

// Note: stylesheet (`style.css`) is included in the package files but cannot be exported from JS.
