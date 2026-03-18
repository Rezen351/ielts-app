import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { userId, nativeLanguage, hobbies, occupation, goalBand } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        nativeLanguage,
        hobbies: Array.isArray(hobbies) ? hobbies : (hobbies ? hobbies.split(',').map((h: string) => h.trim()) : []),
        occupation,
        goalBand: Number(goalBand) || 7.0
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
