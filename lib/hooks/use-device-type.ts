"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Hook to detect device type for responsive image optimization
 * Uses window width to determine device type
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");

  useEffect(() => {
    // Default to mobile for SSR
    if (typeof window === "undefined") {
      return;
    }

    const updateDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    // Set initial device type
    updateDeviceType();

    // Listen for resize events
    window.addEventListener("resize", updateDeviceType);

    return () => {
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  return deviceType;
}

/**
 * Hook to get optimized image quality based on device type
 */
export function useOptimizedImageQuality(
  configType: "galleryThumbnail" | "propertyCard" | "propertyCover" | "lightbox"
): number {
  const deviceType = useDeviceType();
  
  // Import dynamically to avoid SSR issues
  const { getOptimizedQuality } = require("@/lib/utils/image-optimization");
  
  return getOptimizedQuality(configType, deviceType);
}

