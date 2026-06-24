const categoryImages: Record<string, string[]> = {
  'Electronics': [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=800'
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800'
  ],
  'Home': [
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800'
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800'
  ],
  'Default': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'
  ]
};

function getFallbackImage(category: string) {
  for (const key of Object.keys(categoryImages)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      const arr = categoryImages[key];
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  return categoryImages['Default'][0];
}

export function getValidImageUrl(imageUrl?: string | null, fallbackCategory = 'Product') {
  if (!imageUrl || imageUrl.includes('placehold.co') || imageUrl.includes('placeholder.com')) {
    return getFallbackImage(fallbackCategory);
  }

  // Handle loremflickr replacements because loremflickr is often down or flaky
  if (imageUrl.includes('loremflickr.com')) {
    return getFallbackImage(fallbackCategory);
  }

  // Handle Double https:// bug
  if (imageUrl.startsWith('https://https://')) {
    return imageUrl.replace('https://https://', 'https://');
  }

  return imageUrl;
}
