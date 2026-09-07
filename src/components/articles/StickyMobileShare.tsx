import { useCallback, useState } from "react";
import { Facebook, MessageCircle, Share2, Check } from "lucide-react";
import { XIcon } from "@/components/XIcon";

export function StickyMobileShare({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(title);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden safe-bottom border-t border-divider bg-background/95 backdrop-blur-md">
      <div className="container flex items-center justify-between gap-2 py-2.5 px-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Share</span>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/?text=${text}%20${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center border border-divider hover:border-primary hover:text-primary px-3"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center rounded-full bg-muted px-3"
            aria-label="Share on X"
          >
            <XIcon className="w-4 h-4" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center rounded-full bg-blue-600/15 text-blue-600 px-3"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="touch-target inline-flex items-center justify-center rounded-full bg-primary/15 text-primary px-3"
            aria-label="Copy link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
