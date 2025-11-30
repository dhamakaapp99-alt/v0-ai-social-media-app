"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Camera,
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [caption, setCaption] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const touchStartY = useRef(0)

  const reels = data?.reels || []

  // Touch swipe handling for Instagram-like navigation
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, reels.length])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Video must be under 100MB", variant: "destructive" })
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUploadReel = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: "Please select a video", variant: "destructive" })
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      // Upload video to Cloudinary
      const formData = new FormData()
      formData.append("video", selectedFile)

      setUploadProgress(30)

      const uploadRes = await fetch("/api/upload/video", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(70)

      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload video")
      }

      setUploadProgress(85)

      // Create reel in database
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: uploadData.url,
          thumbnail: uploadData.thumbnail,
          caption,
        }),
      })

      setUploadProgress(100)

      const reelData = await res.json()
      if (reelData.success) {
        toast({ title: "Reel uploaded successfully!" })
        setSelectedFile(null)
        setPreviewUrl("")
        setCaption("")
        setShowUpload(false)
        mutate()
      } else {
        throw new Error(reelData.error || "Failed to create reel")
      }
    } catch (error) {
      toast({ title: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  // Upload Modal
  if (showUpload) {
    return (
      <div className="p-4 min-h-[calc(100vh-8rem)] bg-background">
        <Card className="border-0 shadow-lg max-w-lg mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                Create New Reel
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
                  setPreviewUrl("")
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleUploadReel} className="space-y-4">
              {/* Video Preview/Select */}
              <div
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden border-2 border-dashed cursor-pointer transition-colors",
                  selectedFile
                    ? "border-primary bg-black"
                    : "border-muted-foreground/30 bg-muted/50 hover:border-primary/50",
                )}
              >
                {previewUrl ? (
                  <>
                    <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        setPreviewUrl("")
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="p-4 rounded-full bg-primary/10 mb-3">
                      <Camera className="h-10 w-10 text-primary" />
                    </div>
                    <p className="font-medium">Tap to select video</p>
                    <p className="text-sm text-muted-foreground">MP4, WebM up to 100MB</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your reel..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/500</p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {uploadProgress < 70 ? "Uploading video..." : uploadProgress < 100 ? "Creating reel..." : "Done!"}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={uploading || !selectedFile} size="lg">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Share Reel
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-black p-4">
        <Card className="border-0 shadow-lg bg-white/10 backdrop-blur-sm max-w-sm w-full">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-white/10 w-fit mx-auto mb-4">
              <Film className="h-12 w-12 text-white" />
            </div>
            <p className="text-white font-semibold mb-2">No reels yet</p>
            <p className="text-white/70 text-sm mb-6">Be the first to share a reel!</p>
            <Button onClick={() => setShowUpload(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Reel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-8rem)] bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Create Button */}
      <Button
        onClick={() => setShowUpload(true)}
        size="icon"
        className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
      >
        <Plus className="h-5 w-5 text-white" />
      </Button>

      {/* Progress Dots */}
      <div className="absolute top-4 left-4 right-16 z-30 flex gap-1">
        {reels.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i === currentIndex ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div>

      {/* Reels Container */}
      <div
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {reels.map((reel, index) => (
          <div key={reel._id} className="h-full">
            <ReelCard reel={reel} isActive={index === currentIndex} currentUserId={user?._id} onMutate={mutate} />
          </div>
        ))}
      </div>

      {/* Scroll Hint */}
      {currentIndex === 0 && reels.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <p className="text-white/70 text-xs">Swipe up for more</p>
        </div>
      )}
    </div>
  )
}

function ReelCard({ reel, isActive, currentUserId, onMutate }) {
  const { toast } = useToast()
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId))
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showHeart, setShowHeart] = useState(false)
  const videoRef = useRef(null)
  const lastTapRef = useRef(0)

  // Auto-play when active, pause when inactive
  useEffect(() => {
    if (!videoRef.current) return

    if (isActive) {
      videoRef.current.currentTime = 0
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          setIsPlaying(false)
        })
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Double tap to like
  const handleTap = (e) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap - like
      if (!liked) {
        handleLike()
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 1000)
      }
    } else {
      // Single tap - play/pause
      togglePlay()
    }
    lastTapRef.current = now
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Reel by ${reel.user?.name}`,
          text: reel.caption || "Check out this reel!",
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({ title: "Link copied!" })
      }
    } catch (error) {
      // User cancelled share
    }
  }

  return (
    <div className="h-full relative bg-black">
      {/* Video */}
      <div className="absolute inset-0" onClick={handleTap}>
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-contain"
            loop
            playsInline
            muted={isMuted}
            poster={reel.thumbnail}
            preload="auto"
          />
        ) : reel.thumbnail ? (
          <img src={reel.thumbnail || "/placeholder.svg"} alt="Reel" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-16 w-16 text-white/30" />
          </div>
        )}

        {/* Play/Pause Icon */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="h-12 w-12 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Double Tap Heart Animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-24 w-24 text-white fill-white animate-ping" />
          </div>
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-16 right-4 z-20 p-2.5 rounded-full bg-black/40 backdrop-blur-sm"
      >
        {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
      </button>

      {/* Actions Sidebar */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              liked ? "bg-red-500/20" : "bg-black/40 backdrop-blur-sm",
            )}
          >
            <Heart
              className={cn("h-7 w-7 transition-all", liked ? "fill-red-500 text-red-500 scale-110" : "text-white")}
            />
          </div>
          <span className="text-white text-xs font-medium">{likesCount}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{reel.comments?.length || 0}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>

        {/* User Avatar */}
        <Link href={`/user/${reel.userId}`}>
          <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-primary">
            <AvatarImage src={reel.user?.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-white">{reel.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* User Info & Caption */}
      <div className="absolute left-4 right-20 bottom-8 z-20">
        <Link href={`/user/${reel.userId}`}>
          <p className="text-white font-bold text-base mb-1">@{reel.user?.name?.toLowerCase().replace(/\s/g, "")}</p>
        </Link>
        {reel.caption && <p className="text-white/90 text-sm line-clamp-2">{reel.caption}</p>}
      </div>
    </div>
  )
}
