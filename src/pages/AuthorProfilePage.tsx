import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getLatestPosts } from "@/lib/markdown";
import { ChevronLeft, Mail, Twitter, Linkedin, BookOpen, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
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

export default function AuthorProfilePage() {
  const { authorName } = useParams<{ authorName: string }>();
  const navigate = useNavigate();
  const [authorsDb, setAuthorsDb] = useState<Record<string, AuthorProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  const allPosts = useMemo(() => getLatestPosts(1000), []);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/content/authors.json');
        if (res.ok) {
          const data = await res.json();
          setAuthorsDb(data);
        }
      } catch (e) {
        console.error("Failed to fetch authors.json", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  const { actualAuthorName, authorPosts } = useMemo(() => {
    if (!authorName) return { actualAuthorName: "", authorPosts: [] };

    const posts = allPosts.filter(post => {
      const slugifiedName = post.author.toLowerCase().replace(/\s+/g, '-');
      return slugifiedName === authorName;
    });

    const actualName = posts.length > 0 ? posts[0].author : authorName.replace(/-/g, ' ');

    return { actualAuthorName: actualName, authorPosts: posts };
  }, [authorName, allPosts]);

  const profile = authorsDb[actualAuthorName] || { 
    ...DEFAULT_AUTHOR_PROFILE, 
    name: actualAuthorName 
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p>Loading author details...</p>
        </div>
      </Layout>
    );
  }

  if (authorPosts.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Author Not Found</h1>
          <p className="text-muted-foreground mb-8">We could not find any articles for this author.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{actualAuthorName} - Author Profile | Za Ndani</title>
        <meta name="description" content={`Read all articles written by ${actualAuthorName} on Za Ndani.`} />
        <link rel="canonical" href={`https://zandani.co.ke/author/${authorName}`} />
      </Helmet>

      <div className="bg-muted/50 border-b border-border">
        <div className="container py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container max-w-5xl">
          
          <div className="bg-surface border border-border rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
            <img 
              src={profile.avatar} 
              alt={actualAuthorName}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background shadow-lg flex-shrink-0"
            />
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                {actualAuthorName}
              </h1>
              <div className="text-primary font-medium mb-4 flex items-center justify-center md:justify-start gap-4">
                <span>{profile.role}</span>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                   📍 {profile.location}
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-3">
                {profile.socials?.twitter && (
                  <button onClick={() => window.open(profile.socials?.twitter, '_blank')} className="p-2.5 bg-muted rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Twitter className="w-4 h-4" />
                  </button>
                )}
                {profile.socials?.linkedin && (
                  <button onClick={() => window.open(profile.socials?.linkedin, '_blank')} className="p-2.5 bg-muted rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                )}
                {profile.socials?.email && (
                  <button onClick={() => window.location.href = `mailto:${profile.socials?.email}`} className="p-2.5 bg-muted rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Articles by {actualAuthorName.split(' ')[0]}
              </h2>
              <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {authorPosts.length} Published
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {authorPosts.map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}