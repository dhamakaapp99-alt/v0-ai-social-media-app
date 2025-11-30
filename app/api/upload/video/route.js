import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("video")

    if (!file) {
      return NextResponse.json({ success: false, error: "No video file provided" }, { status: 400 })
    }

    // Get Cloudinary credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
        },
        { status: 500 },
      )
    }

    // Create signature for upload
    const timestamp = Math.round(new Date().getTime() / 1000)
    const crypto = await import("crypto")
    const signature = crypto.default
      .createHash("sha1")
      .update(`folder=colorcode/reels&resource_type=video&timestamp=${timestamp}${apiSecret}`)
      .digest("hex")

    // Upload to Cloudinary
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("api_key", apiKey)
    uploadFormData.append("timestamp", timestamp.toString())
    uploadFormData.append("signature", signature)
    uploadFormData.append("folder", "colorcode/reels")
    uploadFormData.append("resource_type", "video")

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: "POST",
      body: uploadFormData,
    })

    const uploadData = await uploadRes.json()

    if (uploadData.error) {
      return NextResponse.json({ success: false, error: uploadData.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: uploadData.secure_url,
      thumbnail: uploadData.secure_url.replace(/\.[^.]+$/, ".jpg"),
      duration: uploadData.duration,
      publicId: uploadData.public_id,
    })
  } catch (error) {
    console.error("Video upload error:", error)
    return NextResponse.json({ success: false, error: "Failed to upload video" }, { status: 500 })
  }
}
