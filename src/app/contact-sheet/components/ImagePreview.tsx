import { useState } from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
  images: string[];
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  maxDisplay?: number;
}

export const ImagePreview = ({
  images,
  onRemove,
  onReorder,
  maxDisplay = 12,
}: ImagePreviewProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const displayImages = images.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, images.length - maxDisplay);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Selected Images ({images.length})
        </h3>
        {images.length > 0 && (
          <button
            onClick={() => {
              // Clear all images by removing them one by one from the end
              for (let i = images.length - 1; i >= 0; i--) {
                onRemove(i);
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayImages.map((imageSrc, index) => (
          <div
            key={`${imageSrc}-${index}`}
            className={`
              relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden
              cursor-move border-2 transition-all duration-200
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${
                dragOverIndex === index &&
                draggedIndex !== null &&
                draggedIndex !== index
                  ? 'border-blue-400 shadow-lg'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            draggable
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={e => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <Image
              src={imageSrc}
              alt={`Selected image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            />

            {/* Remove button */}
            <button
              onClick={e => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="
                absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 
                text-white rounded-full opacity-0 group-hover:opacity-100
                transition-opacity duration-200 flex items-center justify-center
                text-xs font-bold
              "
              aria-label={`Remove image ${index + 1}`}
            >
              ×
            </button>

            {/* Image number indicator */}
            <div
              className="
              absolute bottom-1 left-1 bg-black/50 text-white 
              text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            "
            >
              {index + 1}
            </div>
          </div>
        ))}

        {/* Hidden images indicator */}
        {hiddenCount > 0 && (
          <div
            className="
            aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg 
            flex flex-col items-center justify-center text-gray-500 dark:text-gray-400
          "
          >
            <span className="text-lg font-bold">+{hiddenCount}</span>
            <span className="text-xs text-center px-2">more images</span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Drag to reorder • Click × to remove • Total: {images.length} images
        </div>
      )}
    </div>
  );
};
