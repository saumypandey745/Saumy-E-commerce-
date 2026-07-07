// src/app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const msgLower = message.toLowerCase();
    
    let response = "That's a great question! I'm currently running in local demo mode, but I can help you find products like Headphones, Keyboards, Chairs, or Smartwatches. What are you looking for?";

    if (!message) {
      response = "Hello there! I'm your Saumy E-commerce AI assistant. Are you looking for any specific products today?";
    } else if (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggest')) {
      response = "I'm just a bundle of code, but I'm doing great! Ready to help you find the best electronics. What can I help you find?";
    } else if (msgLower.includes("headphone") || msgLower.includes("audio")) {
      response = "We have an amazing selection of Audio products! I highly recommend checking out our 'Aura Premium ANC Headphones'.";
    } else if (msgLower.includes("keyboard") || msgLower.includes("mouse")) {
      response = "For peripherals, the 'Nexus Mechanical Keyboard V2' is one of our top sellers. You can find it in the products catalog!";
    } else if (msgLower.includes("cart") || msgLower.includes("checkout")) {
      response = "You can view your cart by clicking the shopping cart icon at the top of the page, and proceed to checkout from there whenever you're ready!";
    } else if (msgLower.includes("watch") || msgLower.includes("wearable")) {
      response = "Our 'Chronos Smartwatch Elite' is very popular right now. It features a sleek design and advanced tracking!";
    } else if (msgLower.includes("chair") || msgLower.includes("workspace")) {
      response = "Looking to upgrade your workspace? The 'Lumina Ergonomic Chair' is currently available and offers fantastic lumbar support.";
    }

    // Simulate network delay for a more natural feel
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, response });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Chat failed' }, { status: 500 });
  }
}
