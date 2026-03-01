import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import { Lock, Plus, Eye, FileText, LogOut, Loader2, Pencil, Trash2, Github, Search, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthorsManager } from "@/admin/components/AuthorsManager";
import { AuthorProfile } from "@/admin/types";
import { validatePin, isAdminAuthenticated, setAdminAuthenticated } from "@/admin/utils/auth";
import {
  getGithubFileContent,
  getGithubFileSha,
  pushToGithub,
  deleteFromGithub,
} from "@/admin/utils/github";
import { generateSlug } from "@/admin/utils/helpers";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "authors">("create");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Post states
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Authors (loaded for use in post author dropdown)
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [isCustomAuthor, setIsCustomAuthor] = useState(false);
  
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "News",
    content: "",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    author: "The Scoop KE",
    tags: ""
  });

  const [inlineAuthor, setInlineAuthor] = useState<AuthorProfile>({
    name: "",
    role: "Contributing Writer",
    bio: "",
    avatar: "/api/placeholder/150/150",
    location: "Kenya",
    socials: { twitter: "", linkedin: "", email: "" }
  });

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  async function loadData() {
    setPosts(getAllPosts());
    
    const categoriesJson = await getGithubFileContent('content/categories.json');
    if (categoriesJson) {
      try { setCategories(JSON.parse(categoriesJson)); } catch { setCategories(defaultCategories); }
    } else {
      setCategories(defaultCategories);
    }

    const authorsJson = await getGithubFileContent('content/authors.json');
    if (authorsJson) {
      try { setAuthors(JSON.parse(authorsJson)); } catch { setAuthors({}); }
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
    if (validatePin(pin)) {
      setIsAuthenticated(true);
      setAdminAuthenticated(true);
      loadData();
      setError("");
    } else {
      setError("Invalid PIN. Try again.");
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminAuthenticated(false);
    setActiveTab("create");
    resetPostForm();
  };

  const submitToIndexNow = async (slug: string) => {
    try {
      await supabase.functions.invoke('index-now', {
        body: { urls: [`/article/${slug}`] }
      });
    } catch (err) {
      console.error("IndexNow error", err);
    }
  };

  // POST MANAGEMENT

  const handlePublish = async (isUpdate: boolean) => {
    if (!newPost.title || !newPost.content) {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    setIsPublishing(true);
    let finalAuthorName = newPost.author;

    try {
      if (isCustomAuthor && inlineAuthor.name) {
        finalAuthorName = inlineAuthor.name;
        const updatedAuthors = { ...authors, [inlineAuthor.name]: inlineAuthor };
        const authorsSha = await getGithubFileSha('content/authors.json');
        await pushToGithub(
          'content/authors.json', 
          JSON.stringify(updatedAuthors, null, 2), 
          `Add new author via post builder: ${inlineAuthor.name}`, 
          authorsSha || undefined
        );
        setAuthors(updatedAuthors);
      }

      if (newPost.category && !categories.some(c => c.name === newPost.category)) {
        const newSlug = generateSlug(newPost.category);
        const newCategories = [...categories, { name: newPost.category, slug: newSlug }];
        const categoriesSha = await getGithubFileSha('content/categories.json');
        await pushToGithub('content/categories.json', JSON.stringify(newCategories, null, 2), `Add category: ${newPost.category}`, categoriesSha);
        setCategories(newCategories);
      }

      const postSlug = newPost.slug || generateSlug(newPost.title);
      const filePath = `content/posts/${postSlug}.md`;

      const tagsFormatted = (newPost.tags || "")
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .join(', ');

      const markdown = `---
title: "${newPost.title}"
slug: "${postSlug}"
excerpt: "${newPost.excerpt}"
author: "${finalAuthorName}"
image: "${newPost.image}"
category: "${newPost.category}"
date: "${editingPost?.date || new Date().toISOString().split('T')[0]}"
tags: [${tagsFormatted}]
---

${newPost.content}`;

      if (isUpdate && editingPost && editingPost.slug !== postSlug) {
        const oldSha = await getGithubFileSha(`content/posts/${editingPost.slug}.md`);
        if (oldSha) await deleteFromGithub(`content/posts/${editingPost.slug}.md`, `Delete old slug`, oldSha);
      }

      const sha = await getGithubFileSha(filePath);
      await pushToGithub(filePath, markdown, `${isUpdate ? 'Update' : 'Publish new'} story: ${newPost.title}`, sha);
      await submitToIndexNow(postSlug);

      toast({ title: "Published!", description: "Story is now live on Za Ndani." });
      resetPostForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const confirmDeletePost = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(true);
    const post = posts.find(p => p.slug === showDeleteConfirm);
    if (!post) return;

    try {
      const sha = await getGithubFileSha(`content/posts/${post.slug}.md`);
      if (sha) {
        await deleteFromGithub(`content/posts/${post.slug}.md`, `Delete story: ${post.title}`, sha);
        toast({ title: "Deleted", description: "Story removed from GitHub." });
        loadData();
      }
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(null);
      setIsDeleting(false);
    }
  };

  const resetPostForm = () => {
    setNewPost({
      title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      author: "The Scoop KE", tags: ""
    });
    setEditingPost(null);
    setIsCustomAuthor(false);
    setInlineAuthor({
      name: "", role: "Contributing Writer", bio: "", avatar: "/api/placeholder/150/150", location: "Kenya",
      socials: { twitter: "", linkedin: "", email: "" }
    });
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      category: post.category || "News",
      content: post.content || "",
      image: post.image || "",
      author: post.author || "The Scoop KE",
      tags: post.tags ? post.tags.join(", ") : ""
    });
    setIsCustomAuthor(false);
    setActiveTab("create");
  };

  const filteredPosts = posts
    .filter(post => {
      const title = post.title || "";
      const category = post.category || "";
      const search = searchTerm.toLowerCase();
      const matchesSearch = title.toLowerCase().includes(search) || category.toLowerCase().includes(search);
      const matchesCategory = filterCategory === "All" || category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-surface/50">
          <div className="bg-surface p-10 border border-divider rounded-3xl shadow-soft max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-serif font-bold text-center mb-2">Za Ndani Admin</h1>
            <p className="text-center text-muted-foreground mb-8">Enter your 4-digit PIN</p>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl border border-divider bg-background text-center text-4xl font-mono tracking-widest mb-4"
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-destructive text-center mb-6">{error}</p>}
              <Button type="submit" className="w-full py-6 text-lg gradient-primary">Unlock Dashboard</Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-screen bg-surface">
        {/* Sidebar for Large Screens */}
        <div className="w-72 border-r border-divider bg-surface p-6 hidden lg:flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-primary rounded-xl" />
            <div>
              <div className="font-serif font-bold text-xl">Za Ndani</div>
              <div className="text-xs text-muted-foreground -mt-1">ADMIN</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mb-8">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-4">
                Content Management
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${activeTab === "create" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <Plus className="w-5 h-5" />
                  Create New Story
                </button>
                <button
                  onClick={() => setActiveTab("manage")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${activeTab === "manage" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <FileText className="w-5 h-5" />
                  Manage Posts ({posts.length})
                </button>
              </nav>
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-4">
                Author Management
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("authors")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors ${activeTab === "authors" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    Manage Authors
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "authors" ? "bg-primary-foreground/20" : "bg-muted-foreground/10"}`}>
                    {Object.keys(authors).length}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          <Button variant="outline" onClick={handleLogout} className="mt-auto shrink-0 border-divider">
            <LogOut className="w-4 h-4 mr-2" /> Secure Logout
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6 lg:mb-10">
              <div>
                <h1 className="text-4xl font-serif font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Push stories live to Za Ndani in seconds</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="lg:hidden">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="flex lg:hidden overflow-x-auto gap-2 mb-8 pb-2">
              <Button 
                variant={activeTab === "create" ? "default" : "outline"} 
                onClick={() => setActiveTab("create")}
                className="whitespace-nowrap rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Post
              </Button>
              <Button 
                variant={activeTab === "manage" ? "default" : "outline"} 
                onClick={() => setActiveTab("manage")}
                className="whitespace-nowrap rounded-2xl"
              >
                <FileText className="w-4 h-4 mr-2" /> Manage Posts
              </Button>
              <Button 
                variant={activeTab === "authors" ? "default" : "outline"} 
                onClick={() => setActiveTab("authors")}
                className="whitespace-nowrap rounded-2xl"
              >
                <Users className="w-4 h-4 mr-2" /> Authors
              </Button>
            </div>

            {/* TAB: CREATE / EDIT POST */}
            {activeTab === "create" && (
              <div className="grid lg:grid-cols-2 gap-8 w-full">
                <div className="bg-surface border border-divider rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Story Title" value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background text-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                      <input type="text" placeholder="Slug (auto-generated)" value={newPost.slug}
                        onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                    </div>

                    <textarea placeholder="Short excerpt that appears on homepage" value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-divider bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" rows={3}
                    />

                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                          value={isCustomCategory ? 'add-new' : newPost.category}
                          onChange={(e) => {
                            if (e.target.value === 'add-new') {
                              setIsCustomCategory(true);
                              setNewPost({ ...newPost, category: "" });
                            } else {
                              setIsCustomCategory(false);
                              setNewPost({ ...newPost, category: e.target.value });
                            }
                          }}
                          className="w-full p-4 rounded-2xl border border-divider bg-background outline-none"
                        >
                          {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                          <option value="add-new">+ New Category</option>
                        </select>
                        
                        <select
                          value={isCustomAuthor ? 'add-new' : newPost.author}
                          onChange={(e) => {
                            if (e.target.value === 'add-new') {
                              setIsCustomAuthor(true);
                              setNewPost({ ...newPost, author: "" });
                            } else {
                              setIsCustomAuthor(false);
                              setNewPost({ ...newPost, author: e.target.value });
                            }
                          }}
                          className="w-full p-4 rounded-2xl border border-divider bg-background outline-none"
                        >
                          <option value="The Scoop KE">The Scoop KE (Default)</option>
                          {Object.keys(authors)
                            .filter(name => name !== "The Scoop KE")
                            .map(authorName => (
                            <option key={authorName} value={authorName}>{authorName}</option>
                          ))}
                          <option value="add-new">+ Add New Author</option>
                        </select>

                        <input type="text" placeholder="Tags (comma separated)" value={newPost.tags}
                          onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-divider bg-background outline-none"
                        />
                      </div>

                      {isCustomAuthor && (
                        <div className="p-5 bg-muted/40 border border-primary/20 rounded-2xl space-y-4 shadow-inner">
                          <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                            <Users className="w-4 h-4" /> Quick Add Author Profile
                          </h4>
                          <p className="text-xs text-muted-foreground -mt-2">This author will be permanently saved.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name *" value={inlineAuthor.name}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, name: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            />
                            <input type="text" placeholder="Role / Title" value={inlineAuthor.role}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, role: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            />
                          </div>
                          <textarea placeholder="Short Bio *" value={inlineAuthor.bio}
                            onChange={(e) => setInlineAuthor({ ...inlineAuthor, bio: e.target.value })}
                            className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none" rows={2}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Avatar URL" value={inlineAuthor.avatar}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, avatar: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm font-mono outline-none"
                            />
                            <input type="text" placeholder="Location" value={inlineAuthor.location}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, location: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Featured Image URL</label>
                      <div className="flex gap-3">
                        <input type="text" placeholder="https://..." value={newPost.image}
                          onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                          className="flex-1 p-4 rounded-2xl border border-divider bg-background font-mono outline-none"
                        />
                        {newPost.image && (
                          <img src={newPost.image} alt="preview" className="w-16 h-16 object-cover rounded-2xl border border-divider" />
                        )}
                      </div>
                    </div>

                    <textarea placeholder="Full story content (Markdown supported)" value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full p-4 rounded-3xl border border-divider bg-background font-mono text-sm leading-relaxed outline-none" rows={14}
                    />

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-divider">
                      <Button variant="outline" onClick={resetPostForm} className="flex-1">Clear Form</Button>
                      <Button onClick={() => handlePublish(!!editingPost)} disabled={isPublishing} className="flex-1 gradient-primary">
                        {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <Github className="mr-2" />}
                        {editingPost ? 'Update Story' : 'Publish to GitHub'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-surface border border-divider rounded-3xl p-8 hidden lg:block shadow-sm">
                  <div className="sticky top-8">
                    <div className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-bold">LIVE PREVIEW</div>
                    <div className="bg-background rounded-2xl overflow-hidden border border-divider shadow-inner">
                      {newPost.image && (
                        <img src={newPost.image} alt="preview" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-6">
                        <div className="font-serif text-2xl font-bold leading-tight mb-3">{newPost.title || "Your title will appear here"}</div>
                        <div className="text-sm text-muted-foreground mb-4">{newPost.excerpt || "Excerpt preview..."}</div>
                        <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: newPost.content.replace(/\n/g, '<br>') }} />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-6 flex items-center justify-center gap-1"><Eye className="w-3 h-3"/> Preview updates live as you type</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANAGE POSTS */}
            {activeTab === "manage" && (
              <div className="bg-surface border border-divider rounded-3xl p-6 lg:p-8 shadow-sm w-full">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Search stories by title or category..."
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-divider bg-background outline-none focus:border-primary"
                    />
                  </div>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-6 py-4 rounded-2xl border border-divider bg-background outline-none"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map(post => (
                    <div key={post.slug} className="bg-background border border-divider rounded-3xl overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                      {post.image && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <AdminBadge>{post.category}</AdminBadge>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <div className="font-medium line-clamp-2 mb-3 leading-snug">{post.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
                          <Users className="w-3.5 h-3.5" />
                          <span className="truncate">{post.author}</span>
                          <span>•</span>
                          <span>{post.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPost(post)} className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/20">
                            <Pencil className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(post.slug)} className="flex-1 text-destructive hover:bg-destructive/10 hover:border-destructive/20">
                            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-20">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No stories match your search</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANAGE AUTHORS — fully modular */}
            {activeTab === "authors" && (
              <AuthorsManager
                onAuthorsLoaded={(loaded) => setAuthors(loaded)}
              />
            )}

          </div>
        </div>
      </div>

      {/* Delete Post Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Delete this story?"
        description="This action cannot be undone. The post will be permanently removed from GitHub."
        isLoading={isDeleting}
        confirmLabel="Yes, Delete"
        onConfirm={confirmDeletePost}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </Layout>
  );
}

function AdminBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
      {children}
    </span>
  );
}
