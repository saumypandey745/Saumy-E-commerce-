// src/app/api/ai/recommendations/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // In real app, you'd call your recommendation engine. Here we return static data.
    const dummy = [
      {
        _id: 'rec1',
        title: 'Echo Smart Speaker',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1580894894514-8b4d7f1f8e6a?auto=format&fit=crop&w=800&q=80',
        category_id: 'Audio',
      },
      {
        _id: 'rec2',
        title: 'PixelBook Pro Laptop',
        price: 1499.0,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        category_id: 'Computers',
      },
    ];
    return NextResponse.json({ success: true, recommendations: dummy });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
