"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Search, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function MessagesPage() {
  const [search, setSearch] = useState("")
  const { data: conversationsData, isLoading: isLoadingConversations } = useSWR("/api/conversations", fetcher)
  const { data: usersData, isLoading: isLoadingUsers } = useSWR("/api/users", fetcher)

  const conversations = conversationsData?.conversations || []
  const allUsers = usersData?.users || []

  const filteredConversations = conversations.filter((c) =>
    c.friend?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  const conversationFriendIds = new Set(conversations.map(c => c.friendId))
  const otherUsers = allUsers.filter(user => !conversationFriendIds.has(user.id))

  const filteredOtherUsers = otherUsers.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase())
  )

  const isLoading = isLoadingConversations || isLoadingUsers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="pl-10"
        />
      </div>

      {/* Conversations */}
      {filteredConversations.length === 0 && filteredOtherUsers.length === 0 && !isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No conversations found</p>
            <p className="text-sm text-muted-foreground">Search for a user to start a new chat.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <Link key={conv.friendId} href={`/chat/${conv.friendId}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.friend?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{conv.friend?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.friend?.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessage?.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage?.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Other Users to start chat with */}
      {filteredOtherUsers.length > 0 && (
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-medium text-muted-foreground px-2">Start a new chat</h2>
          {filteredOtherUsers.map((user) => (
            <Link key={user.id} href={`/chat/${user.id}`}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">Start a conversation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
