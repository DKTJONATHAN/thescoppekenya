import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface NewsletterFormProps {
  className?: string;
  tone?: "default" | "onAccent";
}

export function NewsletterForm({ className = "", tone = "default" }: NewsletterFormProps) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }
      setIsSuccess(true);
      setEmail("");
      toast({
        title: data.already ? "Already subscribed" : "Subscribed",
        description: data.message || "The evening brief lands at 19:00 EAT.",
      });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Could not subscribe",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">You're on the evening brief.</span>
      </div>
    );
  }

  const buttonClass =
    tone === "onAccent"
      ? "bg-background text-foreground hover:opacity-90 px-5 h-11"
      : "gradient-primary text-primary-foreground";

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Email
      </label>
      <input
        id={inputId}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="flex-1 px-4 py-2.5 rounded-md border-0 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-background text-sm"
        required
        disabled={isLoading}
      />
      <Button type="submit" className={buttonClass} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Subscribing…
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  );
}
