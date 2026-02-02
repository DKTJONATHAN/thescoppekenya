
## Fix Article Page & Dynamic Homepage Redesign

### Issues Identified

1. **Blank Screen on Article Click**
   - The error "Failed to fetch dynamically imported module" indicates Vite's dynamic import is failing
   - Root cause: Error occurs during ArticlePage.tsx module initialization or a stale Vite cache
   - Solution: Add error boundary around lazy-loaded routes and implement global unhandled promise rejection handling

2. **Homepage Featured Story Logic**
   - Currently: Uses `getFeaturedPosts()` which requires manual `featured: true` flag
   - Required: Top story should be the first post published each day (dynamic selection)

3. **Site Load Speed**
   - Already has lazy loading for pages
   - Can add: Image lazy loading improvements, critical CSS inlining, React Query prefetching

---

### Implementation Plan

#### 1. Fix Blank Screen Issue
**File: `src/App.tsx`**

Add an error boundary component and global error handler for unhandled promise rejections:

```text
+-- ErrorBoundary component
|   - Catches rendering errors in lazy-loaded pages
|   - Shows friendly error message with "Try Again" button
|
+-- Global unhandledrejection handler
|   - Catches async errors that error boundaries miss
|   - Logs error and shows toast notification
|
+-- Suspense with ErrorBoundary wrapper
    - Each lazy route wrapped for graceful failure
```

#### 2. Redesign Homepage with Dynamic Top Story
**File: `src/lib/markdown.ts`**

Add new function for daily top story logic:

```typescript
// Get today's top story (first published post of the day)
export function getTodaysTopStory(): Post | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const posts = getAllPosts();
  const todaysPosts = posts.filter(post => {
    const postDate = new Date(post.date);
    postDate.setHours(0, 0, 0, 0);
    return postDate.getTime() === today.getTime();
  });
  
  // If no posts today, return the most recent post
  return todaysPosts.length > 0 
    ? todaysPosts[todaysPosts.length - 1] // First published (earliest)
    : posts[0]; // Fallback to most recent
}

// Get secondary featured posts (next 4 most recent, excluding top story)
export function getSecondaryPosts(excludeSlug: string, limit = 4): Post[] {
  return getAllPosts()
    .filter(post => post.slug !== excludeSlug)
    .slice(0, limit);
}
```

**File: `src/pages/Index.tsx`**

Update to use dynamic top story:

```text
BEFORE:
- const featuredPosts = getFeaturedPosts();
- Uses featuredPosts[0] as main feature
- Uses featuredPosts.slice(1, 5) for secondary

AFTER:
- const topStory = getTodaysTopStory();
- const secondaryPosts = getSecondaryPosts(topStory?.slug, 4);
- Uses topStory as main feature
- Uses secondaryPosts for secondary grid
```

#### 3. Performance Optimizations
**File: `src/App.tsx`**

Configure React Query with optimized defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**File: `src/components/articles/ArticleCard.tsx`**

Add loading="lazy" and decoding="async" to all images (already present, but verify consistency).

**File: `src/pages/Index.tsx`**

Add image preloading for top story:

```typescript
// Preload top story image
useEffect(() => {
  if (topStory?.image) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = topStory.image;
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }
}, [topStory]);
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add ErrorBoundary, unhandledrejection handler, optimize QueryClient |
| `src/lib/markdown.ts` | Add `getTodaysTopStory()` and `getSecondaryPosts()` functions |
| `src/pages/Index.tsx` | Replace static featured logic with dynamic top story, add image preloading |

---

### Technical Details

#### Error Boundary Component
```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

#### Dynamic Top Story Logic
The "first post published each day" is determined by:
1. Filter posts where `post.date` matches today's date
2. Sort by date ascending (earliest first)
3. Return the first one (earliest published today)
4. If no posts today, fallback to the most recent post overall

This ensures fresh, dynamic content without manual intervention.
