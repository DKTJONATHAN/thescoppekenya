import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import { Lock, Plus, Eye, Save, FileText, LogOut, Calendar, Tag, User, Image, AlignLeft, Star, Send, Loader2, Pencil, Trash2, X, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Simple hash function for PIN verification
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const VALID_HASHES = [hashPin("1711"), hashPin("2000")];

// Browser-safe Base64 encoding for UTF-8 Markdown content
const utf8ToBase64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const base64ToUtf8 = (base64: string): string => {
  return decodeURIComponent(escape(window.atob(base64)));
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "News",
    content: "",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    author: "The Scoop KE",
    tags: "",
    featured: false
  });

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  async function loadData() {
    setPosts(getAllPosts());
    const categoriesJson = await getGithubFileContent('content/categories.json');
    if (categoriesJson) {
      try {
        setCategories(JSON.parse(categoriesJson));
      } catch (e) {
        console.error('Invalid categories JSON, falling back to defaults');
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }

  useEffect(() => {
    if (newPost.category && !categories.some(cat => cat.name === newPost.category)) {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }
  }, [newPost.category, categories]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = hashPin(pin);
    if (VALID_HASHES.includes(hashedInput)) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      loadData();
      setError("");
    } else {
      setError("Invalid PIN. Please try again.");
    }
    setPin("");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // ==========================================
  // API COMMUNICATION LOGIC
  // ==========================================
  const callGithubApi = async (payload: any) => {
    const res = await fetch('/api/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to communicate with the server");
    }
    return data;
  };

  const getGithubFileSha = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_SHA', path });
      return data.sha;
    } catch (error) {
      console.error("Error fetching SHA:", error);
      return null;
    }
  };

  const getGithubFileContent = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_CONTENT', path });
      return base64ToUtf8(data.content);
    } catch (error) {
      console.error("Error fetching content:", error);
      return null;
    }
  };

  const pushToGithub = async (path: string, content: string, message: string, sha?: string) => {
    return await callGithubApi({
      action: 'PUSH',
      path,
      content: utf8ToBase64(content),
      message,
      sha
    });
  };

  const deleteFromGithub = async (path: string, message: string, sha: string) => {
    return await callGithubApi({
      action: 'DELETE',
      path,
      message,
      sha
    });
  };

  // ==========================================
  // PUBLISHING LOGIC
  // ==========================================
  const submitToIndexNow = async (slug: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('index-now', {
        body: { urls: [`/article/${slug}`] }
      });

      if (error) throw error;
      console.log("IndexNow response:", data);
    } catch (err) {
      console.error("IndexNow submission error:", err);
      toast({
        title: "IndexNow submission failed",
        description: "The post was created but indexing failed. You can retry later.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (isUpdate: boolean) => {
    if (!newPost.title || !newPost.content) {
      alert("Please fill in the title and content.");
      return;
    }

    setIsPublishing(true);
    const postSlug = newPost.slug || generateSlug(newPost.title);
    const filePath = `content/posts/${postSlug}.md`;

    const markdown = `---
title: "${newPost.title}"
slug: "${postSlug}"
excerpt: "${newPost.excerpt}"
image: "${newPost.image}"
category: "${newPost.category}"
author: "${newPost.author}"
date: "${editingPost?.date || new Date().toISOString().split('T')[0]}"
tags: [\( {newPost.tags.split(',').map(t => \`" \){t.trim()}"\`).filter(t => t !== '""').join(', ')}]
featured: ${newPost.featured}
---

${newPost.content}`;

    try {
      // Handle category addition if new
      if (newPost.category) {
        const categoryName = newPost.category;
        const existingCat = categories.find(c => c.name === categoryName);
        if (!existingCat) {
          const newSlug = generateSlug(categoryName);
          const newCategories = [...categories, { name: categoryName, slug: newSlug }];
          const categoriesPath = 'content/categories.json';
          const categoriesSha = await getGithubFileSha(categoriesPath);
          await pushToGithub(categoriesPath, JSON.stringify(newCategories, null, 2), `Add new category: ${categoryName}`, categoriesSha);
          setCategories(newCategories);
        }
      }

      if (isUpdate && editingPost && editingPost.slug !== postSlug) {
        const oldFilePath = `content/posts/${editingPost.slug}.md`;
        const oldSha = await getGithubFileSha(oldFilePath);
        if (oldSha) {
          await deleteFromGithub(oldFilePath, `Delete old post due to slug rename: ${editingPost.slug}`, oldSha);
        }
      }

      const sha = await getGithubFileSha(filePath);
      await pushToGithub(filePath, markdown, `${isUpdate ? 'Update' : 'Create'} post: ${newPost.title}`, sha);
      await submitToIndexNow(postSlug);

      toast({
        title: `Post ${isUpdate ? 'updated' : 'published'} to GitHub!`,
        description: "The deployment process should start automatically.",
      });
      resetForm();
    } catch (error: any) {
      console.error("Publishing error:", error);
      toast({
        title: "Failed to publish",
        description: error.message || "An error occurred while publishing.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreatePost = async () => {
    await handlePublish(false);
  };

  const handleUpdatePost = async () => {
    await handlePublish(true);
  };

  const handleDeletePost = async (post: Post) => {
    const confirmed = window.confirm(`Are you sure you want to completely delete "${post.title}" from GitHub? This action cannot be undone.`);

    if (confirmed) {
      setIsPublishing(true);
      const filePath = `content/posts/${post.slug}.md`;
      
      try {
        const sha = await getGithubFileSha(filePath);
        if (!sha) throw new Error("File not found on GitHub. It might have been deleted already.");

        await deleteFromGithub(filePath, `Delete post: ${post.title}`, sha);

        toast({
          title: "Post deleted from GitHub",
          description: "The file has been removed and your site will update shortly.",
        });
        
        setPosts(posts.filter(p => p.slug !== post.slug));
      } catch (error: any) {
        console.error("Deletion error:", error);
        toast({
          title: "Failed to delete",
          description: error.message || "An error occurred while deleting the post.",
          variant: "destructive",
        });
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const resetForm = () => {
    setNewPost({
      title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      author: "The Scoop KE", tags: "", featured: false
    });
    setEditingPost(null);
    setIsCustomCategory(false);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      content: post.content,
      image: post.image,
      author: post.author,
      tags: post.tags.join(", "),
      featured: post.featured || false
    });
    setActiveTab("create");
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-20">
          <div className="bg-surface rounded-2xl p-8 border border-divider text-center shadow-elevated">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-headline mb-2">Admin Access</h1>
            <p className="text-muted-foreground mb-8">Enter your PIN to access the admin panel</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-full px-6 py-4 rounded-xl border border-divider bg-background text-center text-3xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground py-6 text-lg">
                <Lock className="w-5 h-5 mr-2" />
                Unlock Admin Panel
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-headline">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-divider">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "create"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Post
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "manage"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Manage Posts ({posts.length})
          </button>
        </div>

        {activeTab === "create" && (
          <div className="bg-surface rounded-2xl p-6 md:p-8 border border-divider shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold text-headline flex items-center gap-2">
                {editingPost ? (
                  <><Pencil className="w-5 h-5 text-primary" /> Edit Post</>
                ) : (
                  <><Plus className="w-5 h-5 text-primary" /> Create New Post</>
                )}
              </h2>
              {editingPost && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> Cancel Edit
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {/* Title & Slug */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <AlignLeft className="w-4 h-4" /> Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Tag className="w-4 h-4" /> Slug (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated-slug"
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" /> Excerpt / Summary
                </label>
                <textarea
                  placeholder="A brief summary of the post..."
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Category, Author, Tags */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4" /> Category
                  </label>
                  <select
                    value={isCustomCategory ? 'add-new' : newPost.category}
                    onChange={(e) => {
                      if (e.target.value === 'add-new') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setNewPost({ ...newPost, category: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="add-new">Add New Category</option>
                  </select>
                  {isCustomCategory && (
                    <input
                      type="text"
                      placeholder="Enter new category name"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4" /> Author
                  </label>
                  <input
                    type="text"
                    placeholder="Author name"
                    value={newPost.author}
                    onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Tag className="w-4 h-4" /> Tags
                  </label>
                  <input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Image className="w-4 h-4" /> Featured Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={newPost.image}
                  onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
                {newPost.image && (
                  <div className="mt-3 aspect-video max-w-xs rounded-lg overflow-hidden bg-muted">
                    <img src={newPost.image} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <AlignLeft className="w-4 h-4" /> Content (Markdown)
                </label>
                <textarea
                  placeholder="Write your post content here... Markdown is supported."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                />
              </div>

              {/* Featured checkbox & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-divider">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPost.featured}
                    onChange={(e) => setNewPost({ ...newPost, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-divider text-primary focus:ring-primary"
                  />
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Star className="w-4 h-4 text-primary" />
                    Featured Post
                  </span>
                </label>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm} disabled={isPublishing}>
                    {editingPost ? "Cancel" : "Clear Form"}
                  </Button>
                  <Button 
                    onClick={editingPost ? handleUpdatePost : handleCreatePost} 
                    className="gradient-primary text-primary-foreground" 
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pushing to GitHub...
                      </>
                    ) : editingPost ? (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Update on GitHub
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Publish to GitHub
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-surface rounded-2xl p-6 md:p-8 border border-divider shadow-soft">
            <h2 className="text-xl font-serif font-bold text-headline mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Existing Posts
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No posts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post, index) => (
                  <div 
                    key={post.slug} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background rounded-xl border border-divider hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-headline truncate">{post.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {post.category}
                          </span>
                          <span>•</span>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          {post.featured && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditPost(post)} disabled={isPublishing}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeletePost(post)} className="text-destructive hover:text-destructive" disabled={isPublishing}>
                        {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-xl border border-divider">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Github className="w-4 h-4 flex-shrink-0" />
                <strong>Git Sync Active:</strong> Changes are now pushed securely through your serverless API directly to your GitHub repository.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}