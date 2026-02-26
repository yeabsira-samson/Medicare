import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "../../lib/mongodb";

// =======================
// GET - Fetch favorites
// =======================
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    const db = await connectDb();

    const favorites = await db
      .collection("favorites")
      .find({ email })
      .toArray();

    console.log(`✅ Fetched ${favorites.length} favorites for ${email}`);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("❌ GET favorites error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// =======================
// POST - Add favorite(s)
// =======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📦 POST request body:", body);
    
    const { email, favorites } = body; // Changed from 'favorite' to 'favorites' to match your component

    if (!email || !favorites) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const db = await connectDb();

    // If it's a single favorite (your component sends array)
    if (Array.isArray(favorites)) {
      // Delete existing and insert new ones (replace)
      await db.collection("favorites").deleteMany({ email });
      
      if (favorites.length > 0) {
        const favoritesWithEmail = favorites.map(f => ({
          ...f,
          email,
          updatedAt: new Date()
        }));
        await db.collection("favorites").insertMany(favoritesWithEmail);
      }
      console.log(`✅ Saved ${favorites.length} favorites for ${email}`);
    } else {
      // Single favorite (fallback)
      await db.collection("favorites").insertOne({
        ...favorites,
        email,
        updatedAt: new Date()
      });
      console.log(`✅ Added favorite for ${email}`);
    }

    return NextResponse.json({ 
      message: "Favorites saved successfully",
      count: Array.isArray(favorites) ? favorites.length : 1
    });
  } catch (error) {
    console.error("❌ POST favorite error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

// =======================
// DELETE - Remove favorite
// =======================
export async function DELETE(req: NextRequest) {
  try {
    const { email, favoriteId } = await req.json();
    console.log("🗑️ DELETE request:", { email, favoriteId });

    if (!email || !favoriteId) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const db = await connectDb();

    const result = await db.collection("favorites").deleteOne({
      email,
      favoriteId: favoriteId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Removed favorite ${favoriteId} for ${email}`);
    return NextResponse.json({ message: "Favorite removed" });
  } catch (error) {
    console.error("❌ DELETE favorite error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// =======================
// PUT - Update favorite
// =======================
export async function PUT(req: NextRequest) {
  try {
    const { email, favoriteId, updates } = await req.json();
    console.log("✏️ PUT request:", { email, favoriteId, updates });

    if (!email || !favoriteId || !updates) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const db = await connectDb();

    const result = await db.collection("favorites").updateOne(
      { email, favoriteId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Updated favorite ${favoriteId} for ${email}`);
    return NextResponse.json({ message: "Favorite updated" });
  } catch (error) {
    console.error("❌ PUT favorite error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}