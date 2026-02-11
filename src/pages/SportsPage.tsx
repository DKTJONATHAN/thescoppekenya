import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueSelector } from "@/components/sports/LeagueSelector";
import { LiveScoresWidget } from "@/components/sports/LiveScoresWidget";
import { FixturesList } from "@/components/sports/FixturesList";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { AIHeadlinesBanner } from "@/components/sports/AIHeadlinesBanner";
import { SportsNewsFeed } from "@/components/sports/SportsNewsFeed";
import { KenyaSportsSection } from "@/components/sports/KenyaSportsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, useMatchPreview, useMatchReview, usePreloadSportsData } from "@/hooks/useSportsData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Activity, Calendar, Trophy, Newspaper, Flame, TrendingUp } from "lucide-react";

export default function SportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLeague = searchParams.get("league") || "KPL";
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiContent, setAiContent] = useState<{ headline: string; content: string } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const previewMutation = useMatchPreview();
  const reviewMutation = useMatchReview();

  usePreloadSportsData();

  useEffect(() => {
    setSearchParams({ league: selectedLeague }, { replace: true });
  }, [selectedLeague, setSearchParams]);

  const handleLeagueSelect = (code: string) => {
    setSelectedLeague(code);
  };

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

  const isKenyaSelected = selectedLeague === "KPL";

  const sportsSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": "Sports Hub - Live Scores & Football News | The Scoop KE",
    "description": "Live football scores, standings, fixtures and AI-powered match analysis. Kenya's first Sheng sports coverage.",
    "url": "https://thescoopkenya.vercel.app/sports",
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsSchema) }}
      />

      {/* Hero Section - matches main site aesthetic */}
      <div className="bg-surface border-b border-divider py-2 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-4">
          <Badge variant="default" className="gradient-primary text-primary-foreground border-0 rounded-sm font-bold whitespace-nowrap">
            <Activity className="w-3 h-3 mr-1" />
            SPORTS
          </Badge>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <span className="text-sm font-medium text-foreground dark:text-white">
              Live scores, standings, fixtures & AI match analysis
            </span>
          </div>
          <Link to="/sports/live">
            <Badge variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors whitespace-nowrap">
              Live Scores →
            </Badge>
          </Link>
        </div>
      </div>

      <section className="py-6 md:py-10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground dark:text-white flex items-center gap-3">
                <span className="w-1.5 h-9 gradient-primary rounded-full shadow-sm" />
                Sports Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Kila kitu sports — live scores, standings, fixtures na AI match analysis
              </p>
            </div>
          </div>

          {/* League Selector */}
          <LeagueSelector 
            selected={selectedLeague} 
            onSelect={handleLeagueSelect} 
          />
        </div>
      </section>

      {/* Main Content - matches main site grid */}
      <section className="py-8 bg-surface/50 border-y border-divider">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* AI Headlines Banner */}
              <AIHeadlinesBanner />

              {isKenyaSelected ? (
                <KenyaSportsSection />
              ) : (
                <Tabs defaultValue="fixtures" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-6 bg-surface border border-divider rounded-2xl p-1 h-auto">
                    <TabsTrigger value="fixtures" className="gap-2 rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Fixtures</span>
                    </TabsTrigger>
                    <TabsTrigger value="standings" className="gap-2 rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">
                      <Trophy className="w-4 h-4" />
                      <span className="hidden sm:inline">Standings</span>
                    </TabsTrigger>
                    <TabsTrigger value="news" className="gap-2 rounded-xl py-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">
                      <Newspaper className="w-4 h-4" />
                      <span className="hidden sm:inline">News</span>
                    </TabsTrigger>
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
              )}
            </div>

            {/* Sidebar - matches main site sidebar style */}
            <div className="lg:col-span-1 space-y-8">
              <div className="sticky top-24 space-y-8">
                <div className="bg-surface rounded-2xl border border-divider shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-divider">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground dark:text-white">Live Scores</h2>
                  </div>
                  <div className="p-4">
                    <LiveScoresWidget />
                  </div>
                </div>

                {/* Sports CTA */}
                <div className="gradient-primary rounded-2xl p-8 text-primary-foreground shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Flame className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">Sports Kwa Sheng</Badge>
                    <h3 className="text-2xl font-serif font-bold mb-4 leading-tight">
                      AI Match Analysis Kwa Kila Game
                    </h3>
                    <p className="text-sm text-white/80 mb-4">
                      Click any match to generate AI-powered previews na reviews
                    </p>
                  </div>
                </div>
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

                {!aiContent ? (
                  <Button 
                    onClick={generateAIContent} 
                    disabled={isGeneratingAI}
                    className="w-full gradient-primary text-primary-foreground"
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
                  <div className="bg-surface rounded-2xl p-4 border border-divider">
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
