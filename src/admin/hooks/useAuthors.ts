import { useState, useCallback } from "react";
import { AuthorProfile } from "../types";
import {
  getGithubFileContent,
  getGithubFileSha,
  pushToGithub,
} from "../utils/github";
import { useToast } from "@/hooks/use-toast";
import { getAllPosts } from "@/lib/markdown";

const EMPTY_AUTHOR: AuthorProfile = {
  name: "",
  role: "Contributing Writer",
  bio: "",
  avatar: "/api/placeholder/150/150",
  location: "Kenya",
  socials: { twitter: "", linkedin: "", email: "" },
};

export function useAuthors() {
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<AuthorProfile>({ ...EMPTY_AUTHOR });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const loadAuthors = useCallback(async () => {
    const json = await getGithubFileContent("content/authors.json");
    if (json) {
      try {
        setAuthors(JSON.parse(json));
      } catch {
        setAuthors({});
      }
    }
  }, []);

  const resetForm = useCallback(() => {
    setEditingKey(null);
    setFormData({ ...EMPTY_AUTHOR });
  }, []);

  const startEditing = useCallback(
    (key: string) => {
      setEditingKey(key);
      setFormData({ ...authors[key] });
    },
    [authors]
  );

  const saveAuthor = useCallback(async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Name",
        description: "Author name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = { ...authors };
      if (editingKey && editingKey !== formData.name) {
        delete updated[editingKey];
      }
      updated[formData.name] = formData;

      const sha = await getGithubFileSha("content/authors.json");
      await pushToGithub(
        "content/authors.json",
        JSON.stringify(updated, null, 2),
        `${editingKey ? "Update" : "Add"} author: ${formData.name}`,
        sha || undefined
      );

      setAuthors(updated);
      toast({
        title: "Author Saved!",
        description: `${formData.name}'s profile has been saved.`,
      });
      resetForm();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [authors, editingKey, formData, resetForm, toast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const updated = { ...authors };
      delete updated[deleteTarget];

      const sha = await getGithubFileSha("content/authors.json");
      await pushToGithub(
        "content/authors.json",
        JSON.stringify(updated, null, 2),
        `Delete author: ${deleteTarget}`,
        sha || undefined
      );

      setAuthors(updated);
      toast({ title: "Deleted", description: "Author removed." });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  }, [authors, deleteTarget, toast]);

  const syncFromPosts = useCallback(async () => {
    setIsSyncing(true);
    try {
      const posts = getAllPosts();
      const updated = { ...authors };
      let hasChanges = false;

      posts.forEach((post) => {
        const name = post.author || "The Scoop KE";
        if (!updated[name]) {
          updated[name] = {
            name,
            role: "Contributing Writer",
            bio: "Contributing writer for Za Ndani bringing you the latest stories.",
            avatar: "/api/placeholder/150/150",
            location: "Kenya",
            socials: { twitter: "", linkedin: "", email: "" },
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        const sha = await getGithubFileSha("content/authors.json");
        await pushToGithub(
          "content/authors.json",
          JSON.stringify(updated, null, 2),
          "Auto-sync missing authors from existing posts",
          sha || undefined
        );
        setAuthors(updated);
        toast({
          title: "Sync Complete",
          description: "Missing authors have been added.",
        });
      } else {
        toast({
          title: "Up to date",
          description: "All authors are already in the database.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [authors, toast]);

  // Get post count per author
  const getPostCount = useCallback(
    (authorName: string) => {
      const posts = getAllPosts();
      return posts.filter((p) => p.author === authorName).length;
    },
    []
  );

  // Filtered & sorted authors
  const filteredAuthors = Object.entries(authors)
    .filter(([key, author]) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        author.name.toLowerCase().includes(s) ||
        author.role.toLowerCase().includes(s) ||
        author.location.toLowerCase().includes(s)
      );
    })
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));

  return {
    authors,
    setAuthors,
    filteredAuthors,
    editingKey,
    formData,
    setFormData,
    isSaving,
    isSyncing,
    isDeleting,
    deleteTarget,
    setDeleteTarget,
    searchTerm,
    setSearchTerm,
    loadAuthors,
    resetForm,
    startEditing,
    saveAuthor,
    confirmDelete,
    syncFromPosts,
    getPostCount,
  };
}
