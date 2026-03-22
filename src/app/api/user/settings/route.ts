import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { userId, name, email, nativeLanguage, hobbies, occupation, goalBand } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json({ message: 'Email is already in use' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name,
        email,
        nativeLanguage,
        hobbies: Array.isArray(hobbies) ? hobbies : (hobbies ? hobbies.split(',').map((h: string) => h.trim()) : []),
        occupation,
        goalBand: Number(goalBand) || 7.0
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
