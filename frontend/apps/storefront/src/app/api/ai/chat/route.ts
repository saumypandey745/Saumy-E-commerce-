// src/app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    // Simple echo mock – in real app integrate Gemini AI
    const response = `You said: "${message}". This is a placeholder reply.`;
    return NextResponse.json({ success: true, response });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Chat failed' }, { status: 500 });
  }
}
