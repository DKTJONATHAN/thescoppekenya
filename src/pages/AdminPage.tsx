import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import { Lock, Plus, Eye, FileText, LogOut, Loader2, Pencil, Trash2, Github, Search, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const utf8ToBase64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const base64ToUtf8 = (base64: string): string => {
  return decodeURIComponent(escape(window.atob(base64)));
};

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

// Extended type for the UI to handle authors that exist in posts but not in authors.json
interface DisplayAuthorProfile extends AuthorProfile {
  isAutoDetected?: boolean;
}

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

  // Author states
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [isSavingAuthor, setIsSavingAuthor] = useState(false);
  const [editingAuthorKey, setEditingAuthorKey] = useState<string | null>(null);
  const [showDeleteAuthorConfirm, setShowDeleteAuthorConfirm] = useState<string | null>(null);
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

  const [newAuthor, setNewAuthor] = useState<DisplayAuthorProfile>({
    name: "",
    role: "Contributing Writer",
    bio: "",
    avatar: "/api/placeholder/150/150",
    location: "Kenya",
    socials: { twitter: "", linkedin: "", email: "" }
  });

  // Used specifically for inline author creation on the posts tab
  const [inlineAuthor, setInlineAuthor] = useState<AuthorProfile>({
    name: "",
    role: "Contributing Writer",
    bio: "",
    avatar: "/api/placeholder/150/150",
    location: "Kenya",
    socials: { twitter: "", linkedin: "", email: "" }
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
    
    // Load Categories
    const categoriesJson = await getGithubFileContent('content/categories.json');
    if (categoriesJson) {
      try {
        setCategories(JSON.parse(categoriesJson));
      } catch (e) {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }

    // Load Authors
    const authorsJson = await getGithubFileContent('content/authors.json');
    if (authorsJson) {
      try {
        setAuthors(JSON.parse(authorsJson));
      } catch (e) {
        setAuthors({});
      }
    }
  }

  // Auto scan posts to find authors not explicitly saved in authors.json
  const allUniqueAuthors = useMemo(() => {
    const merged: Record<string, DisplayAuthorProfile> = { ...authors };
    
    posts.forEach(post => {
      const authorName = post.author || "The Scoop KE";
      if (!merged[authorName]) {
        merged[authorName] = {
          name: authorName,
          role: "Contributor (Auto-detected)",
          bio: "This author was found in existing articles but does not have a formal profile set up yet.",
          avatar: "/api/placeholder/150/150",
          location: "Unknown",
          isAutoDetected: true,
          socials: {}
        };
      }
    });
    
    return merged;
  }, [posts, authors]);

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
      setError("Invalid PIN. Try again.");
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    setActiveTab("create");
    resetPostForm();
    resetAuthorForm();
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const callGithubApi = async (payload: any) => {
    const res = await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "GitHub Error");
    return data;
  };

  const getGithubFileSha = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_SHA', path });
      return data.sha;
    } catch (error) {
      return null;
    }
  };

  const getGithubFileContent = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_CONTENT', path });
      return base64ToUtf8(data.content);
    } catch (error) {
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
    return await callGithubApi({ action: 'DELETE', path, message, sha });
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
      // Handle Inline Custom Author Creation
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

      // Handle Custom Category Creation
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

      // Handle updating existing post with a changed slug
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
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      content: post.content,
      image: post.image,
      author: post.author || "The Scoop KE",
      tags: post.tags ? post.tags.join(", ") : ""
    });
    setIsCustomAuthor(false);
    setActiveTab("create");
  };

  const filteredPosts = posts
    .filter(post => 
      (post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       post.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "All" || post.category === filterCategory)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // AUTHOR MANAGEMENT

  const handleSaveAuthor = async () => {
    if (!newAuthor.name) {
      toast({ title: "Missing Name", description: "Author name is required.", variant: "destructive" });
      return;
    }

    setIsSavingAuthor(true);
    try {
      const updatedAuthors = { ...authors };
      
      // If editing an existing author and changing their name, remove the old key
      if (editingAuthorKey && editingAuthorKey !== newAuthor.name && !newAuthor.isAutoDetected) {
        delete updatedAuthors[editingAuthorKey];
      }
      
      // Strip out the auto detected flag before saving to JSON
      const { isAutoDetected, ...authorDataToSave } = newAuthor;
      updatedAuthors[newAuthor.name] = authorDataToSave;
      
      const sha = await getGithubFileSha('content/authors.json');
      await pushToGithub(
        'content/authors.json', 
        JSON.stringify(updatedAuthors, null, 2), 
        `${editingAuthorKey ? 'Update' : 'Add'} author: ${newAuthor.name}`, 
        sha || undefined
      );

      setAuthors(updatedAuthors);
      toast({ title: "Author Saved!", description: "Author profile updated successfully." });
      resetAuthorForm();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingAuthor(false);
    }
  };

  const confirmDeleteAuthor = async () => {
    if (!showDeleteAuthorConfirm) return;
    setIsDeleting(true);

    try {
      const updatedAuthors = { ...authors };
      delete updatedAuthors[showDeleteAuthorConfirm];

      const sha = await getGithubFileSha('content/authors.json');
      await pushToGithub(
        'content/authors.json', 
        JSON.stringify(updatedAuthors, null, 2), 
        `Delete author: ${showDeleteAuthorConfirm}`, 
        sha || undefined
      );

      setAuthors(updatedAuthors);
      toast({ title: "Deleted", description: "Author removed successfully." });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setShowDeleteAuthorConfirm(null);
      setIsDeleting(false);
    }
  };

  const handleEditAuthor = (authorKey: string) => {
    setEditingAuthorKey(authorKey);
    setNewAuthor(allUniqueAuthors[authorKey]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAuthorForm = () => {
    setEditingAuthorKey(null);
    setNewAuthor({
      name: "", role: "Contributing Writer", bio: "", avatar: "/api/placeholder/150/150", location: "Kenya",
      socials: { twitter: "", linkedin: "", email: "" }
    });
  };

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
              {error && <p className="text-red-500 text-center mb-6">{error}</p>}
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
            {/* Content Management Section */}
            <div className="mb-8">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-4">
                Content Management (CMS)
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

            {/* Author Management Section */}
            <div className="mb-8">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-4">
                Author Management (AMS)
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
                    {Object.keys(allUniqueAuthors).length}
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

            {/* Mobile Tab Navigation (Visible on smaller screens so you can switch panels) */}
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
                <Users className="w-4 h-4 mr-2" /> Manage Authors
              </Button>
            </div>

            {/* TAB: CREATE / EDIT POST */}
            {activeTab === "create" && (
              <div className="grid lg:grid-cols-2 gap-8 w-full">
                {/* Form */}
                <div className="bg-surface border border-divider rounded-3xl p-6 lg:p-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Story Title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background text-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Slug (auto-generated)"
                        value={newPost.slug}
                        onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                    </div>

                    <textarea
                      placeholder="Short excerpt that appears on homepage"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-divider bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      rows={3}
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
                          {Object.keys(allUniqueAuthors)
                            .filter(name => name !== "The Scoop KE")
                            .map(authorName => (
                            <option key={authorName} value={authorName}>{authorName}</option>
                          ))}
                          <option value="add-new">+ Add New Author</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Tags (comma separated)"
                          value={newPost.tags}
                          onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-divider bg-background outline-none"
                        />
                      </div>

                      {/* Inline Author Form */}
                      {isCustomAuthor && (
                        <div className="p-5 bg-muted/40 border border-primary/20 rounded-2xl space-y-4 shadow-inner">
                          <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                            <Users className="w-4 h-4" /> Quick Add Author Profile
                          </h4>
                          <p className="text-xs text-muted-foreground -mt-2">This author will be permanently saved to your AMS directory.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Full Name *"
                              value={inlineAuthor.name}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, name: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Role / Title"
                              value={inlineAuthor.role}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, role: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            />
                          </div>
                          <textarea
                            placeholder="Short Bio *"
                            value={inlineAuthor.bio}
                            onChange={(e) => setInlineAuthor({ ...inlineAuthor, bio: e.target.value })}
                            className="w-full p-3 rounded-xl border border-divider bg-background text-sm outline-none"
                            rows={2}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Avatar URL"
                              value={inlineAuthor.avatar}
                              onChange={(e) => setInlineAuthor({ ...inlineAuthor, avatar: e.target.value })}
                              className="w-full p-3 rounded-xl border border-divider bg-background text-sm font-mono outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Location"
                              value={inlineAuthor.location}
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
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newPost.image}
                          onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                          className="flex-1 p-4 rounded-2xl border border-divider bg-background font-mono outline-none"
                        />
                        {newPost.image && (
                          <img src={newPost.image} alt="preview" className="w-16 h-16 object-cover rounded-2xl border border-divider" />
                        )}
                      </div>
                    </div>

                    <textarea
                      placeholder="Full story content (Markdown supported)"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full p-4 rounded-3xl border border-divider bg-background font-mono text-sm leading-relaxed outline-none"
                      rows={14}
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
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-divider shadow-inner">
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
                    <input
                      type="text"
                      placeholder="Search stories by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-divider bg-background outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
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
                        <div className="h-48 overflow-hidden relative">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-0">{post.category}</Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <div className="font-medium line-clamp-2 mb-3 leading-snug">{post.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
                          <User className="w-3.5 h-3.5" />
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
                          <Button variant="outline" size="sm" asChild className="px-3">
                            <a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
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

            {/* TAB: MANAGE AUTHORS */}
            {activeTab === "authors" && (
              <div className="grid lg:grid-cols-12 gap-8 w-full">
                
                {/* Author List */}
                <div className="lg:col-span-5 bg-surface border border-divider rounded-3xl p-6 h-fit shadow-sm">
                  <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
                    Current Team
                    <Badge variant="secondary" className="bg-primary/10 text-primary">{Object.keys(allUniqueAuthors).length}</Badge>
                  </h2>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {Object.entries(allUniqueAuthors).map(([key, author]) => (
                      <div key={key} className="flex items-center gap-4 p-4 rounded-2xl border border-divider bg-background hover:border-primary/50 transition-colors">
                        <img src={author.avatar} alt={author.name} className="w-12 h-12 rounded-full object-cover border border-divider flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm truncate">{author.name}</h4>
                            {author.isAutoDetected && (
                              <span title="Auto-detected from existing posts. Click Edit to save formally." className="text-amber-500">
                                <AlertCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{author.role}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditAuthor(key)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {!author.isAutoDetected && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive" onClick={() => setShowDeleteAuthorConfirm(key)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {Object.keys(allUniqueAuthors).length === 0 && (
                      <div className="text-center py-10">
                        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No authors found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Author Editor Form */}
                <div className="lg:col-span-7 bg-surface border border-divider rounded-3xl p-6 lg:p-8 shadow-sm">
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    {editingAuthorKey ? `Editing: ${editingAuthorKey}` : "Add New Author"}
                  </h2>
                  
                  {editingAuthorKey && allUniqueAuthors[editingAuthorKey]?.isAutoDetected && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-600/90 dark:text-amber-400/90">
                        <strong>Auto-detected Author:</strong> We found "{editingAuthorKey}" written on some existing posts, but they don't have a formal profile saved yet. Fill out the details below and hit Save to officially add them to your AMS directory.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Full Name *</label>
                        <input
                          type="text"
                          value={newAuthor.name}
                          onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
                          placeholder="e.g. Jonathan Mwaniki"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Role / Title *</label>
                        <input
                          type="text"
                          value={newAuthor.role}
                          onChange={(e) => setNewAuthor({ ...newAuthor, role: e.target.value })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
                          placeholder="e.g. Senior Editor"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Bio *</label>
                      <textarea
                        value={newAuthor.bio}
                        onChange={(e) => setNewAuthor({ ...newAuthor, bio: e.target.value })}
                        className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
                        rows={3}
                        placeholder="Short biography..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Avatar URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newAuthor.avatar}
                            onChange={(e) => setNewAuthor({ ...newAuthor, avatar: e.target.value })}
                            className="flex-1 p-3.5 rounded-xl border border-divider bg-background font-mono text-sm outline-none focus:border-primary"
                            placeholder="/authors/photo.jpg or https://..."
                          />
                          {newAuthor.avatar && (
                            <img src={newAuthor.avatar} alt="preview" className="w-12 h-12 rounded-xl object-cover border border-divider flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Location</label>
                        <input
                          type="text"
                          value={newAuthor.location}
                          onChange={(e) => setNewAuthor({ ...newAuthor, location: e.target.value })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
                          placeholder="e.g. Nairobi, Kenya"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-divider">
                      <h4 className="text-sm font-bold mb-4">Social Links (Optional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={newAuthor.socials?.twitter || ""}
                          onChange={(e) => setNewAuthor({ ...newAuthor, socials: { ...newAuthor.socials, twitter: e.target.value } })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
                          placeholder="Twitter / X URL"
                        />
                        <input
                          type="text"
                          value={newAuthor.socials?.linkedin || ""}
                          onChange={(e) => setNewAuthor({ ...newAuthor, socials: { ...newAuthor.socials, linkedin: e.target.value } })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
                          placeholder="LinkedIn URL"
                        />
                        <input
                          type="email"
                          value={newAuthor.socials?.email || ""}
                          onChange={(e) => setNewAuthor({ ...newAuthor, socials: { ...newAuthor.socials, email: e.target.value } })}
                          className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
                          placeholder="Email Address"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                      <Button variant="outline" onClick={resetAuthorForm} className="flex-1">Cancel / Clear</Button>
                      <Button onClick={handleSaveAuthor} disabled={isSavingAuthor} className="flex-1 gradient-primary">
                        {isSavingAuthor ? <Loader2 className="animate-spin mr-2" /> : <Github className="mr-2" />}
                        {editingAuthorKey ? 'Update Author Profile' : 'Save New Author'}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete Post Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Delete this story?</h3>
            <p className="text-muted-foreground mb-8">This action cannot be undone. The post will be permanently removed from GitHub.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDeletePost} disabled={isDeleting} variant="destructive" className="flex-1">
                {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Author Confirmation Modal */}
      {showDeleteAuthorConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Remove author?</h3>
            <p className="text-muted-foreground mb-8">This will delete their profile data from your configuration. Existing articles won't be deleted, but they will revert to being an "Auto-detected" unconfigured author.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteAuthorConfirm(null)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDeleteAuthor} disabled={isDeleting} variant="destructive" className="flex-1">
                {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Local Badge component
function Badge({ children, variant, className }: any) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}