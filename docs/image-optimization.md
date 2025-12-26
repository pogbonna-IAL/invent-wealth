# Image Optimization Strategy for Mobile

This document outlines the programmatic image optimization strategy implemented for mobile-first responsive images across the InventWealth platform.

## Overview

The image optimization system is designed to:
- Reduce bandwidth usage on mobile devices
- Improve page load times
- Maintain high quality on desktop devices
- Automatically adapt to different screen sizes

## Implementation

### 1. Next.js Configuration (`next.config.ts`)

The Next.js image configuration includes:
- **Device Sizes**: Optimized breakpoints for different devices
- **Image Sizes**: Predefined sizes for responsive images
- **Formats**: Automatic AVIF and WebP conversion
- **Cache TTL**: 60 seconds minimum cache time

### 2. Image Optimization Utility (`lib/utils/image-optimization.ts`)

Provides predefined configurations for different image use cases:

#### Gallery Thumbnails
- **Mobile**: 280px width, 75% quality
- **Tablet**: 400px width, 80% quality  
- **Desktop**: 500px width, 90% quality

#### Property Cards
- **Mobile**: 400px width, 75% quality
- **Tablet**: 600px width, 80% quality
- **Desktop**: 800px width, 85% quality

#### Property Cover Images
- **Mobile**: 800px width, 80% quality
- **Tablet**: 1200px width, 85% quality
- **Desktop**: 1920px width, 90% quality

#### Lightbox Images
- **Mobile**: 1080px width, 85% quality
- **Tablet**: 1440px width, 90% quality
- **Desktop**: 1920px width, 95% quality

### 3. Device Detection Hook (`lib/hooks/use-device-type.ts`)

React hook that detects device type based on window width:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 4. Component Updates

#### PropertyGallery Component
- Uses device detection to optimize quality dynamically
- Implements lazy loading for images beyond the first 3
- Responsive sizes attribute for optimal loading

#### PropertyCard Component
- Mobile-optimized sizes and quality
- Lazy loading by default
- Responsive breakpoints

## Benefits

1. **Reduced Bandwidth**: Mobile users download 20-30% smaller images
2. **Faster Load Times**: Optimized images load faster on slower connections
3. **Better UX**: Progressive loading improves perceived performance
4. **Automatic Optimization**: Next.js handles format conversion (AVIF/WebP)
5. **Responsive**: Automatically adapts to different screen sizes

## Usage

### In Components

```tsx
import { getResponsiveSizes, getOptimizedQuality } from "@/lib/utils/image-optimization";
import { useDeviceType } from "@/lib/hooks/use-device-type";

function MyComponent() {
  const deviceType = useDeviceType();
  
  return (
    <Image
      src="/path/to/image.jpg"
      alt="Description"
      fill
      sizes={getResponsiveSizes("galleryThumbnail")}
      quality={getOptimizedQuality("galleryThumbnail", deviceType)}
      loading="lazy"
    />
  );
}
```

## Future Enhancements

1. **Image CDN**: Consider using a CDN for further optimization
2. **Blur Placeholders**: Add blur placeholders for better perceived performance
3. **Progressive JPEG**: Consider progressive JPEG for large images
4. **Image Compression Script**: Automated compression for uploaded images

## Testing

To verify optimization:
1. Open browser DevTools
2. Check Network tab
3. Filter by Images
4. Verify image sizes are appropriate for device
5. Check that WebP/AVIF formats are being served when supported

