/**
 * Image optimization utilities for mobile-first responsive images
 */

export interface ResponsiveImageConfig {
  mobile: {
    width: number;
    quality: number;
    sizes: string;
  };
  tablet: {
    width: number;
    quality: number;
    sizes: string;
  };
  desktop: {
    width: number;
    quality: number;
    sizes: string;
  };
}

/**
 * Predefined configurations for different image use cases
 */
export const IMAGE_CONFIGS = {
  // Gallery thumbnail images (horizontal scroll)
  galleryThumbnail: {
    mobile: {
      width: 280,
      quality: 75, // Lower quality for mobile to save bandwidth
      sizes: "(max-width: 640px) 280px, (max-width: 768px) 320px, 400px",
    },
    tablet: {
      width: 400,
      quality: 80,
      sizes: "(max-width: 1024px) 400px, 500px",
    },
    desktop: {
      width: 500,
      quality: 90,
      sizes: "500px",
    },
  },
  
  // Property card cover images
  propertyCard: {
    mobile: {
      width: 400,
      quality: 75,
      sizes: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw",
    },
    tablet: {
      width: 600,
      quality: 80,
      sizes: "(max-width: 1024px) 50vw, 33vw",
    },
    desktop: {
      width: 800,
      quality: 85,
      sizes: "33vw",
    },
  },
  
  // Property detail page cover image
  propertyCover: {
    mobile: {
      width: 800,
      quality: 80,
      sizes: "100vw",
    },
    tablet: {
      width: 1200,
      quality: 85,
      sizes: "100vw",
    },
    desktop: {
      width: 1920,
      quality: 90,
      sizes: "100vw",
    },
  },
  
  // Lightbox/fullscreen images
  lightbox: {
    mobile: {
      width: 1080,
      quality: 85,
      sizes: "100vw",
    },
    tablet: {
      width: 1440,
      quality: 90,
      sizes: "100vw",
    },
    desktop: {
      width: 1920,
      quality: 95,
      sizes: "100vw",
    },
  },
} as const;

/**
 * Get optimized image configuration based on device type
 * Uses mobile-first approach
 */
export function getImageConfig(
  configType: keyof typeof IMAGE_CONFIGS,
  deviceType: "mobile" | "tablet" | "desktop" = "mobile"
): ResponsiveImageConfig[keyof ResponsiveImageConfig] {
  const config = IMAGE_CONFIGS[configType];
  
  // Return appropriate config based on device
  switch (deviceType) {
    case "desktop":
      return config.desktop;
    case "tablet":
      return config.tablet;
    default:
      return config.mobile;
  }
}

/**
 * Get responsive sizes string for Next.js Image component
 * Optimized for mobile-first loading
 */
export function getResponsiveSizes(
  configType: keyof typeof IMAGE_CONFIGS
): string {
  const config = IMAGE_CONFIGS[configType];
  // Return mobile sizes as default (mobile-first)
  return config.mobile.sizes;
}

/**
 * Get optimized quality based on device type
 * Lower quality for mobile to improve performance
 */
export function getOptimizedQuality(
  configType: keyof typeof IMAGE_CONFIGS,
  deviceType: "mobile" | "tablet" | "desktop" = "mobile"
): number {
  const config = IMAGE_CONFIGS[configType];
  return getImageConfig(configType, deviceType).quality;
}

/**
 * Determine if image should be loaded eagerly or lazily
 * First 2-3 images should be eager, rest lazy
 */
export function shouldLoadEagerly(index: number, maxEager: number = 3): boolean {
  return index < maxEager;
}

/**
 * Get optimized image dimensions for mobile
 * Returns width and height recommendations
 */
export function getMobileDimensions(
  aspectRatio: "square" | "landscape" | "portrait" = "landscape"
): { width: number; height: number } {
  const baseWidth = 400; // Mobile-optimized base width
  
  switch (aspectRatio) {
    case "square":
      return { width: baseWidth, height: baseWidth };
    case "portrait":
      return { width: baseWidth, height: Math.round(baseWidth * 1.5) };
    case "landscape":
    default:
      return { width: baseWidth, height: Math.round(baseWidth * 0.75) };
  }
}

