import { lazy, Suspense, useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTodayMatches, getMatchStatus, Match } from "@/hooks/useSportsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";

function MatchRow({ match }: { match: Match }) {
  const status = getMatchStatus(match.status);
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";

  return (
    <div
      className={`p-4 rounded-lg border transition-smooth ${
        isLive
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
          : "bg-background border-divider hover:border-primary"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant={isLive ? "destructive" : "secondary"} className="text-xs">
          {status.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(match.utcDate), "HH:mm")}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.homeTeam.crest && (
              <img
                src={match.homeTeam.crest}
                alt={match.homeTeam.name}
                className="w-6 h-6 object-contain"
                loading="lazy"
              />
            )}
            <span className="font-medium truncate">{match.homeTeam.shortName || match.homeTeam.name}</span>
          </div>
          <span className="font-bold text-lg w-8 text-center">
            {match.score.fullTime.home ?? "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.awayTeam.crest && (
              <img
                src={match.awayTeam.crest}
                alt={match.awayTeam.name}
                className="w-6 h-6 object-contain"
                loading="lazy"
              />
            )}
            <span className="font-medium truncate">{match.awayTeam.shortName || match.awayTeam.name}</span>
          </div>
          <span className="font-bold text-lg w-8 text-center">
            {match.score.fullTime.away ?? "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MatchesByLeague({ matches }: { matches: Match[] }) {
  // Group matches by competition
  const grouped = matches.reduce((acc, match) => {
    const key = match.competition.code;
    if (!acc[key]) {
      acc[key] = {
        name: match.competition.name,
        emblem: match.competition.emblem,
        matches: [],
      };
    }
    acc[key].matches.push(match);
    return acc;
  }, {} as Record<string, { name: string; emblem: string; matches: Match[] }>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([code, league]) => (
        <div key={code}>
          <div className="flex items-center gap-2 mb-3">
            {league.emblem && (
              <img src={league.emblem} alt={league.name} className="w-6 h-6" loading="lazy" />
            )}
            <h3 className="font-semibold">{league.name}</h3>
            <Badge variant="outline" className="ml-auto">
              {league.matches.length} match{league.matches.length !== 1 ? "es" : ""}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {league.matches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LiveScoresPage() {
  const { data: matches, isLoading, error, refetch, isFetching } = useTodayMatches();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (!isFetching) {
      setLastUpdated(new Date());
    }
  }, [isFetching]);

  const liveMatches = matches?.filter(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  ) || [];
  const upcomingMatches = matches?.filter(
    (m) => m.status === "SCHEDULED" || m.status === "TIMED"
  ) || [];
  const finishedMatches = matches?.filter((m) => m.status === "FINISHED") || [];

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-headline mb-2">
              Live Scores
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {format(lastUpdated, "HH:mm:ss")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/sports">
              <Button variant="outline">
                <Trophy className="w-4 h-4 mr-2" />
                Sports Hub
              </Button>
            </Link>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Unable to load scores</h3>
              <p className="text-muted-foreground mb-4">Please try again later.</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : matches?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">No matches today</h3>
              <p className="text-muted-foreground">Check back later for upcoming fixtures.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="text-xl font-semibold">Live Now</h2>
                  <Badge variant="destructive">{liveMatches.length}</Badge>
                </div>
                <MatchesByLeague matches={liveMatches} />
              </section>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Upcoming</h2>
                  <Badge variant="secondary">{upcomingMatches.length}</Badge>
                </div>
                <MatchesByLeague matches={upcomingMatches} />
              </section>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold">Results</h2>
                  <Badge variant="outline">{finishedMatches.length}</Badge>
                </div>
                <MatchesByLeague matches={finishedMatches} />
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
