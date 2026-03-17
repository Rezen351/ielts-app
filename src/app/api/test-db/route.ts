import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';

export async function GET() {
  try {
    // 1. Connect to DB
    await dbConnect();

    // 2. Perform a test operation (e.g., fetch first 10 results)
    const results = await TestResult.find({}).limit(10).sort({ date: -1 });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully connected to Cosmos DB MongoDB!",
      dataCount: results.length,
      results 
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to connect to database" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Create a new test result entry
    const newResult = await TestResult.create({
      candidateName: body.name || "Test Candidate",
      testType: body.type || "Reading",
      score: body.score || 8.5
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data saved successfully!",
      data: newResult 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
