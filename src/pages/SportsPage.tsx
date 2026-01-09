import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueSelector } from "@/components/sports/LeagueSelector";
import { LiveScoresWidget } from "@/components/sports/LiveScoresWidget";
import { FixturesList } from "@/components/sports/FixturesList";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { AIHeadlinesBanner } from "@/components/sports/AIHeadlinesBanner";
import { SportsNewsFeed } from "@/components/sports/SportsNewsFeed";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, useMatchPreview, useMatchReview } from "@/hooks/useSportsData";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export default function SportsPage() {
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiContent, setAiContent] = useState<{ headline: string; content: string } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const previewMutation = useMatchPreview();
  const reviewMutation = useMatchReview();

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setAiContent(null);
  };

  const generateAIContent = async () => {
    if (!selectedMatch) return;
    
    setIsGeneratingAI(true);
    try {
      const isFinished = selectedMatch.status === 'FINISHED';
      const result = isFinished 
        ? await reviewMutation.mutateAsync(selectedMatch)
        : await previewMutation.mutateAsync(selectedMatch);
      setAiContent(result);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const sportsSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": "Sports Hub - Live Scores & Football News",
    "description": "Live football scores, standings, fixtures and AI-powered match analysis from top European leagues.",
    "url": "https://jonathanmwaniki.co.ke/sports",
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsSchema) }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-8 md:py-12 border-b border-divider">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Sports Hub ⚽
              </h1>
              <p className="text-muted-foreground">
                Live scores, standings, fixtures & AI-powered match analysis
              </p>
            </div>
          </div>

          {/* League Selector */}
          <LeagueSelector 
            selected={selectedLeague} 
            onSelect={setSelectedLeague} 
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* AI Headlines Banner */}
              <AIHeadlinesBanner />

              {/* Tabs for different content */}
              <Tabs defaultValue="fixtures" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="fixtures">Fixtures & Results</TabsTrigger>
                  <TabsTrigger value="standings">Standings</TabsTrigger>
                  <TabsTrigger value="news">News</TabsTrigger>
                </TabsList>

                <TabsContent value="fixtures" className="mt-6">
                  <FixturesList 
                    competition={selectedLeague} 
                    onMatchClick={handleMatchClick}
                  />
                </TabsContent>

                <TabsContent value="standings" className="mt-6">
                  <StandingsTable competition={selectedLeague} />
                </TabsContent>

                <TabsContent value="news" className="mt-6">
                  <SportsNewsFeed />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-24">
                <h2 className="text-lg font-bold mb-4">Live Scores</h2>
                <LiveScoresWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-lg">
          {selectedMatch && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  <div className="flex items-center justify-center gap-4 text-lg">
                    <div className="flex items-center gap-2">
                      {selectedMatch.homeTeam.crest && (
                        <img 
                          src={selectedMatch.homeTeam.crest} 
                          alt="" 
                          className="w-8 h-8 object-contain" 
                        />
                      )}
                      <span>{selectedMatch.homeTeam.shortName || selectedMatch.homeTeam.name}</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {selectedMatch.score.fullTime?.home ?? '-'} - {selectedMatch.score.fullTime?.away ?? '-'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{selectedMatch.awayTeam.shortName || selectedMatch.awayTeam.name}</span>
                      {selectedMatch.awayTeam.crest && (
                        <img 
                          src={selectedMatch.awayTeam.crest} 
                          alt="" 
                          className="w-8 h-8 object-contain" 
                        />
                      )}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <p className="text-center text-sm text-muted-foreground">
                  {selectedMatch.competition.name} • Matchday {selectedMatch.matchday}
                </p>

                {/* AI Content Generation */}
                {!aiContent ? (
                  <Button 
                    onClick={generateAIContent} 
                    disabled={isGeneratingAI}
                    className="w-full"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating AI {selectedMatch.status === 'FINISHED' ? 'Review' : 'Preview'}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI {selectedMatch.status === 'FINISHED' ? 'Match Review' : 'Match Preview'}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase">
                        AI {selectedMatch.status === 'FINISHED' ? 'Review' : 'Preview'}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-2">{aiContent.headline}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiContent.content}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
