import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  StopIcon,
  CircleIcon,
  EyeNoneIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
  TrashIcon,
  IdCardIcon,
} from '@radix-ui/react-icons';

interface HighlightTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  hideLoupeOption?: boolean;
}

// Custom tooltip component following Radix pattern
function TooltipWrapper({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-black text-white px-2 py-1 text-xs rounded border border-gray-600"
          sideOffset={5}
        >
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export const HighlightTypeSelector = ({
  selectedType,
  onTypeChange,
  hideLoupeOption = false,
}: HighlightTypeSelectorProps) => {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <ToggleGroup.Root
        type="single"
        value={selectedType}
        onValueChange={value => {
          onTypeChange(value || '');
        }}
        className="flex gap-1"
      >
        <TooltipWrapper content="Rectangle (R)">
          <ToggleGroup.Item
            value="rectangle"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <StopIcon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        <TooltipWrapper content="Circle (C)">
          <ToggleGroup.Item
            value="circle"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <CircleIcon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        <TooltipWrapper content="Scribble (S)">
          <ToggleGroup.Item
            value="scribble"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <EyeNoneIcon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        <TooltipWrapper content="Cross (X)">
          <ToggleGroup.Item
            value="cross"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <Cross1Icon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        <TooltipWrapper content="Sticker">
          <ToggleGroup.Item
            value="sticker"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <IdCardIcon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        <TooltipWrapper content="Delete (D)">
          <ToggleGroup.Item
            value="delete"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-red-500 aria-checked:text-white aria-checked:hover:bg-red-500 rounded flex items-center"
          >
            <TrashIcon className="w-4 h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>

        {!hideLoupeOption && (
          <TooltipWrapper content="Loupe (L)">
            <ToggleGroup.Item
              value="loupe"
              className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </ToggleGroup.Item>
          </TooltipWrapper>
        )}
      </ToggleGroup.Root>
    </div>
  );
};
