import { Layout } from "@/components/layout/Layout";
// NOTE: You will need to create the `getAllBriefings` function in your markdown utility file (e.g., `src/lib/markdown.ts`).
// It should be similar to your `getAllPosts` function but read from the `content/briefings` directory.
import { getAllBriefings } from "@/lib/markdown";
import { Headphones, Calendar } from "lucide-react";

// Define the type for a briefing post based on the YAML frontmatter
interface Briefing {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  audio_url: string;
}

const AudioBriefingsPage = () => {
  // Assuming getAllBriefings returns briefings sorted by date, descending
  const briefings: Briefing[] = getAllBriefings();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Weekly Audio Briefings
        </h1>
        <p className="text-muted-foreground mb-8">
          Catch up on the week's top stories with our weekly audio download from Za Ndani.
        </p>

        <div className="space-y-10">
          {briefings.length > 0 ? (
            briefings.map((briefing) => (
              <article key={briefing.slug} className="bg-card p-6 rounded-lg border">
                <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                  {briefing.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(briefing.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <p className="text-muted-foreground mb-5">{briefing.excerpt}</p>
                <audio controls className="w-full" src={briefing.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </article>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-10">
              No audio briefings found. Check back soon!
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AudioBriefingsPage;