"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, type Player, type RoundResult } from "@/lib/game/types";
import { Trophy, Medal, Clock, TrendingUp } from "lucide-react";

interface LeaderboardProps {
  players: Player[];
  roundHistory: RoundResult[];
  currentPlayerId?: string;
  className?: string;
}

export function Leaderboard({
  players,
  roundHistory,
  currentPlayerId,
  className,
}: LeaderboardProps) {
  // Sort players by total points (descending)
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Standings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-primary" />
            Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Waiting for players...
            </p>
          ) : (
            sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  player.id === currentPlayerId
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-secondary/50",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{player.name}</span>
                    {player.id === currentPlayerId && (
                      <span className="text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{player.roundsWon}W</span>
                    <span>{player.roundsDraw}D</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{player.totalPoints}</div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Round History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Round History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roundHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rounds played yet
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {roundHistory.map((result, index) => (
                  <RoundHistoryItem
                    key={result.roundNumber}
                    result={result}
                    currentPlayerId={currentPlayerId}
                    isLatest={index === 0}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface RoundHistoryItemProps {
  result: RoundResult;
  currentPlayerId?: string;
  isLatest?: boolean;
}

function RoundHistoryItem({
  result,
  currentPlayerId,
  isLatest,
}: RoundHistoryItemProps) {
  const isPlayer1 = result.player1.id === currentPlayerId;
  const currentPlayerResult = isPlayer1 ? result.player1 : result.player2;
  const opponentResult = isPlayer1 ? result.player2 : result.player1;

  const isWinner = result.winnerId === currentPlayerId;
  const isDraw = result.winnerId === null;
  const isLoser = !isWinner && !isDraw;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        isWinner && "bg-primary/5 border-primary/20",
        isDraw && "bg-muted/50 border-muted",
        isLoser && "bg-destructive/5 border-destructive/20",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Round {result.roundNumber}
        </span>
        <div
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isWinner && "bg-primary/10 text-primary",
            isDraw && "bg-muted text-muted-foreground",
            isLoser && "bg-destructive/10 text-destructive",
          )}
        >
          {isWinner ? "+2" : isDraw ? "+1" : "+0"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div
          className={cn(
            "flex flex-col",
            result.winnerId === currentPlayerResult.id && "text-primary",
          )}
        >
          <span className="text-xs text-muted-foreground truncate">
            {currentPlayerResult.name}
          </span>
          <span className="font-mono font-medium">
            {formatTime(currentPlayerResult.time, currentPlayerResult.penalty)}
          </span>
        </div>
        <div
          className={cn(
            "flex flex-col text-right",
            result.winnerId === opponentResult.id && "text-primary",
          )}
        >
          <span className="text-xs text-muted-foreground truncate">
            {opponentResult.name}
          </span>
          <span className="font-mono font-medium">
            {formatTime(opponentResult.time, opponentResult.penalty)}
          </span>
        </div>
      </div>
    </div>
  );
}
