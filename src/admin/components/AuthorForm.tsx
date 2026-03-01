import { Button } from "@/components/ui/button";
import { Loader2, Github, Save } from "lucide-react";
import { AuthorProfile } from "../types";

interface AuthorFormProps {
  formData: AuthorProfile;
  setFormData: (data: AuthorProfile) => void;
  editingKey: string | null;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function AuthorForm({
  formData,
  setFormData,
  editingKey,
  isSaving,
  onSave,
  onCancel,
}: AuthorFormProps) {
  return (
    <div className="bg-surface border border-divider rounded-3xl p-6 lg:p-8 shadow-sm">
      <h2 className="text-2xl font-serif font-bold mb-6">
        {editingKey ? `Editing: ${editingKey}` : "Add New Author"}
      </h2>

      <div className="space-y-5">
        {/* Name & Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
              placeholder="e.g. Jonathan Mwaniki"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Role / Title *
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
              placeholder="e.g. Senior Editor"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Bio *
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
            rows={3}
            placeholder="Short biography..."
          />
        </div>

        {/* Avatar & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Avatar URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                className="flex-1 p-3.5 rounded-xl border border-divider bg-background font-mono text-sm outline-none focus:border-primary"
                placeholder="/authors/photo.jpg or https://..."
              />
              {formData.avatar && (
                <img
                  src={formData.avatar}
                  alt="preview"
                  className="w-12 h-12 rounded-xl object-cover border border-divider flex-shrink-0"
                />
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background outline-none focus:border-primary"
              placeholder="e.g. Nairobi, Kenya"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="pt-4 border-t border-divider">
          <h4 className="text-sm font-bold mb-4">Social Links (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.socials?.twitter || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socials: { ...formData.socials, twitter: e.target.value },
                })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
              placeholder="Twitter / X URL"
            />
            <input
              type="text"
              value={formData.socials?.linkedin || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socials: { ...formData.socials, linkedin: e.target.value },
                })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
              placeholder="LinkedIn URL"
            />
            <input
              type="email"
              value={formData.socials?.email || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socials: { ...formData.socials, email: e.target.value },
                })
              }
              className="w-full p-3.5 rounded-xl border border-divider bg-background text-sm outline-none focus:border-primary"
              placeholder="Email Address"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel / Clear
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 gradient-primary"
          >
            {isSaving ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Save className="mr-2 w-4 h-4" />
            )}
            {editingKey ? "Update Author Profile" : "Save New Author"}
          </Button>
        </div>
      </div>
    </div>
  );
}
