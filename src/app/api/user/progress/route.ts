import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Fetch recent results (tanpa sort sementara untuk menghindari error indeks Cosmos DB)
    const recentActivities = await TestResult.find({ userId })
      .limit(5);

    // 2. Aggregate average scores by module
    const stats = await TestResult.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$module",
          avgScore: { $avg: "$score" },
          totalTests: { $sum: 1 }
        }
      }
    ]);

    // 3. Simple Recommendation Logic
    // Find module with lowest avg score or least tests
    const modulePriority = ['Listening', 'Reading', 'Writing', 'Speaking'];
    const completedModules = stats.map(s => s._id);
    const missingModules = modulePriority.filter(m => !completedModules.includes(m));

    let recommendation = "";
    if (missingModules.length > 0) {
      recommendation = `Start with ${missingModules[0]} to complete your profile.`;
    } else {
      const lowestModule = stats.reduce((prev, curr) => (prev.avgScore < curr.avgScore) ? prev : curr);
      recommendation = `Your ${lowestModule._id} score is lower than others. Try a practice session.`;
    }

    return NextResponse.json({ 
      success: true, 
      recentActivities, 
      stats,
      recommendation,
      totalOverallTests: stats.reduce((acc, curr) => acc + curr.totalTests, 0)
    });

  } catch (error: any) {
    console.error('Progress API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
