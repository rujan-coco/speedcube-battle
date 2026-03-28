"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useGameSocket } from "@/lib/partykit/use-game-socket"
import { CubeNet } from "@/components/cube/cube-3d"
import { SpeedcubeTimer, type TimerState } from "./speedcube-timer"
import { Leaderboard } from "./leaderboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Users, WifiOff, ArrowLeft, Trophy, Crown } from "lucide-react"
import Link from "next/link"
import { formatTime, type RoundResult, type Penalty, type Player } from "@/lib/game/types"

interface GameRoomProps {
  roomCode: string
  playerName: string
}

function getResultPerspective(result: RoundResult, currentPlayerId?: string) {
  if (!currentPlayerId || result.player1.id === currentPlayerId) {
    return {
      currentPlayerResult: result.player1,
      opponentResult: result.player2,
    }
  }

  return {
    currentPlayerResult: result.player2,
    opponentResult: result.player1,
  }
}

function sortStandings(players: Player[]) {
  return [...players].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon
    return a.name.localeCompare(b.name)
  })
}

export function GameRoom({ roomCode, playerName }: GameRoomProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [copied, setCopied] = useState(false)
  const [lastResult, setLastResult] = useState<RoundResult | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [nextRoundCountdownMs, setNextRoundCountdownMs] = useState<number | null>(null)

  const handleRoundComplete = useCallback((result: RoundResult) => {
    setLastResult(result)
  }, [])

  const {
    gameState,
    isConnected,
    error,
    currentPlayer,
    opponent,
    sendStartInspection,
    sendStartSolve,
    sendFinishSolve,
    endSession,
  } = useGameSocket({
    roomCode,
    playerName,
    onRoundComplete: handleRoundComplete,
  })

  // Sync timer state with player status - auto start when both players joined
  useEffect(() => {
    if (!currentPlayer) return

    switch (currentPlayer.status) {
      case 'waiting':
      case 'ready':
        // When both players join, set to ready state immediately
        if (gameState && gameState.players.length === 2) {
          setTimerState('ready')
        } else {
          setTimerState('idle')
        }
        break
      case 'inspecting':
        setTimerState('inspection')
        break
      case 'solving':
        setTimerState('solving')
        break
      case 'done':
        setTimerState('done')
        break
    }
  }, [currentPlayer?.status, gameState?.players.length])

  useEffect(() => {
    if (!gameState) return

    if (gameState.roundStatus !== 'complete') {
      if (lastResult !== null) {
        setShowLeaderboard(false)
      }
      setLastResult(null)
      setNextRoundCountdownMs(null)
      return
    }

    if (lastResult === null && gameState.roundHistory.length > 0) {
      setLastResult(gameState.roundHistory[0])
    }
  }, [gameState, lastResult])

  useEffect(() => {
    if (!gameState?.nextRoundAt || gameState.roundStatus !== 'complete') {
      setNextRoundCountdownMs(null)
      return
    }

    const updateCountdown = () => {
      setNextRoundCountdownMs(Math.max(gameState.nextRoundAt! - Date.now(), 0))
    }

    updateCountdown()
    const interval = window.setInterval(updateCountdown, 100)

    return () => {
      window.clearInterval(interval)
    }
  }, [gameState?.nextRoundAt, gameState?.roundStatus])

  const handleTimerStateChange = useCallback((newState: TimerState) => {
    setTimerState(newState)
    
    switch (newState) {
      case 'inspection':
        sendStartInspection()
        break
      case 'solving':
        sendStartSolve()
        break
    }
  }, [sendStartInspection, sendStartSolve])

  const handleTimerFinish = useCallback((time: number, penalty: Penalty) => {
    sendFinishSolve(time, penalty)
  }, [sendFinishSolve])

  const handleEndSession = useCallback(() => {
    endSession()
  }, [endSession])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Waiting for connection
  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {error ? (
              <>
                <WifiOff className="w-12 h-12 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Connecting to room...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const waitingForOpponent = gameState.players.length < 2
  const latestRoundResult = gameState.roundStatus === 'complete'
    ? (lastResult ?? gameState.roundHistory[0] ?? null)
    : null
  const roundComplete = latestRoundResult !== null
  const { currentPlayerResult, opponentResult } = latestRoundResult
    ? getResultPerspective(latestRoundResult, currentPlayer?.id)
    : { currentPlayerResult: null, opponentResult: null }
  const sortedStandings = sortStandings(gameState.players)
  const nextRoundCountdown = nextRoundCountdownMs === null
    ? null
    : Math.max(1, Math.ceil(nextRoundCountdownMs / 1000))
  const sessionEnded = gameState.sessionEnded

  // Get visible moves for cube animation
  const visibleMoves = gameState.scrambleMoves

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/"><ArrowLeft className="w-4 h-4" /> Exit</Link>
        </Button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <span className="font-mono font-bold text-sm tracking-wider">{roomCode}</span>
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
          </button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Scores</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Waiting for opponent */}
        {waitingForOpponent && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Waiting for opponent</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share this code to start
              </p>
              <button 
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <span className="font-mono font-bold text-2xl tracking-widest">{roomCode}</span>
                {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        )}

        {/* Game in progress */}
        {!waitingForOpponent && (
          <>
            {/* Round info + Scramble */}
            <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Round {gameState.roundNumber}</span>
                <span className="text-xs">|</span>
                <span>{currentPlayer?.name} vs {opponent?.name}</span>
              </div>
              
              {/* 2D Cube Net + Scramble notation */}
              <div className="flex flex-col items-center gap-3">
                <CubeNet scrambleMoves={visibleMoves} stickerSize={16} />
                <div className="flex flex-wrap justify-center gap-1 px-4 py-2 bg-secondary/30 rounded-lg font-mono text-xs max-w-lg">
                  {gameState.scrambleMoves.map((move, index) => (
                    <span key={index} className="px-1 text-muted-foreground">{move}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* TIMER - Central Focus */}
            {!roundComplete ? (
              <div className="flex-1 flex items-center justify-center w-full">
                <SpeedcubeTimer
                  state={timerState}
                  onStateChange={handleTimerStateChange}
                  onFinish={handleTimerFinish}
                  disabled={currentPlayer?.status === 'done'}
                  className="py-8"
                />
              </div>
            ) : (
              /* Round Complete */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    Round {latestRoundResult?.roundNumber} Complete
                  </p>
                  <h3 className={cn(
                    "text-3xl font-bold mb-2",
                    latestRoundResult?.winnerId === null 
                      ? "text-muted-foreground"
                      : latestRoundResult?.winnerId === currentPlayer?.id 
                        ? "text-primary" 
                        : "text-destructive"
                  )}>
                    {latestRoundResult?.winnerId === null 
                      ? "Draw!" 
                      : latestRoundResult?.winnerId === currentPlayer?.id 
                        ? "You Win!" 
                        : "Opponent Wins!"}
                  </h3>
                </div>

                {sessionEnded ? (
                  <div className="w-full max-w-lg rounded-2xl border border-border bg-secondary/30 px-6 py-5 text-center">
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                      Session Ended
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      No more rounds will start. You can review the final standings and round history below.
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-lg rounded-2xl border border-primary/30 bg-primary/10 px-6 py-5 text-center shadow-sm">
                    <p className="text-xs uppercase tracking-[0.35em] text-primary/80">
                      Next Round Starts In
                    </p>
                    <div className="mt-3 text-5xl font-black tabular-nums text-primary sm:text-6xl">
                      {nextRoundCountdown ?? "…"}
                    </div>
                  </div>
                )}

                <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Round Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      {currentPlayerResult && (
                        <div className={cn(
                          "rounded-xl border p-4",
                          latestRoundResult?.winnerId === currentPlayerResult.id
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-secondary/30"
                        )}>
                          <div className="mb-1 text-sm text-muted-foreground">
                            {currentPlayerResult.name}
                          </div>
                          <div className="text-3xl font-mono font-bold">
                            {formatTime(currentPlayerResult.time, currentPlayerResult.penalty)}
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            Round Points
                          </div>
                          <div className="text-xl font-semibold">
                            +{currentPlayerResult.points}
                          </div>
                        </div>
                      )}

                      {opponentResult && (
                        <div className={cn(
                          "rounded-xl border p-4",
                          latestRoundResult?.winnerId === opponentResult.id
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-secondary/30"
                        )}>
                          <div className="mb-1 text-sm text-muted-foreground">
                            {opponentResult.name}
                          </div>
                          <div className="text-3xl font-mono font-bold">
                            {formatTime(opponentResult.time, opponentResult.penalty)}
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            Round Points
                          </div>
                          <div className="text-xl font-semibold">
                            +{opponentResult.points}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="w-4 h-4 text-primary" />
                        Battle Standings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sortedStandings.map((player, index) => (
                        <div
                          key={player.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3",
                            player.id === currentPlayer?.id
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-secondary/20"
                          )}
                        >
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                            index === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {player.name}
                              {player.id === currentPlayer?.id ? " (You)" : ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {player.roundsWon} wins • {player.roundsDraw} draws
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold leading-none">{player.totalPoints}</div>
                            <div className="text-xs text-muted-foreground">points</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {!sessionEnded && (
                    <Button variant="destructive" size="lg" onClick={handleEndSession}>
                      End Session
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setShowLeaderboard(true)}>
                    View Full Leaderboard
                  </Button>
                </div>
              </div>
            )}

            {/* Player status indicators (minimal) */}
            {!roundComplete && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    currentPlayer?.status === 'done' ? "bg-primary" :
                    currentPlayer?.status === 'solving' ? "bg-[var(--timer-running)] animate-pulse" :
                    currentPlayer?.status === 'inspecting' ? "bg-[var(--timer-inspection)] animate-pulse" :
                    "bg-muted-foreground"
                  )} />
                  <span className="text-muted-foreground">{currentPlayer?.name}</span>
                  {currentPlayer?.status === 'done' && currentPlayer?.currentTime !== null && (
                    <span className="font-mono text-primary">{formatTime(currentPlayer.currentTime, currentPlayer.penalty)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    opponent?.status === 'done' ? "bg-primary" :
                    opponent?.status === 'solving' ? "bg-[var(--timer-running)] animate-pulse" :
                    opponent?.status === 'inspecting' ? "bg-[var(--timer-inspection)] animate-pulse" :
                    "bg-muted-foreground"
                  )} />
                  <span className="text-muted-foreground">{opponent?.name}</span>
                  {opponent?.status === 'done' && opponent?.currentTime !== null && (
                    <span className="font-mono text-primary">{formatTime(opponent.currentTime, opponent.penalty)}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLeaderboard(false)}
        >
          <div 
            className="w-full max-w-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Leaderboard 
              players={gameState.players}
              roundHistory={gameState.roundHistory}
              currentPlayerId={currentPlayer?.id}
            />
            <Button 
              variant="secondary" 
              className="w-full mt-4"
              onClick={() => setShowLeaderboard(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
