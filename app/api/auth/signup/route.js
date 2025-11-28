import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, setSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { email, mobile, password, name } = await request.json();

    if (!password || (!email && !mobile)) {
      return NextResponse.json(
        { success: false, error: "Email/mobile and password are required" },
        { status: 400 }
      );
    }

    let db;
    try {
      db = await getDb();
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured. Please add MONGODB_URI to env.",
        },
        { status: 503 }
      );
    }

    const users = db.collection("users");

    // -------------------------------
    // FIXED: Safe unique check
    // -------------------------------
    const query = { $or: [] };

    if (email) query.$or.push({ email: email.toLowerCase() });
    if (mobile) query.$or.push({ mobile });

    // If none added, avoid crash
    if (query.$or.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email/mobile" },
        { status: 400 }
      );
    }

    const existingUser = await users.findOne(query);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 400 }
      );
    }

    // -------------------------------
    // Create User
    // -------------------------------
    const hashedPassword = await hashPassword(password);

    const newUser = {
      _id: new ObjectId(),
      email: email?.toLowerCase() || "",
      mobile: mobile || "",
      name: name || "",
      password: hashedPassword,
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
    };

    await users.insertOne(newUser);

    // Session
    await setSession(newUser._id.toString(), email || mobile);

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: newUser._id.toString() },
    });
  } catch (error) {
    console.error("[v0] Signup error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
