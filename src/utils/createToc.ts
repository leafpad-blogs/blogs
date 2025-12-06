/**
 * createTOC(options)
 *
 * A small, dependency-free TOC builder for static/dynamically inserted HTML.
 */
export type TOCOptions = {
  contentSelector: string;
  tocSelector: string;
  headingSelector?: string;
  excludeHeadingLevels?: number[];
  addNumbers?: boolean;
  activeClass?: string;
  linkClass?: string;
  scrollBehavior?: ScrollIntoViewOptions;
};

/**
 * Attach an IntersectionObserver to all anchor links inside the provided
 * TOC container. The function will lookup each link's target id
 * (from data-target-id or href) and observe the corresponding element in
 * the document. When a heading becomes visible, the corresponding link
 * inside the container will receive the `active` class by default (or a
 * custom class provided via options.activeClass). Returns the observer and
 * a destroy() helper to disconnect it when no longer needed.
 */
export function attachObserverToTOCLinks(
  tocId: string,
  options?: {
    activeClass?: string;
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
  }
): { observer: IntersectionObserver; destroy: () => void } {
  const activeClass = options?.activeClass || 'active';
  const tocContainer = tocId.startsWith('#') ? document.getElementById(tocId.slice(1)) : document.getElementById(tocId) as HTMLElement;
  if (!tocContainer) {
    console.error('TOC container not found: ' + tocId);
    return { observer: new IntersectionObserver(() => {}), destroy: () => {} };
  }
  const obsOpts = { root: null, rootMargin: '10% 0px -35% 0px', threshold: 0, ...(options || {}) };

  const links = Array.from(tocContainer.querySelectorAll('a')) as HTMLAnchorElement[];

  // map target id -> link element for quick lookup
  const idToLink: Record<string, HTMLAnchorElement> = {};
  for (const link of links) {
    const idFromData = link.dataset && link.dataset.targetId ? link.dataset.targetId : undefined;
    const href = link.getAttribute('href') || '';
    const id = idFromData || (href.startsWith('#') ? href.slice(1) : undefined);
    if (id) idToLink[id] = link;
  }


  const observer = new IntersectionObserver((entries) => {
    // when a heading becomes visible, mark its corresponding link as active
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement;
      if (!target.id) return;
      if (entry.isIntersecting) {
        console.log("Intersecting:", target.id);
        const link = idToLink[target.id];
        if (link) {
          // remove activeClass from all links first
          for (const l of links) l.classList.remove(activeClass);
          link.classList.add(activeClass);
        }
      }
    });
  }, obsOpts as IntersectionObserverInit);

  // start observing all existing target elements
  for (const id of Object.keys(idToLink)) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }

  const destroy = () => {
    try {
      observer.disconnect();
    } catch (e) {
      // noop
    }
  };

  return { observer, destroy };
}


type HeadingData = {
  id: string;
  text: string;
  level: number;
}

/**
 * Render TOC as an HTML string from HeadingData array.
 * This does not touch the DOM — it simply returns the HTML so you can insert it
 * into your renderer or manipulate it as you wish.
 */
export function renderTOCHTML(
  headingsData: HeadingData[],
  opts?: {
    addNumbers?: boolean;
    linkClass?: string;
  }
): string {
  const addNumbers = opts?.addNumbers || false;
  const linkClass = opts?.linkClass || 'toc-link';


  const escapeHtml = (str: string) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const parts: string[] = [];
  for (const hd of headingsData) {
    const textRaw = hd.text
    const text = escapeHtml(textRaw.trim() || 'Untitled');
    const id = hd.id
    const level = hd.level
    const padding = (level - 1) * 12 + 8;

    parts.push(
      `<a href="#${escapeHtml(id)}" class="${escapeHtml(linkClass)}" data-level="${level}" data-target-id="${escapeHtml(id)}" role="link" style="padding-left: ${padding}px;">${addNumbers ? `${text}` : text}</a>`
    );
  }

  return parts.join('');
}
