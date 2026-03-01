import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  title,
  description,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  variant = "destructive",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-8">{description}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={variant}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
