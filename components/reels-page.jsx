"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Film,
  Plus,
  Upload,
  X,
  Play,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function ReelsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR("/api/reels", fetcher)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [caption, setCaption] = useState("")
  const containerRef = useRef(null)

  const reels = data?.reels || []

  const handleScroll = (direction) => {
    if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (direction === "down" && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleUploadReel = async (e) => {
    e.preventDefault()
    if (!videoUrl.trim()) {
      toast({ title: "Please enter a video URL", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, thumbnail, caption }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: "Reel uploaded successfully!" })
        setVideoUrl("")
        setThumbnail("")
        setCaption("")
        setShowUpload(false)
        mutate()
      } else {
        toast({ title: data.error || "Failed to upload reel", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Failed to upload reel", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Upload Modal
  if (showUpload) {
    return (
      <div className="p-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Reel
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleUploadReel} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Video URL *</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Enter a direct link to your video file (MP4, WebM)</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Thumbnail URL (optional)</label>
                <Input
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your reel..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Reel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
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
            <p className="text-sm text-muted-foreground mb-4">Be the first to upload a reel!</p>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Upload First Reel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] bg-black" ref={containerRef}>
      {/* Upload Button */}
      <Button
        onClick={() => setShowUpload(true)}
        className="absolute top-4 right-4 z-20 gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
      >
        <Plus className="h-4 w-4" />
        Upload
      </Button>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          onClick={() => handleScroll("up")}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          onClick={() => handleScroll("down")}
          disabled={currentIndex === reels.length - 1}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>

      {/* Current Reel */}
      <ReelCard reel={reels[currentIndex]} isActive={true} currentUserId={user?._id} />

      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-20 z-20 flex gap-1">
        {reels.map((_, i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-colors", i === currentIndex ? "bg-white" : "bg-white/30")}
          />
        ))}
      </div>
    </div>
  )
}

function ReelCard({ reel, isActive, currentUserId }) {
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && isActive) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
  }, [isActive, isPlaying])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleLike = async () => {
    setLiked(!liked)
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1))

    try {
      await fetch(`/api/reels/${reel._id}/like`, { method: "POST" })
    } catch (error) {
      setLiked(liked)
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1))
    }
  }

  return (
    <div className="h-full relative">
      {/* Video/Image Content */}
      <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            autoPlay
            muted={isMuted}
            poster={reel.thumbnail || undefined}
          />
        ) : reel.thumbnail ? (
          <img src={reel.thumbnail || "/placeholder.svg"} alt="Reel" className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/50 text-center">
            <Film className="h-16 w-16 mx-auto mb-2" />
            <p>Video Content</p>
          </div>
        )}

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="h-16 w-16 text-white" />
          </div>
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-16 left-4 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm"
      >
        {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
      </button>

      {/* Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={cn("p-3 rounded-full bg-white/10 backdrop-blur-sm", liked && "bg-red-500/20")}>
            <Heart className={cn("h-6 w-6", liked ? "fill-red-500 text-red-500" : "text-white")} />
          </div>
          <span className="text-white text-xs">{likesCount}</span>
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
      <div className="absolute left-4 right-16 bottom-8 z-10">
        <Link href={`/user/${reel.userId}`}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{reel.user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold">{reel.user?.name}</p>
            </div>
          </div>
        </Link>
        {reel.caption && <p className="text-white text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  )
}
