import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

interface HighlightTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const HighlightTypeSelector = ({
  selectedType,
  onTypeChange,
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
        <ToggleGroup.Item
          value="rectangle"
          className="px-2 py-1 text-xs text-white focus:outline-none data-[state=on]:bg-white data-[state=on]:text-black rounded"
        >
          Rectangle
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="circle"
          className="px-2 py-1 text-xs text-white focus:outline-none data-[state=on]:bg-white data-[state=on]:text-black rounded"
        >
          Circle
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="scribble"
          className="px-2 py-1 text-xs text-white focus:outline-none data-[state=on]:bg-white data-[state=on]:text-black rounded"
        >
          Scribble
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="x"
          className="px-2 py-1 text-xs text-white focus:outline-none data-[state=on]:bg-white data-[state=on]:text-black rounded"
        >
          Cross
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );
};
