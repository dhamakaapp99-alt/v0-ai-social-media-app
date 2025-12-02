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

    // ✅ FIX 1: Use the correct Imagen Model URL
    // Text models (Gemini Flash) cannot generate images. You must use Imagen.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    // ✅ FIX 2: Update Payload Structure for Imagen
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          { prompt: enhancedPrompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1" // Optional: "16:9", "4:3", etc.
        }
      }),
    });

    const raw = await geminiRes.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("Gemini RAW Response:", raw);
      return NextResponse.json({ success: false, error: "Gemini returned non-JSON data" });
    }

    // ✅ FIX 3: Parse the correct response structure
    // Imagen returns { predictions: [ { bytesBase64Encoded: "..." } ] }
    if (!data?.predictions?.[0]?.bytesBase64Encoded) {
      console.error("Gemini Error Response:", data);
      return NextResponse.json({ success: false, error: "Gemini did not generate image" });
    }

    // Extract Base64 image
    const base64Image = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;

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