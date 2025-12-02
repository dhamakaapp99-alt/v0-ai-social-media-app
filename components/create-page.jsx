"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Loader2, X, Send, Wand2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


export default function CreatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [generatedImage, setGeneratedImage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isPosting, setIsPosting] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to create",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImage("") // Clear previous image
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl)
        setSelectedFile(null) // Clear selected file on successful generation
        toast({
          title: "Image created!",
          description: "Your AI image is ready to post",
        })
      } else {
        toast({
          title: "Generation failed",
          description: data.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }
  

  const handlePost = async () => {
    if (!generatedImage) {
      toast({
        title: "No image",
        description: "Generate an image first",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim().replace("#", ""))
        .filter(Boolean)

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
          caption,
          tags: tagsArray,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Posted!",
          description: "Your creation is now live",
        })
        router.push("/feed")
      } else {
        toast({
          title: "Failed to post",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSelectedFile(ev.target?.result)
        setGeneratedImage("") // Clear generated image if a file is selected
        toast({
          title: "Image Selected",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your image</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ek ladka sunset ke samay beach pe khada hai... / A boy standing near the beach at sunset..."
              className="min-h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground">Type in Hindi or English - AI will understand!</p>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Or add a reference image (optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById("gallery-input")?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload from Gallery
              </Button>
              {selectedFile && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={selectedFile} alt="Selected preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <input type="file" id="gallery-input" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !selectedFile)}
            className="w-full h-12 gap-2 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Magic...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Image Preview */}
      {generatedImage && (
        <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={generatedImage || "/placeholder.svg"}
                alt="Generated AI Image"
                className="w-full aspect-square object-cover"
              />
              <button
                onClick={() => setGeneratedImage("")}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write something about your creation..."
                  className="min-h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="art, sunset, beach (comma separated)"
                />
              </div>

              <Button onClick={handlePost} disabled={isPosting} className="w-full h-12 gap-2 text-base font-semibold">
                {isPosting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Share to Feed
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Prompts */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Example prompts to try</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "A magical forest with glowing fireflies",
              "Ek ladki jo stars me dekh rahi hai",
              "Cyberpunk city at night with neon lights",
              "Beautiful mountain landscape with sunset",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="text-xs bg-muted px-3 py-1.5 rounded-full hover:bg-muted/80 transition-colors text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
