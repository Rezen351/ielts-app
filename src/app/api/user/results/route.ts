import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';

export async function POST(request: Request) {
  try {
    const { userId, module, topic, score, maxScore, data } = await request.json();

    if (!userId || !module || score === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newResult = await TestResult.create({
      userId,
      module,
      topic,
      score,
      maxScore,
      data,
      date: new Date()
    });

    return NextResponse.json({ success: true, result: newResult });

  } catch (error: any) {
    console.error('Save Result error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
