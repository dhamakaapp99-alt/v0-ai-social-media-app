"use client"

import { useState } from "react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, Loader2, Film, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function ReelsPage() {
  const { data, isLoading } = useSWR("/api/reels", fetcher)
  const [currentIndex, setCurrentIndex] = useState(0)

  const reels = data?.reels || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="p-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No reels yet</p>
            <p className="text-sm text-muted-foreground mb-4">Short video content coming soon!</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload First Reel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {reels.map((reel, index) => (
        <ReelCard key={reel._id} reel={reel} isActive={index === currentIndex} />
      ))}
    </div>
  )
}

function ReelCard({ reel, isActive }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="h-[calc(100vh-8rem)] snap-start relative bg-black">
      {/* Video/Image Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        {reel.thumbnail ? (
          <img src={reel.thumbnail || "/placeholder.svg"} alt="Reel" className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/50 text-center">
            <Film className="h-16 w-16 mx-auto mb-2" />
            <p>Video Content</p>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

      {/* Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
        <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1">
          <div className={cn("p-3 rounded-full bg-white/10 backdrop-blur-sm", liked && "bg-red-500/20")}>
            <Heart className={cn("h-6 w-6", liked ? "fill-red-500 text-red-500" : "text-white")} />
          </div>
          <span className="text-white text-xs">{reel.likes?.length || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs">{reel.comments?.length || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs">Share</span>
        </button>
      </div>

      {/* User Info & Caption */}
      <div className="absolute left-4 right-16 bottom-8">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>{reel.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{reel.user?.name}</p>
          </div>
        </div>
        {reel.caption && <p className="text-white text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  )
}
