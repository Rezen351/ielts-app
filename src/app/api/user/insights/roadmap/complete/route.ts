import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap } from '@/models/Learning';

export async function POST(request: Request) {
  try {
    const { userId, topicId } = await request.json();

    if (!userId || !topicId) {
      return NextResponse.json({ message: 'User ID and topic ID are required' }, { status: 400 });
    }

    await dbConnect();

    const roadmap = await UserRoadmap.findOne({ userId });

    if (!roadmap) {
      return NextResponse.json({ message: 'Roadmap not found' }, { status: 404 });
    }

    // Find the current topic index
    const topicIndex = roadmap.topics.findIndex((t: any) => t.topicId === topicId);

    if (topicIndex === -1) {
      return NextResponse.json({ message: 'Topic not found in roadmap' }, { status: 404 });
    }

    // Mark current topic as completed
    roadmap.topics[topicIndex].status = 'Completed';

    // Unlock the next topic
    const nextTopic = roadmap.topics.find((t: any) => t.order === roadmap.topics[topicIndex].order + 1);
    if (nextTopic && nextTopic.status === 'Locked') {
      nextTopic.status = 'Available';
    }

    // Check if all topics are completed
    const allCompleted = roadmap.topics.every((t: any) => t.status === 'Completed');
    if (allCompleted) {
      roadmap.status = 'Completed';
    }

    roadmap.lastUpdated = new Date();
    await roadmap.save();

    return NextResponse.json({ success: true, roadmap });

  } catch (error: any) {
    console.error('Roadmap update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
