'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// Container aspect ratio (16:9)
const CONTAINER_ASPECT_RATIO = 16 / 9;

type ImageType = 'landscape' | 'portrait' | 'square';

interface DropZone {
  id: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of container width
  height: number; // percentage of container height
}

// Simple drop zones based on image type
const DROP_ZONES: Record<ImageType, DropZone[]> = {
  landscape: [
    {
      id: 'landscape-large',
      name: 'Large Center',
      x: 7.5, // (100 - 85) / 2
      y: 0, // calculated dynamically to maintain aspect ratio
      width: 85,
      height: 0, // calculated dynamically
    },
    {
      id: 'landscape-medium',
      name: 'Medium Center',
      x: 25, // (100 - 50) / 2
      y: 0, // calculated dynamically
      width: 50,
      height: 0, // calculated dynamically
    },
    {
      id: 'landscape-left',
      name: 'Left Half',
      x: 2.5, // (50 - 45) / 2 for left half
      y: 0, // calculated dynamically
      width: 45,
      height: 0, // calculated dynamically
    },
    {
      id: 'landscape-right',
      name: 'Right Half',
      x: 52.5, // 50 + (50 - 45) / 2 for right half
      y: 0, // calculated dynamically
      width: 45,
      height: 0, // calculated dynamically
    },
  ],
  portrait: [
    {
      id: 'portrait-large',
      name: 'Large Center',
      x: 0, // calculated dynamically to maintain aspect ratio
      y: 7.5, // (100 - 85) / 2
      width: 0, // calculated dynamically
      height: 85,
    },
    {
      id: 'portrait-medium',
      name: 'Medium Center',
      x: 0, // calculated dynamically
      y: 25, // (100 - 50) / 2
      width: 0, // calculated dynamically
      height: 50,
    },
    {
      id: 'portrait-left',
      name: 'Left Half',
      x: 0, // calculated dynamically for left half
      y: 25, // (100 - 50) / 2
      width: 0, // calculated dynamically
      height: 50,
    },
    {
      id: 'portrait-right',
      name: 'Right Half',
      x: 0, // calculated dynamically for right half
      y: 25, // (100 - 50) / 2
      width: 0, // calculated dynamically
      height: 50,
    },
  ],
  square: [
    // For now, treat squares like landscape but we can adjust later
    {
      id: 'square-large',
      name: 'Large Center',
      x: 7.5,
      y: 0, // calculated dynamically
      width: 85,
      height: 0, // calculated dynamically
    },
    {
      id: 'square-medium',
      name: 'Medium Center',
      x: 25,
      y: 0, // calculated dynamically
      width: 50,
      height: 0, // calculated dynamically
    },
    {
      id: 'square-left',
      name: 'Left Half',
      x: 2.5,
      y: 0, // calculated dynamically
      width: 45,
      height: 0, // calculated dynamically
    },
    {
      id: 'square-right',
      name: 'Right Half',
      x: 52.5,
      y: 0, // calculated dynamically
      width: 45,
      height: 0, // calculated dynamically
    },
  ],
};

interface DroppedImage {
  id: string;
  src: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  width: number; // percentage of container width (0-100)
  height: number; // percentage of container height (0-100)
  aspectRatio: number; // width / height
  zoneId: string; // which drop zone this image occupies
}

interface ZinePage {
  id: string;
  images: DroppedImage[];
}

export default function ZinePage() {
  const [pages, setPages] = useState<ZinePage[]>([
    { id: 'page-1', images: [] },
  ]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [draggedImageAspectRatio, setDraggedImageAspectRatio] = useState<
    number | null
  >(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [allImages, setAllImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const dragCounter = useRef(0);

  // Helper function to get image type based on aspect ratio
  const getImageType = (aspectRatio: number): ImageType => {
    if (aspectRatio > 1.1) return 'landscape'; // threshold for landscape
    if (aspectRatio < 0.9) return 'portrait'; // threshold for portrait
    return 'square';
  };

  // Helper function to calculate exact image placement within a zone while maintaining aspect ratio
  const calculateImagePlacement = (
    baseZone: DropZone,
    imageAspectRatio: number,
    imageType: ImageType
  ) => {
    // Container aspect ratio is 16:9
    const containerAspectRatio = CONTAINER_ASPECT_RATIO;

    // Define maximum dimensions (as percentages of container)
    const maxWidth = 90; // Maximum 90% of container width
    const maxHeight = 85; // Maximum 85% of container height

    let imageWidth: number;
    let imageHeight: number;

    if (imageType === 'landscape' || imageType === 'square') {
      // For landscape/square: start with the zone's preferred width
      imageWidth = baseZone.width;

      // Calculate height maintaining aspect ratio
      // height% = width% * containerAspectRatio / imageAspectRatio
      imageHeight = (imageWidth * containerAspectRatio) / imageAspectRatio;

      // If height exceeds bounds, scale down maintaining aspect ratio
      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth = (imageHeight * imageAspectRatio) / containerAspectRatio;
      }

      // If width now exceeds bounds, scale down maintaining aspect ratio
      if (imageWidth > maxWidth) {
        imageWidth = maxWidth;
        imageHeight = (imageWidth * containerAspectRatio) / imageAspectRatio;
      }
    } else {
      // For portrait: start with the zone's preferred height
      imageHeight = baseZone.height;

      // Calculate width maintaining aspect ratio
      // width% = height% * imageAspectRatio / containerAspectRatio
      imageWidth = (imageHeight * imageAspectRatio) / containerAspectRatio;

      // If width exceeds bounds, scale down maintaining aspect ratio
      if (imageWidth > maxWidth) {
        imageWidth = maxWidth;
        imageHeight = (imageWidth * containerAspectRatio) / imageAspectRatio;
      }

      // If height now exceeds bounds, scale down maintaining aspect ratio
      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth = (imageHeight * imageAspectRatio) / containerAspectRatio;
      }
    }

    // Calculate positioning based on zone type
    let imageX: number;
    let imageY: number;

    if (baseZone.id.includes('left')) {
      // Left half: center within left 50% of container
      imageX = (50 - imageWidth) / 2;
    } else if (baseZone.id.includes('right')) {
      // Right half: center within right 50% of container
      imageX = 50 + (50 - imageWidth) / 2;
    } else {
      // Center zones: center within full container width
      imageX = (100 - imageWidth) / 2;
    }

    // Always center vertically for landscape/square, use zone position for portrait
    if (imageType === 'portrait' && baseZone.y > 0) {
      imageY = baseZone.y;
    } else {
      imageY = (100 - imageHeight) / 2;
    }

    return {
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    };
  };

  // Get available drop zones for the current drag operation (simplified)
  const getAvailableZones = (
    page: ZinePage,
    imageAspectRatio: number
  ): DropZone[] => {
    const imageType = getImageType(imageAspectRatio);
    const zones = DROP_ZONES[imageType];

    // Filter out zones that are already occupied (use original zone IDs)
    return zones.filter(
      zone => !page.images.some(img => img.zoneId === zone.id)
    );
  };

  // Helper function to get the closest zone to cursor position
  const getClosestZone = (
    zones: DropZone[],
    mouseX: number,
    mouseY: number,
    imageAspectRatio: number
  ): DropZone | null => {
    if (zones.length === 0 || !mousePosition) return null;

    const imageType = getImageType(imageAspectRatio);
    let closestZone = zones[0];
    let minDistance = Infinity;

    // Debug logging for landscape images
    if (imageType === 'landscape') {
      console.log('Landscape zone selection debug:', {
        mousePosition: { x: mouseX, y: mouseY },
        availableZones: zones.map(z => ({
          name: z.name,
          x: z.x,
          width: z.width,
        })),
      });
    }

    for (const zone of zones) {
      // Calculate the actual image placement for this zone
      const imagePlacement = calculateImagePlacement(
        zone,
        imageAspectRatio,
        imageType
      );

      // Calculate distance from mouse to image center (not zone center)
      const imageCenterX = imagePlacement.x + imagePlacement.width / 2;
      const imageCenterY = imagePlacement.y + imagePlacement.height / 2;

      const distance = Math.sqrt(
        Math.pow(mouseX - imageCenterX, 2) + Math.pow(mouseY - imageCenterY, 2)
      );

      // Debug logging for landscape images
      if (imageType === 'landscape') {
        console.log(
          `Zone "${zone.name}": center(${imageCenterX.toFixed(1)}, ${imageCenterY.toFixed(1)}), distance: ${distance.toFixed(1)}`
        );
      }

      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    }

    if (imageType === 'landscape') {
      console.log(`Selected zone: ${closestZone.name}`);
    }

    return closestZone;
  };

  // Fetch images from API route
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const images = await response.json();
        setAllImages(images);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const addNewPage = () => {
    const newPage: ZinePage = {
      id: `page-${Date.now()}`,
      images: [],
    };
    setPages(prev => [...prev, newPage]);
  };

  const handleDragStart = (imageSrc: string) => {
    setDraggedImage(imageSrc);

    // Get the aspect ratio of the dragged image synchronously
    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setDraggedImageAspectRatio(aspectRatio);
      console.log(
        'Drag started with aspect ratio:',
        aspectRatio,
        'for image:',
        imageSrc
      );
    };
    img.onerror = () => {
      setDraggedImageAspectRatio(1.5); // fallback to common landscape ratio
      console.log('Error loading image, using fallback aspect ratio 1.5');
    };
    img.src = imageSrc;
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDraggedImageAspectRatio(null);
    setMousePosition(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Update mouse position during drag
    if (draggedImage) {
      const pageElement = e.currentTarget as HTMLElement;
      const rect = pageElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Convert to percentages
      const xPercent = (x / containerWidth) * 100;
      const yPercent = (y / containerHeight) * 100;

      setMousePosition({ x: xPercent, y: yPercent });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
  };

  const getImageDimensions = (
    src: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise(resolve => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = src;
    });
  };

  const handleDrop = async (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (!draggedImage || !draggedImageAspectRatio) return;

    // Get current page
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    // Get available zones for this drag operation
    const availableZones = getAvailableZones(page, draggedImageAspectRatio);

    if (availableZones.length === 0) {
      return; // No available zones for this image
    }

    // Determine which zone was dropped into using the same logic as drag detection
    const pageElement = e.currentTarget as HTMLElement;
    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // Convert mouse position to percentages
    const xPercent = (x / containerWidth) * 100;
    const yPercent = (y / containerHeight) * 100;

    // Use the same closest zone logic as during drag
    const targetZone =
      getClosestZone(
        availableZones,
        xPercent,
        yPercent,
        draggedImageAspectRatio
      ) || availableZones[0];

    // Calculate exact image placement using the shared function
    const imagePlacement = calculateImagePlacement(
      targetZone,
      draggedImageAspectRatio,
      getImageType(draggedImageAspectRatio)
    );

    const newImage: DroppedImage = {
      id: `img-${Date.now()}`,
      src: draggedImage,
      x: imagePlacement.x,
      y: imagePlacement.y,
      width: imagePlacement.width,
      height: imagePlacement.height,
      aspectRatio: draggedImageAspectRatio,
      zoneId: targetZone.id,
    };

    setPages(prev =>
      prev.map(page =>
        page.id === pageId
          ? {
              ...page,
              images: [...page.images, newImage],
            }
          : page
      )
    );
  };

  const deleteImage = (pageId: string, imageId: string) => {
    setPages(prev =>
      prev.map(page =>
        page.id === pageId
          ? { ...page, images: page.images.filter(img => img.id !== imageId) }
          : page
      )
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-lg text-white">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Column - Photo Library */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Photos ({allImages.length})</h2>
          <button
            onClick={addNewPage}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
          >
            Add Page
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {allImages.map((imageSrc, index) => (
            <div
              key={index}
              className="cursor-grab active:cursor-grabbing bg-gray-50 overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
              draggable
              onDragStart={() => handleDragStart(imageSrc)}
              onDragEnd={handleDragEnd}
            >
              <Image
                src={imageSrc}
                alt={`Photo ${index + 1}`}
                width={120}
                height={120}
                className="w-full h-auto object-contain hover:opacity-80 transition-opacity"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Zine Pages */}
      <div className="flex-1 relative">
        {/* Main Content - Centered 16:9 Pages */}
        <div className="h-full overflow-y-auto">
          <div className="space-y-8 p-4">
            {pages.map((page, pageIndex) => (
              <div key={page.id} className="flex flex-col items-center">
                <div className="w-full max-w-4xl">
                  <div
                    className="relative w-full bg-white border-1 border-gray-300"
                    style={{ paddingTop: '56.25%' }} // 16:9 aspect ratio (9/16 * 100%)
                  >
                    <div
                      className={`absolute inset-0 transition-all duration-200 ${
                        draggedImage
                          ? 'bg-blue-50 border-blue-400'
                          : 'hover:border-gray-400'
                      }`}
                      data-page-container
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, page.id)}
                    >
                      {/* Drop zone indicators - only visible when dragging */}
                      {draggedImage &&
                        draggedImageAspectRatio &&
                        mousePosition &&
                        (() => {
                          const currentPage = pages.find(p => p.id === page.id);
                          if (!currentPage) return null;

                          const availableZones = getAvailableZones(
                            currentPage,
                            draggedImageAspectRatio
                          );

                          // Get only the closest zone to the cursor
                          const closestZone = getClosestZone(
                            availableZones,
                            mousePosition.x,
                            mousePosition.y,
                            draggedImageAspectRatio
                          );

                          if (!closestZone) return null;

                          // Calculate exact image placement within the zone
                          const imagePlacement = calculateImagePlacement(
                            closestZone,
                            draggedImageAspectRatio,
                            getImageType(draggedImageAspectRatio)
                          );

                          const imageType = getImageType(
                            draggedImageAspectRatio
                          );

                          // Debug logging
                          console.log('Drop zone preview debug:', {
                            draggedImageAspectRatio,
                            imageType,
                            closestZone: closestZone.name,
                            imagePlacement: {
                              width: imagePlacement.width,
                              height: imagePlacement.height,
                              calculatedAspectRatio:
                                imagePlacement.width / imagePlacement.height,
                            },
                          });

                          return (
                            <div
                              key={closestZone.id}
                              className="absolute border-2 border-dashed border-blue-400 bg-blue-50/50 transition-all duration-200"
                              style={{
                                left: `${imagePlacement.x}%`,
                                top: `${imagePlacement.y}%`,
                                width: `${imagePlacement.width}%`,
                                height: `${imagePlacement.height}%`,
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                                <div className="text-center">
                                  <div className="text-sm font-medium">
                                    {closestZone.name}
                                  </div>
                                  <div className="text-xs mt-1 capitalize">
                                    {imageType} image
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                      {page.images.map(image => (
                        <div
                          key={image.id}
                          className="absolute select-none group"
                          style={{
                            left: `${image.x}%`,
                            top: `${image.y}%`,
                            width: `${image.width}%`,
                            height: `${image.height}%`,
                          }}
                        >
                          <Image
                            src={image.src}
                            alt="Dropped photo"
                            fill
                            className="object-contain"
                            draggable={false}
                            unoptimized
                          />

                          {/* Delete button */}
                          <button
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-lg"
                            onClick={e => {
                              e.stopPropagation();
                              deleteImage(page.id, image.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {page.images.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-s">Drop photos here</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
