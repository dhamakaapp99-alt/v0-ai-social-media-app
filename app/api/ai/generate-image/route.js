import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import OpenAI from "openai"

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 })
    }

    // Enhance prompt for better image generation
    const enhancedPrompt = `Create a high-quality, visually stunning image: ${prompt}. Style: photorealistic, vibrant colors, professional lighting, high resolution.`

    const openai = getOpenAI()

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })

    const imageUrl = response.data[0].url

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt: response.data[0].revised_prompt,
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to generate image" }, { status: 500 })
  }
}
