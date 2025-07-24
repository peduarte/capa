import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Tooltip from '@radix-ui/react-tooltip';
import { MagnifyingGlassIcon, TrashIcon } from '@radix-ui/react-icons';
import {
  ActionRectangleIcon,
  ActionCrossIcon,
  ActionScribbleIcon,
  ActionCircleIcon,
  ActionTwinCheckIcon,
  ActionDotIcon,
} from './Icons';

interface ToolbarProps {
  selectedAction: string;
  onActionChange: (action: string) => void;
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

export const Toolbar = ({
  selectedAction,
  onActionChange,
  hideLoupeOption = false,
}: ToolbarProps) => {
  return (
    <ToggleGroup.Root
      className="flex gap-1 items-center space-x-2 text-sm"
      type="single"
      value={selectedAction}
      onValueChange={value => {
        onActionChange(value || '');
      }}
    >
      <TooltipWrapper content="Rectangle (R)">
        <ToggleGroup.Item
          value="rectangle"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionRectangleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Circle (C)">
        <ToggleGroup.Item
          value="circle"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionCircleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Scribble (S)">
        <ToggleGroup.Item
          value="scribble"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionScribbleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Cross (X)">
        <ToggleGroup.Item
          value="cross"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionCrossIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <span className="h-[16px] w-[1px] bg-white/50" />

      <TooltipWrapper content="Twin Check Sticker">
        <ToggleGroup.Item
          value="sticker-twin-check"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionTwinCheckIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Dot Sticker">
        <ToggleGroup.Item
          value="sticker-dot"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
        >
          <ActionDotIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <span className="h-[16px] w-[1px] bg-white/50" />

      <TooltipWrapper content="Delete Frame(D)">
        <ToggleGroup.Item
          value="delete"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-red-500 aria-checked:text-white aria-checked:hover:bg-red-500 rounded flex items-center"
        >
          <TrashIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      {!hideLoupeOption && (
        <TooltipWrapper content="Loupe (L)">
          <ToggleGroup.Item
            value="loupe"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          >
            <MagnifyingGlassIcon className="h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>
      )}
    </ToggleGroup.Root>
  );
};
