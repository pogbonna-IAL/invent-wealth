"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  getResponsiveSizes, 
  getOptimizedQuality, 
  shouldLoadEagerly 
} from "@/lib/utils/image-optimization";
import { useDeviceType } from "@/lib/hooks/use-device-type";

interface PropertyGalleryProps {
  images: string[];
  coverImage?: string | null;
  propertyName: string;
}

export function PropertyGallery({ images, coverImage, propertyName }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const deviceType = useDeviceType();
  
  // Ensure images is an array
  const imagesArray = Array.isArray(images) ? images : [];
  
  // Combine cover image with gallery images (cover first, then gallery)
  const allImages = coverImage 
    ? [coverImage, ...imagesArray.filter(img => img && img !== coverImage)] // Avoid duplicate cover
    : imagesArray;

  // Filter out any null/undefined/empty images and limit to 20 images total
  const displayImages = allImages.filter(img => img && typeof img === 'string' && img.trim() !== '').slice(0, 20);

  if (displayImages.length === 0) {
    return null;
  }

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    
    if (direction === "prev") {
      setSelectedIndex(selectedIndex === 0 ? displayImages.length - 1 : selectedIndex - 1);
    } else {
      setSelectedIndex(selectedIndex === displayImages.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="mb-8">
        {/* Horizontal scrolling gallery */}
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4">
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {displayImages.map((image, index) => {
                if (imageErrors.has(index)) {
                  return null; // Skip failed images
                }
                return (
                  <button
                    key={index}
                    onClick={() => openLightbox(index)}
                    className="relative h-64 md:h-80 lg:h-96 w-auto min-w-[280px] md:min-w-[400px] lg:min-w-[500px] flex-shrink-0 rounded-lg overflow-hidden bg-muted group cursor-pointer"
                    aria-label={`View image ${index + 1} of ${displayImages.length}`}
                  >
                    <Image
                      src={image}
                      alt={`${propertyName} - Image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes={getResponsiveSizes("galleryThumbnail")}
                      quality={getOptimizedQuality("galleryThumbnail", deviceType)}
                      loading={shouldLoadEagerly(index) ? "eager" : "lazy"}
                      onError={() => handleImageError(index)}
                    />
                    {/* Image number overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {index + 1} / {displayImages.length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Scroll indicators */}
          {displayImages.length > 1 && (
            <>
              <div className="absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
            </>
          )}
        </div>
        
        {/* Scroll hint */}
        {displayImages.length > 1 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Scroll horizontally to view all {displayImages.length} images
          </p>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-7xl p-0 bg-black/95 border-none" showCloseButton={false}>
            <DialogTitle className="sr-only">
              {propertyName} - Image {selectedIndex + 1} of {displayImages.length}
            </DialogTitle>
            <div className="relative w-full h-[85vh] bg-black">
              <Image
                src={displayImages[selectedIndex]}
                alt={`${propertyName} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes={getResponsiveSizes("lightbox")}
                quality={getOptimizedQuality("lightbox", deviceType)}
                priority
              />
              
              {/* Navigation Buttons */}
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={() => navigateImage("prev")}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={() => navigateImage("next")}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={closeLightbox}
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </Button>
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {selectedIndex + 1} / {displayImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

