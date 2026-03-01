import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuthorProfile } from "../types";

interface AuthorListProps {
  filteredAuthors: [string, AuthorProfile][];
  totalCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSyncing: boolean;
  onSync: () => void;
  onEdit: (key: string) => void;
  onDelete: (key: string) => void;
  getPostCount: (name: string) => number;
}

const PAGE_SIZE = 8;

export function AuthorList({
  filteredAuthors,
  totalCount,
  searchTerm,
  setSearchTerm,
  isSyncing,
  onSync,
  onEdit,
  onDelete,
  getPostCount,
}: AuthorListProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(filteredAuthors.length / PAGE_SIZE);
  const pagedAuthors = filteredAuthors.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  // Reset page when search changes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  return (
    <div className="bg-surface border border-divider rounded-3xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Authors
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {totalCount}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="text-xs h-8"
        >
          {isSyncing ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1.5" />
          )}
          Sync from Posts
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search authors..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-divider bg-background outline-none focus:border-primary text-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-3 min-h-[200px]">
        {pagedAuthors.map(([key, author]) => {
          const postCount = getPostCount(author.name);
          return (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-2xl border border-divider bg-background hover:border-primary/40 transition-colors"
            >
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover border border-divider flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{author.name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{author.role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <FileText className="w-3 h-3" />
                    {postCount} {postCount === 1 ? "post" : "posts"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  onClick={() => onEdit(key)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(key)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}

        {filteredAuthors.length === 0 && (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {searchTerm
                ? "No authors match your search."
                : 'No authors found. Click "Sync from Posts" to auto-fill.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-divider">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
