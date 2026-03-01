import { useAuthors } from "../hooks/useAuthors";
import { AuthorList } from "./AuthorList";
import { AuthorForm } from "./AuthorForm";
import { ConfirmDialog } from "./ConfirmDialog";

interface AuthorsManagerProps {
  /** Called when authors are loaded so parent can access the record */
  onAuthorsLoaded?: (authors: Record<string, import("../types").AuthorProfile>) => void;
}

export function AuthorsManager({ onAuthorsLoaded }: AuthorsManagerProps) {
  const {
    authors,
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
    resetForm,
    startEditing,
    saveAuthor,
    confirmDelete,
    syncFromPosts,
    getPostCount,
  } = useAuthors();

  return (
    <>
      <div className="grid lg:grid-cols-12 gap-8 w-full">
        {/* Author List — left panel */}
        <div className="lg:col-span-5">
          <AuthorList
            filteredAuthors={filteredAuthors}
            totalCount={Object.keys(authors).length}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSyncing={isSyncing}
            onSync={syncFromPosts}
            onEdit={(key) => {
              startEditing(key);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onDelete={setDeleteTarget}
            getPostCount={getPostCount}
          />
        </div>

        {/* Author Form — right panel */}
        <div className="lg:col-span-7">
          <AuthorForm
            formData={formData}
            setFormData={setFormData}
            editingKey={editingKey}
            isSaving={isSaving}
            onSave={saveAuthor}
            onCancel={resetForm}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove author?"
        description={`This will delete "${deleteTarget}" from your author database. Their existing posts will keep the author name but won't have a linked profile.`}
        isLoading={isDeleting}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
