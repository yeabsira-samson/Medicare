import { NextResponse } from 'next/server';
import { connectDb } from "../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    const db = await connectDb();
    
    const user = await db.collection('users').findOne(
      { email: email },
      { projection: { password: 0 } }
    );

    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      id: user._id.toString(),
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status || 'loggedout'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}