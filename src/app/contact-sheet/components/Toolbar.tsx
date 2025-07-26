import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Select from '@radix-ui/react-select';
import { MagnifyingGlassIcon, TrashIcon } from '@radix-ui/react-icons';
import {
  ActionRectangleIcon,
  ActionCrossIcon,
  ActionScribbleIcon,
  ActionCircleIcon,
  ActionTwinCheckIcon,
  ActionDotIcon,
  ActionTextIcon,
} from './Icons';
import { TextColor, TEXT_COLORS } from '../utils/constants';

interface ToolbarProps {
  selectedAction: string;
  onActionChange: (action: string) => void;
  hideLoupeOption?: boolean;
  selectedTextColor?: string;
  lastUsedTextColor?: string;
  onTextColorChange?: (color: string) => void;
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
          data-toolbar="true"
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
  selectedTextColor,
  lastUsedTextColor,
  onTextColorChange,
}: ToolbarProps) => {
  // Convert color value to color key for display
  const getColorKey = (colorValue?: string): TextColor => {
    if (!colorValue) return 'white';
    const colorKey = Object.entries(TEXT_COLORS).find(
      ([, value]) => value === colorValue
    )?.[0] as TextColor;
    return colorKey || 'white';
  };

  // Get the effective color to display (focused sticker color or last used color)
  const effectiveTextColor =
    selectedTextColor || lastUsedTextColor || TEXT_COLORS.white;

  const handleColorChange = (color: TextColor) => {
    if (onTextColorChange) {
      onTextColorChange(TEXT_COLORS[color]);
    }
  };

  return (
    <ToggleGroup.Root
      className="flex gap-1 items-center space-x-1 text-sm"
      type="single"
      value={selectedAction}
      onValueChange={value => {
        onActionChange(value || '');
      }}
      data-toolbar="true"
    >
      <TooltipWrapper content="Rectangle (R)">
        <ToggleGroup.Item
          value="rectangle"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionRectangleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Circle (C)">
        <ToggleGroup.Item
          value="circle"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionCircleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Scribble (S)">
        <ToggleGroup.Item
          value="scribble"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionScribbleIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Cross (X)">
        <ToggleGroup.Item
          value="cross"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionCrossIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <span className="h-[16px] w-[1px] bg-white/50" />

      <TooltipWrapper content="Twin Check Sticker">
        <ToggleGroup.Item
          value="sticker-twin-check"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionTwinCheckIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Dot Sticker">
        <ToggleGroup.Item
          value="sticker-dot"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionDotIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <TooltipWrapper content="Text (T)">
        <ToggleGroup.Item
          value="text"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
          data-toolbar="true"
        >
          <ActionTextIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      <span className="h-[16px] w-[1px] bg-white/50" />

      {/* conditionally display elements in this div based on the selected action */}
      <div>
        {selectedAction === 'text' && onTextColorChange && (
          <Select.Root
            value={getColorKey(effectiveTextColor)}
            onValueChange={value => handleColorChange(value as TextColor)}
          >
            <Select.Trigger
              className="px-2 py-1 text-xs text-white rounded hover:bg-white/20 focus:outline-none flex items-center justify-between text-nowrap"
              data-toolbar="true"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded border border-white/30"
                  style={{
                    backgroundColor: effectiveTextColor,
                  }}
                />
                <span className="capitalize">
                  {getColorKey(effectiveTextColor)}
                </span>
              </div>
              <Select.Icon className="ml-1">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                className="bg-black border border-gray-600 rounded shadow-lg z-50"
                data-toolbar="true"
              >
                <Select.Viewport className="p-1" data-toolbar="true">
                  {Object.entries(TEXT_COLORS).map(
                    ([colorName, colorValue]) => (
                      <Select.Item
                        key={colorName}
                        value={colorName}
                        className="text-sm text-white px-3 py-1 rounded cursor-pointer hover:bg-white/20 focus:bg-white focus:text-black focus:outline-none flex items-center space-x-2"
                        data-toolbar="true"
                      >
                        <div
                          className="w-3 h-3 rounded border border-white/30"
                          style={{ backgroundColor: colorValue }}
                        />
                        <Select.ItemText className="capitalize">
                          {colorName}
                        </Select.ItemText>
                      </Select.Item>
                    )
                  )}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      </div>

      <TooltipWrapper content="Delete Frame(D)">
        <ToggleGroup.Item
          value="delete"
          className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-red-500 aria-checked:text-white aria-checked:hover:bg-red-500 rounded flex items-center"
          data-toolbar="true"
        >
          <TrashIcon className="h-4" />
        </ToggleGroup.Item>
      </TooltipWrapper>

      {!hideLoupeOption && (
        <TooltipWrapper content="Loupe (L)">
          <ToggleGroup.Item
            value="loupe"
            className="px-2 py-1 text-xs text-white hover:bg-white/20 focus:outline-none aria-checked:bg-white aria-checked:text-black aria-checked:hover:bg-white rounded flex items-center"
            data-toolbar="true"
          >
            <MagnifyingGlassIcon className="h-4" />
          </ToggleGroup.Item>
        </TooltipWrapper>
      )}
    </ToggleGroup.Root>
  );
};
