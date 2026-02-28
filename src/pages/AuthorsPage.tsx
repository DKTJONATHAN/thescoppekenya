import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { getLatestPosts, Post } from "@/lib/markdown";
import { Eye, BookOpen, TrendingUp, ChevronRight, Award, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";

export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  location: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

const DEFAULT_AUTHOR_PROFILE: AuthorProfile = {
  name: "Guest Contributor",
  role: "Contributing Writer",
  bio: "Contributing writer for Za Ndani bringing you the latest stories.",
  avatar: "/api/placeholder/150/150",
  location: "Kenya",
};

interface AuthorStats {
  name: string;
  totalViews: number;
  articleCount: number;
  latestArticles: Post[];
  profile: AuthorProfile;
}

export default function AuthorsPage() {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [authorsDb, setAuthorsDb] = useState<Record<string, AuthorProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const allPosts = useMemo(() => getLatestPosts(1000), []);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const res = await fetch('/api/get-views');
        if (res.ok) {
          const data = await res.json();
          setViewCounts(data);
        }
      } catch (e) {
        console.error("View fetch failed");
      }
    };

    const fetchAuthors = async () => {
      try {
        // Fetches the JSON file written by your Admin Panel
        const res = await fetch('/content/authors.json');
        if (res.ok) {
          const data = await res.json();
          setAuthorsDb(data);
        }
      } catch (e) {
        console.error("Authors fetch failed, using fallbacks.");
      }
    };

    Promise.all([fetchViews(), fetchAuthors()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const authorsData = useMemo(() => {
    const authorMap = new Map<string, AuthorStats>();

    allPosts.forEach(post => {
      const cleanSlug = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const exactPath = `/article/${cleanSlug}`;
      const pathWithSlash = `/article/${cleanSlug}/`;
      const fallbackPath = `/posts/${cleanSlug}`; 

      let gaViews = viewCounts[exactPath] || 
                    viewCounts[pathWithSlash] || 
                    viewCounts[fallbackPath] || 
                    0;
      
      const postViews = gaViews > 0 ? gaViews : 47;

      if (!authorMap.has(post.author)) {
        authorMap.set(post.author, {
          name: post.author,
          totalViews: 0,
          articleCount: 0,
          latestArticles: [],
          profile: authorsDb[post.author] || { ...DEFAULT_AUTHOR_PROFILE, name: post.author }
        });
      }

      const stats = authorMap.get(post.author)!;
      stats.totalViews += postViews;
      stats.articleCount += 1;
      
      if (stats.latestArticles.length < 3) {
        stats.latestArticles.push(post);
      }
    });

    return Array.from(authorMap.values()).sort((a, b) => b.totalViews - a.totalViews);
  }, [allPosts, viewCounts, authorsDb]);

  const topAuthors = authorsData.slice(0, 3);
  const restAuthors = authorsData.slice(3);

  return (
    <Layout>
      <Helmet>
        <title>Our Authors | Za Ndani</title>
        <meta name="description" content="Meet the writers and journalists behind Za Ndani." />
        <link rel="canonical" href="https://zandani.co.ke/authors" />
      </Helmet>

      <div className="py-12 md:py-20">
        <div className="container max-w-6xl">
          
          <header className="mb-16 text-center max-w-2xl mx-auto">
            <Badge className="mb-6 gradient-primary text-primary-foreground border-0 px-5 py-1.5">
              The Team
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6 text-foreground">
              Meet Our Writers
            </h1>
            <p className="text-xl text-muted-foreground">
              The journalists, developers, and pop culture experts bringing you the freshest stories in Kenya.
            </p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p>Loading author profiles...</p>
            </div>
          ) : (
            <>
              {topAuthors.length > 0 && (
                <section className="mb-24">
                  <div className="flex items-center gap-3 mb-8">
                    <Award className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-serif font-bold text-foreground">Top Voices</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
                    {topAuthors.map((author, index) => {
                      const isFirst = index === 0;
                      
                      return (
                        <div 
                          key={author.name}
                          className={`relative bg-muted/30 border border-border rounded-3xl p-8 flex flex-col justify-between overflow-hidden group hover:border-primary/50 transition-colors ${
                            isFirst ? "md:col-span-2 md:row-span-2" : "md:col-span-1 md:row-span-1"
                          }`}
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                          
                          <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                              <img 
                                src={author.profile.avatar} 
                                alt={author.name}
                                className={`rounded-full object-cover border-4 border-background shadow-md ${isFirst ? 'w-24 h-24' : 'w-16 h-16'}`}
                              />
                              <Badge variant="secondary" className="flex items-center gap-1.5 bg-background shadow-sm">
                                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                Rank #{index + 1}
                              </Badge>
                            </div>
                            
                            <div>
                              <Link to={`/author/${author.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                <h3 className={`font-serif font-bold text-foreground hover:text-primary transition-colors ${isFirst ? 'text-3xl mb-2' : 'text-xl mb-1'}`}>
                                  {author.name}
                                </h3>
                              </Link>
                              <p className="text-primary font-medium text-sm mb-4">{author.profile.role}</p>
                              {isFirst && (
                                <p className="text-muted-foreground mb-8 max-w-md line-clamp-3">
                                  {author.profile.bio}
                                </p>
                              )}
                            </div>

                            <div className="mt-auto pt-6 border-t border-border/50 flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4" />
                                {author.articleCount} Articles
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                {author.totalViews > 999 ? `${(author.totalViews / 1000).toFixed(1)}k` : author.totalViews} Views
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {restAuthors.length > 0 && (
                <section>
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-8 border-b border-border pb-4">
                    All Contributors
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {restAuthors.map((author) => (
                      <Link 
                        key={author.name}
                        to={`/author/${author.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block group bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                      >
                        <div className="flex flex-col items-center text-center">
                          <img 
                            src={author.profile.avatar} 
                            alt={author.name}
                            className="w-20 h-20 rounded-full object-cover mb-4"
                          />
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {author.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 mb-4">
                            {author.profile.role}
                          </p>
                          
                          <div className="w-full pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                            <span>{author.articleCount} posts</span>
                            <span className="flex items-center text-primary group-hover:underline">
                              View Profile <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}