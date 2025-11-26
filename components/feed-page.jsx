"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import PostCard from "@/components/post-card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function FeedPage() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR("/api/posts", fetcher)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const posts = data?.posts || []

  return (
    <div className="p-4 space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Create Post CTA */}
      <Link href="/create">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">+</span>
          </div>
          <p className="text-muted-foreground">Create something amazing with AI...</p>
        </div>
      </Link>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet</p>
          <Link href="/create">
            <Button>Create Your First Post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} currentUserId={user?._id} onUpdate={() => mutate()} />
          ))}
        </div>
      )}
    </div>
  )
}
