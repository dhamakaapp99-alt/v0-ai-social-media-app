"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2, X, Send, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [topic, setTopic] = useState("")
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [imageSrc, setImageSrc] = useState("")
  const [characterImage, setCharacterImage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic",
        variant: "destructive",
      })
      return
    }
    if (!characterImage) {
      toast({
        title: "Character Image Required",
        description: "Please upload a character image",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const body = {
        topic: topic,
        prompt: prompt || topic,
        character: characterImage,
      }

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success && data.data?.url) {
        setImageSrc(data.data.url)
        toast({
          title: "✨ Image Generated!",
          description: "Your AI creation is ready",
        })
      } else {
        toast({
          title: "Generation Failed",
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
    if (!imageSrc) {
      toast({
        title: "No Image",
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
          imageUrl: imageSrc,
          caption,
          tags: tagsArray,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "🎉 Posted!",
          description: "Your creation is now live",
        })
        router.push("/feed")
      } else {
        toast({
          title: "Failed to Post",
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
        setCharacterImage(ev.target?.result)
        toast({
          title: "✓ Character Image Selected",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCharacterImage = () => {
    setCharacterImage("")
    const input = document.getElementById("gallery-input")
    if (input) input.value = ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 p-4">
      {/* Generating Popup Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-scale-in">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse-scale">
                <Sparkles className="h-12 w-12 text-white animate-spin-slow" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Generating Image
            </h3>
            <p className="text-lg text-gray-600 mb-2">
              कृपया प्रतीक्षा करें...
            </p>
            <p className="text-base text-gray-500">
              Please wait, creating magic ✨
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8 pb-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="h-8 w-8 text-red-600 animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              colorCode
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Create stunning AI images with your character</p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardContent className="p-6 space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-base font-semibold flex items-center gap-2">
                <span className="text-red-600">✦</span> Topic
              </Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ladies Saadi, Fashion, Nature..."
                className="h-12 text-base border-2 focus:border-red-400 transition-all"
              />
            </div>

            {/* Optional Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-base font-semibold flex items-center gap-2">
                <span className="text-pink-600">✦</span> Description (Optional)
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Add more details about your image..."
                className="min-h-24 resize-none text-base border-2 focus:border-pink-400 transition-all"
              />
            </div>

            {/* Character Image Upload */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <span className="text-red-600">✦</span> Character Image
                <span className="text-xs text-red-500 font-normal">(Required)</span>
              </Label>
              
              {!characterImage ? (
                <div 
                  onClick={() => document.getElementById("gallery-input")?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Click to upload character image</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-red-200 animate-scale-in">
                  <img 
                    src={characterImage} 
                    alt="Character" 
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={removeCharacterImage}
                    className="absolute top-3 right-3 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Character Ready
                    </p>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                id="gallery-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic || !characterImage}
              className="w-full h-14 gap-3 text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="animate-pulse">Creating Magic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  Generate Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Image Preview & Post Section */}
        {imageSrc && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-0">
              {/* Generated Image */}
              <div className="relative">
                <img
                  src={imageSrc}
                  alt="Generated AI Image"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg flex items-center gap-2 animate-bounce-in">
                  <Sparkles className="h-4 w-4" />
                  AI Generated
                </div>
                <button
                  onClick={() => setImageSrc("")}
                  className="absolute top-4 right-4 p-3 bg-black/60 rounded-full text-white hover:bg-black/80 transition-all hover:scale-110 shadow-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Post Details */}
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="caption" className="text-base font-semibold">Caption</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write something amazing..."
                    className="min-h-24 resize-none text-base border-2 focus:border-red-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-base font-semibold">Tags</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="#art, #ai, #creative (comma separated)"
                    className="h-12 text-base border-2 focus:border-red-400"
                  />
                </div>

                <Button 
                  onClick={handlePost} 
                  disabled={isPosting} 
                  className="w-full h-14 gap-3 text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-6 w-6" />
                      Share to Feed
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Example Prompts */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Try these ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "पारंपरिक भारतीय शादी",
                "Traditional Indian Wedding",
                "आधुनिक फैशन पोर्ट्रेट",
                "Sunset Beach Scene",
                "साड़ी में सुंदर महिला",
                "Cyberpunk Style",
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(example)}
                  className="text-sm bg-gradient-to-r from-red-100 to-pink-100 px-4 py-2 rounded-full hover:from-red-200 hover:to-pink-200 transition-all font-medium text-gray-700 hover:scale-105 shadow-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce-in {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.1);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pulse-scale {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.1);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  )
}