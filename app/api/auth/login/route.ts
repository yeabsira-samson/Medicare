import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDb } from "../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
      console.log('Request body:', { email: body.email });
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

  
    const db = await connectDb();
    
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

  
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

  
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          status: "loggedin",
          lastLoginAt: new Date(),
          updatedAt: new Date()
        } 
      }
    ); 
    return NextResponse.json({
      message: 'Login successful!',
      success: true,
      user: {
        id: user._id.toString(),
        userId: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: "loggedin"
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}