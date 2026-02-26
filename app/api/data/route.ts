import { connectDb } from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    
    if (!searchTerm) {
      return NextResponse.json([]);
    }
    
    const db = await connectDb();
    const collection = db.collection("medicare");
    
    const searchRegex = new RegExp(searchTerm, 'i');
    // { Allowed_Charges_Per_Person: searchRegex }
    const data = await collection.find({
      $or: [
        { Place_of_Service: searchRegex },
        { Type_of_Service: searchRegex },
      ]
    }).limit(100).toArray();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}