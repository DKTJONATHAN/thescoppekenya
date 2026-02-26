import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import { Lock, Plus, Eye, FileText, LogOut, Calendar, Tag, User, Image, AlignLeft, Loader2, Pencil, Trash2, X, Github } from "lucide-react";
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
    tags: ""
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
      setError("Invalid PIN.");
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

  const handlePublish = async (isUpdate: boolean) => {
    if (!newPost.title || !newPost.content) {
      alert("Missing title or content.");
      return;
    }

    setIsPublishing(true);
    const postSlug = newPost.slug || generateSlug(newPost.title);
    const filePath = `content/posts/${postSlug}.md`;

    // Safely format tags outside the template literal to avoid syntax breaks
    const tagsFormatted = (newPost.tags || "")
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .join(', ');

    // EXACT FRONTMATTER STRUCTURE
    const markdown = `---
title: "${newPost.title}"
slug: "${postSlug}"
excerpt: "${newPost.excerpt}"
author: "${newPost.author}"
image: "${newPost.image}"
category: "${newPost.category}"
date: "${editingPost?.date || new Date().toISOString().split('T')[0]}"
tags: [${tagsFormatted}]
---

${newPost.content}`;

    try {
      if (newPost.category) {
        const categoryName = newPost.category;
        const existingCat = categories.find(c => c.name === categoryName);
        if (!existingCat) {
          const newSlug = generateSlug(categoryName);
          const newCategories = [...categories, { name: categoryName, slug: newSlug }];
          const categoriesSha = await getGithubFileSha('content/categories.json');
          await pushToGithub('content/categories.json', JSON.stringify(newCategories, null, 2), `Add category: ${categoryName}`, categoriesSha);
          setCategories(newCategories);
        }
      }

      if (isUpdate && editingPost && editingPost.slug !== postSlug) {
        const oldSha = await getGithubFileSha(`content/posts/${editingPost.slug}.md`);
        if (oldSha) await deleteFromGithub(`content/posts/${editingPost.slug}.md`, `Rename slug delete`, oldSha);
      }

      const sha = await getGithubFileSha(filePath);
      await pushToGithub(filePath, markdown, `${isUpdate ? 'Update' : 'Create'} post: ${newPost.title}`, sha);
      await submitToIndexNow(postSlug);

      toast({ title: "Success", description: "Post pushed to GitHub." });
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const resetForm = () => {
    setNewPost({
      title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      author: "The Scoop KE", tags: ""
    });
    setEditingPost(null);
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
    setActiveTab("create");
  };

  const handleDeletePost = (post: Post) => {
    // Add your deletion logic here
    console.log("Delete post placeholder:", post.slug);
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-20">
          <form onSubmit={handleLogin} className="bg-surface p-8 border border-divider rounded-2xl shadow-elevated">
            <h1 className="text-3xl font-serif font-bold mb-6 text-center">Admin Access</h1>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border border-divider bg-background text-center text-3xl font-mono mb-4"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <Button type="submit" className="w-full py-6 text-lg gradient-primary">Unlock Panel</Button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage GitHub content</p>
          </div>
          <Button variant="outline" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
        </div>

        <div className="flex gap-4 mb-8 border-b border-divider">
          <button onClick={() => setActiveTab("create")} className={`px-4 py-2 ${activeTab === "create" ? "border-b-2 border-primary" : ""}`}>Create</button>
          <button onClick={() => setActiveTab("manage")} className={`px-4 py-2 ${activeTab === "manage" ? "border-b-2 border-primary" : ""}`}>Manage ({posts.length})</button>
        </div>

        {activeTab === "create" && (
          <div className="bg-surface p-8 border border-divider rounded-2xl shadow-soft">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })} className="w-full p-3 rounded-xl border border-divider bg-background" />
                <input type="text" placeholder="Slug" value={newPost.slug} onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background font-mono" />
              </div>
              <textarea placeholder="Excerpt" value={newPost.excerpt} onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background" rows={2} />
              <div className="grid md:grid-cols-3 gap-4">
                <select value={isCustomCategory ? 'add-new' : newPost.category} onChange={(e) => e.target.value === 'add-new' ? setIsCustomCategory(true) : (setIsCustomCategory(false), setNewPost({ ...newPost, category: e.target.value }))} className="w-full p-3 rounded-xl border border-divider bg-background">
                  {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  <option value="add-new">New Category...</option>
                </select>
                <input type="text" placeholder="Author" value={newPost.author} onChange={(e) => setNewPost({ ...newPost, author: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background" />
                <input type="text" placeholder="Tags (tag1, tag2)" value={newPost.tags} onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background" />
              </div>
              <input type="text" placeholder="Image URL" value={newPost.image} onChange={(e) => setNewPost({ ...newPost, image: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background font-mono" />
              <textarea placeholder="Content (Markdown)" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} className="w-full p-3 rounded-xl border border-divider bg-background font-mono" rows={10} />
              
              <div className="flex justify-end gap-3 pt-4 border-t border-divider">
                <Button variant="outline" onClick={resetForm}>Clear</Button>
                <Button onClick={() => handlePublish(!!editingPost)} disabled={isPublishing} className="gradient-primary">
                  {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <Github className="mr-2" />} {editingPost ? 'Update' : 'Publish'} to GitHub
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-surface p-8 border border-divider rounded-2xl">
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.slug} className="flex justify-between items-center p-4 border border-divider rounded-xl bg-background">
                  <div>
                    <h3 className="font-bold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">{post.category} • {post.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPost(post)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeletePost(post)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" asChild><a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}