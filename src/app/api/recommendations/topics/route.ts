import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';

export async function GET() {
  try {
    const systemPrompt = `Generate a list of 12 diverse IELTS study topics (3 for each module: Listening, Reading, Writing, Speaking). 
    The topics should be realistic and common in IELTS exams.
    Format as JSON: { 
      Listening: [string], 
      Reading: [string], 
      Writing: [string], 
      Speaking: [string] 
    }`;

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" }
    });

    const topics = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({ success: true, topics });

  } catch (error: any) {
    console.error('Topic recommendation error:', error);
    // Fallback topics in case AI fails
    const fallbackTopics = {
      Listening: ["University Orientation", "Library Registration", "Travel Agency Booking"],
      Reading: ["Climate Change Impact", "History of Architecture", "Future of Transportation"],
      Writing: ["Education vs Experience", "Urbanization Challenges", "Economic Growth and Environment"],
      Speaking: ["Hometown and Family", "Work and Study", "Hobbies and Interests"]
    };
    return NextResponse.json({ success: true, topics: fallbackTopics, isFallback: true });
  }
}
