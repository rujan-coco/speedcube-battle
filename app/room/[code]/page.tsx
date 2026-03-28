"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { use } from "react"
import { GameRoom } from "@/components/game/game-room"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface RoomPageProps {
  params: Promise<{ code: string }>
}

function RoomContent({ roomCode }: { roomCode: string }) {
  const searchParams = useSearchParams()
  const playerName = searchParams.get("name")

  if (!playerName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <h2 className="text-xl font-semibold">Name Required</h2>
            <p className="text-muted-foreground">
              Please enter your name to join this room.
            </p>
            <Button asChild>
              <Link href={`/?join=${roomCode}`}>
                Enter Name
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <GameRoom 
      roomCode={roomCode.toUpperCase()} 
      playerName={playerName} 
    />
  )
}

function RoomLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading room...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params)

  return (
    <Suspense fallback={<RoomLoading />}>
      <RoomContent roomCode={resolvedParams.code} />
    </Suspense>
  )
}
