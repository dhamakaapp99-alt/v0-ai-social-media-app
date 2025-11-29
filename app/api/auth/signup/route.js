import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { hashPassword, setSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    const { email, mobile, password, name } = await request.json()

    if (!password || (!email && !mobile)) {
      return NextResponse.json({ success: false, error: "Email/mobile and password are required" }, { status: 400 })
    }

    let db
    try {
      db = await getDb()
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError.message)
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured. Please add MONGODB_URI to environment variables.",
        },
        { status: 503 },
      )
    }

    const users = db.collection("users")

    // Check if user exists
    const existingUser = await users.findOne({
      $or: [{ email: email?.toLowerCase() }, { mobile }].filter(Boolean),
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = {
      _id: new ObjectId(),
      email: email?.toLowerCase(),
      mobile,
      password: hashedPassword,
      name: name || "",
      bio: "",
      location: "",
      interests: [],
      avatar: "",
      coverImage: "",
      friends: [],
      friendRequests: [],
      sentRequests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: false,
    }

    await users.insertOne(newUser)
    await setSession(newUser._id.toString(), email || mobile)

    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: newUser._id.toString() },
    })
  } catch (error) {
    console.error("[v0] Signup error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
