"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, UserCheck, UserX, Loader2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function FriendsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const { data: friendsData, mutate: mutateFriends } = useSWR("/api/friends", fetcher)
  const { data: requestsData, mutate: mutateRequests } = useSWR("/api/friends/requests", fetcher)

  const friends = friendsData?.friends || []
  const requests = requestsData?.requests || []

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.users || [])
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const sendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      })

      if (res.ok) {
        toast({ title: "Friend request sent!" })
        setSearchResults((prev) => prev.filter((u) => u._id !== targetUserId))
      }
    } catch (error) {
      toast({ title: "Failed to send request", variant: "destructive" })
    }
  }

  const acceptRequest = async (requesterId) => {
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      })

      if (res.ok) {
        toast({ title: "Friend request accepted!" })
        mutateRequests()
        mutateFriends()
      }
    } catch (error) {
      toast({ title: "Failed to accept request", variant: "destructive" })
    }
  }

  const rejectRequest = async (requesterId) => {
    try {
      await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      })
      mutateRequests()
    } catch (error) {
      toast({ title: "Failed to reject request", variant: "destructive" })
    }
  }

  const removeFriend = async (friendId) => {
    try {
      await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      })
      toast({ title: "Friend removed" })
      mutateFriends()
    } catch (error) {
      toast({ title: "Failed to remove friend", variant: "destructive" })
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for friends..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Search Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {searchResults.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.location}</p>
                </div>
                <Button size="sm" onClick={() => sendRequest(u._id)} className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends" className="gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            Requests
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          {friends.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground">Search to find and add friends</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Card key={friend._id} className="border-0 shadow-lg">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{friend.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{friend.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{friend.bio || friend.location}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFriend(friend._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {requests.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <Card key={req._id} className="border-0 shadow-lg">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={req.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{req.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{req.name}</p>
                        <p className="text-sm text-muted-foreground">wants to be your friend</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => acceptRequest(req._id)}>
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => rejectRequest(req._id)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
