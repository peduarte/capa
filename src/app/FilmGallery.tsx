'use client';

import Image from 'next/image';
import * as Accordion from '@radix-ui/react-accordion';
import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect, useRef } from 'react';
import filmStocks from '../filmStocks.json';

interface Roll {
  folderName: string;
  twin: string;
  lab: string;
  film: string;
  date: string;
  images: string[];
}

interface SelectedImage {
  src: string;
  alt: string;
  filename: string;
  roll: Roll;
  imageIndex: number;
}

export default function FilmGallery({ rolls }: { rolls: Roll[] }) {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const gridRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getFilmStockInfo = (filmKey: string) => {
    const filmInfo = filmStocks[filmKey as keyof typeof filmStocks];
    return {
      friendlyName: filmInfo?.friendlyName || filmKey,
      accentColor: filmInfo?.accentColor || '#666666',
    };
  };

  const getImageId = (roll: Roll, imageIndex: number) => {
    return `${roll.folderName}-${imageIndex}`;
  };

  const openDialog = (roll: Roll, imageIndex: number) => {
    const image = roll.images[imageIndex];
    setSelectedImage({
      src: `/rolls/${encodeURIComponent(roll.folderName)}/${image}`,
      alt: `Film photo ${image} from roll ${roll.twin}`,
      filename: image,
      roll,
      imageIndex,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    // Clear selected image after dialog animation completes
    setTimeout(() => setSelectedImage(null), 200);
  };

  const handleAccordionChange = (newOpenAccordions: string[]) => {
    // Find newly opened accordions
    const newlyOpened = newOpenAccordions.filter(
      value => !openAccordions.includes(value)
    );

    setOpenAccordions(newOpenAccordions);

    // Focus the first image in any newly opened accordion
    if (newlyOpened.length > 0) {
      // Get the roll index from the newly opened accordion value (e.g., "roll-0" -> 0)
      const rollIndex = parseInt(newlyOpened[0].split('-')[1]);
      const roll = rolls[rollIndex];

      if (roll && roll.images.length > 0) {
        // Focus the first image in this roll
        const firstImageId = `${roll.folderName}-0`;
        const firstImageElement = gridRefs.current.get(firstImageId);

        if (firstImageElement) {
          // Use setTimeout to ensure the accordion content is fully rendered
          setTimeout(() => {
            firstImageElement.focus();
          }, 100);
        }
      }
    }
  };

  const getGridColumns = () => {
    // This should match the CSS grid classes
    // grid-cols-4 md:grid-cols-6 lg:grid-cols-8
    if (window.innerWidth >= 1024) return 8; // lg
    if (window.innerWidth >= 768) return 6; // md
    return 4; // default
  };

  const handleGridKeyDown = (
    event: React.KeyboardEvent,
    roll: Roll,
    currentImageIndex: number
  ) => {
    const { key } = event;

    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      openDialog(roll, currentImageIndex);
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    event.preventDefault();

    const cols = getGridColumns();
    const totalImages = roll.images.length;
    let newIndex = currentImageIndex;

    switch (key) {
      case 'ArrowLeft':
        newIndex =
          currentImageIndex > 0 ? currentImageIndex - 1 : totalImages - 1;
        break;
      case 'ArrowRight':
        newIndex =
          currentImageIndex < totalImages - 1 ? currentImageIndex + 1 : 0;
        break;
      case 'ArrowUp':
        newIndex = currentImageIndex - cols;
        if (newIndex < 0) {
          // Go to the last row, same column
          const col = currentImageIndex % cols;
          const lastRowStart = Math.floor((totalImages - 1) / cols) * cols;
          newIndex = Math.min(lastRowStart + col, totalImages - 1);
        }
        break;
      case 'ArrowDown':
        newIndex = currentImageIndex + cols;
        if (newIndex >= totalImages) {
          // Go to the first row, same column
          newIndex = currentImageIndex % cols;
        }
        break;
    }

    // Focus the new image
    const newImageId = `${roll.folderName}-${newIndex}`;
    const newImageElement = gridRefs.current.get(newImageId);
    if (newImageElement) {
      newImageElement.focus();
    }
  };

  const setGridRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      gridRefs.current.set(id, element);
    } else {
      gridRefs.current.delete(id);
    }
  };

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Accordion.Root
        type="multiple"
        className="space-y-px"
        onValueChange={handleAccordionChange}
      >
        {rolls.map((roll, index) => (
          <Accordion.Item key={roll.folderName} value={`roll-${index}`}>
            <Accordion.Trigger className="group flex justify-between items-center w-full text-left relative pl-8 h-8 pr-4 focus:outline-none">
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-full group-hover:w-6 group-focus:w-6 transition-all duration-200"
                style={{
                  backgroundColor: getFilmStockInfo(roll.film).accentColor,
                }}
              />
              <div className="flex items-center w-full">
                <h2 className="flex-1">
                  {roll.twin} <span className="opacity-30">|</span> {roll.lab}{' '}
                  <span className="opacity-30">|</span>{' '}
                  <span className="font-medium">
                    {getFilmStockInfo(roll.film).friendlyName}
                  </span>{' '}
                  <span className="opacity-30">|</span> {roll.date}{' '}
                  <span className="opacity-30">|</span>{' '}
                  <span>{roll.images.length} frames</span>
                </h2>
              </div>
              <div className="flex items-center flex-shrink-0">
                <svg
                  className="w-5 h-5 group-data-[state=open]:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </Accordion.Trigger>

            <Accordion.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pt-[2px]">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-[2px] p-4 bg-black">
                {roll.images.map((image, imageIndex) => (
                  <Dialog.Trigger
                    key={image}
                    asChild
                    onClick={() => openDialog(roll, imageIndex)}
                  >
                    <div
                      ref={el =>
                        setGridRef(`${roll.folderName}-${imageIndex}`, el)
                      }
                      tabIndex={imageIndex === 0 ? 0 : -1}
                      className="relative aspect-[4/3] cursor-pointer bg-gray-200 focus:outline-none focus:ring-[2px] focus:ring-white focus:ring-offset-black"
                      onKeyDown={e => handleGridKeyDown(e, roll, imageIndex)}
                      onFocus={e => {
                        // When focused, make this the only focusable item in the grid
                        const gridContainer =
                          e.currentTarget.parentElement?.parentElement;
                        if (gridContainer) {
                          const allImages =
                            gridContainer.querySelectorAll('[tabindex]');
                          allImages.forEach((img, idx) => {
                            (img as HTMLElement).tabIndex =
                              idx === imageIndex ? 0 : -1;
                          });
                        }
                      }}
                    >
                      <Image
                        src={`/rolls/${encodeURIComponent(roll.folderName)}/${image}`}
                        alt={`Film photo ${image} from roll ${roll.twin}`}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                  </Dialog.Trigger>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      {/* Single Dialog Portal */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col">
          {/* Fixed header at top */}
          <div className="fixed top-0 left-0 right-0 z-60 bg-black/80 backdrop-blur-sm">
            <div className="flex justify-between items-center p-4">
              <Dialog.Title className="text-white font-medium">
                {selectedImage?.filename} -{' '}
                {selectedImage
                  ? getFilmStockInfo(selectedImage.roll.film).friendlyName
                  : ''}
              </Dialog.Title>
              <Dialog.Close className="text-white hover:text-gray-300 transition-colors focus:outline-none">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Dialog.Close>
            </div>
          </div>

          {/* Image content area */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20">
            <div className="relative w-full h-full">
              {selectedImage && (
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
