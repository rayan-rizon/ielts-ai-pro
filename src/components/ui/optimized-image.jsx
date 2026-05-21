import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';

/**
 * OptimizedImage - A component that handles lazy loading, error states, and loading states for images.
 *
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Additional CSS classes
 * @param {string} fallback - Fallback image URL if main image fails
 * @param {boolean} eager - If true, skips lazy loading (for above-the-fold images)
 * @param {string} aspectRatio - Aspect ratio for the container (e.g., "16/9", "1/1", "4/3")
 */
export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  eager = false,
  aspectRatio,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [eager]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const containerStyles = aspectRatio ? { aspectRatio } : {};

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden bg-muted', className)}
      style={containerStyles}
      data-oid="fmacpi3"
    >
      {/* Skeleton placeholder while loading */}
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full" data-oid="o-wb722" />}

      {/* Error state */}
      {hasError && !fallback && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground"
          data-oid="btexsbu"
        >
          <div className="text-center p-4" data-oid="4_8bgyu">
            <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50" data-oid="g282bnu" />
            <p className="text-xs" data-oid="xbfot9y">
              Image unavailable
            </p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={hasError && fallback ? fallback : src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
          data-oid=":akgxe0"
        />
      )}
    </div>
  );
}

export default OptimizedImage;
