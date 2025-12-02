import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImageFromUrl } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    const enhancedPrompt = `Photorealistic, HD, cinematic lighting, sharp details: ${prompt}`;

    // CORRECT GOOGLE IMAGE MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagetext:generate?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: enhancedPrompt,
      }),
    });

    const raw = await geminiRes.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("Gemini RAW Response:", raw);
      return NextResponse.json({
        success: false,
        error: "Gemini returned non-JSON data",
      });
    }

    // Validate base64 image
    if (!data?.images || !data.images[0]?.image) {
      console.error("Gemini Error:", data);
      return NextResponse.json({
        success: false,
        error: "Gemini did not generate image",
      });
    }

    const base64Image = `data:image/png;base64,${data.images[0].image}`;

    // --- Upload to Cloudinary ---
    let finalUrl = base64Image;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const upload = await uploadImageFromUrl(base64Image, "colorcode/posts");
      if (upload.success) finalUrl = upload.url;
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalUrl,
      revisedPrompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error generating image" },
      { status: 500 }
    );
  }
}
