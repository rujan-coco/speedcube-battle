"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CubeIcon } from "@/components/icons/cube-icon"
import { Users, Zap, Timer, Trophy } from "lucide-react"

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function HomePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [activeTab, setActiveTab] = useState<"create" | "join">("create")

  const handleCreateRoom = () => {
    if (!playerName.trim()) return
    const roomCode = generateRoomCode()
    router.push(`/room/${roomCode}?name=${encodeURIComponent(playerName.trim())}`)
  }

  const handleJoinRoom = () => {
    if (!playerName.trim() || !joinCode.trim()) return
    router.push(`/room/${joinCode.toUpperCase().trim()}?name=${encodeURIComponent(playerName.trim())}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="relative">
            <CubeIcon className="w-20 h-20 text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance">
              SpeedCube Battle
            </h1>
            <p className="text-muted-foreground mt-2 text-balance">
              Real-time multiplayer speedcubing competition
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "create" ? "default" : "secondary"}
                className="flex-1"
                onClick={() => setActiveTab("create")}
              >
                Create Room
              </Button>
              <Button
                variant={activeTab === "join" ? "default" : "secondary"}
                className="flex-1"
                onClick={() => setActiveTab("join")}
              >
                Join Room
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="playerName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="playerName"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            {activeTab === "create" ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Create a new room and share the code with a friend to start battling.
                </p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleCreateRoom}
                  disabled={!playerName.trim()}
                >
                  <Zap className="w-4 h-4" />
                  Create Room
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="roomCode" className="text-sm font-medium">
                    Room Code
                  </label>
                  <Input
                    id="roomCode"
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-xl tracking-widest font-mono uppercase"
                  />
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || joinCode.length !== 6}
                >
                  <Users className="w-4 h-4" />
                  Join Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <FeatureCard 
            icon={<Timer className="w-5 h-5" />}
            title="WCA Timer"
            description="15s inspection"
          />
          <FeatureCard 
            icon={<CubeIcon className="w-5 h-5" />}
            title="3D Cube"
            description="Visual scrambles"
          />
          <FeatureCard 
            icon={<Trophy className="w-5 h-5" />}
            title="Leaderboard"
            description="Track points"
          />
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50 text-center">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
