import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap } from '@/models/Learning';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    const roadmap = await UserRoadmap.findOne({ userId });

    if (!roadmap) {
      return NextResponse.json({ message: 'Roadmap not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, roadmap });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to fetch roadmap' }, { status: 500 });
  }
}
