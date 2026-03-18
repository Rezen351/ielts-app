import { NextResponse } from 'next/server';
import { translateText } from '@/lib/azure-translator';

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ message: 'Text and targetLang are required' }, { status: 400 });
    }

    if (targetLang === 'en') {
      return NextResponse.json({ success: true, translatedText: text });
    }

    const translatedText = await translateText(text, targetLang);

    return NextResponse.json({ success: true, translatedText });

  } catch (error: any) {
    console.error('API Translation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
