# Contact Sheet App - Public Version Implementation Plan

## Project Overview

Transform the existing contact-sheet-claude prototype into a public web app where users can upload their own images and download professional contact sheets with authentic film aesthetics.

## Technical Approach

- **Client-side only**: No server uploads, images processed in browser memory
- **Simple workflow**: Select files → Preview contact sheet → Download image
- **Clean architecture**: Reusable components with clear separation of concerns

## Dependencies

- `html-to-image`: ^1.11.11 (for generating downloadable images)
- No server-side dependencies needed

## Component Architecture Refactoring

### Target Structure

```
App (root level)
├── File Upload Interface
├── ContactSheet (pure, reusable component)
│   ├── Props: images[], highlights?, xMarks?
│   └── NegativeStrip[] (auto-generated from images)
│       ├── SprocketHoles
│       ├── FilmText ("ILFORD HP5 PLUS")
│       ├── FrameNumbers
│       └── ImageFrames[]
├── HighlightOverlay (optional, for editing mode)
└── Download Button (html-to-image integration)
```

## Implementation Tasks

### Phase 1: Component Refactoring (Make it DRY and Reusable) ✅ COMPLETED

- [x] Extract ContactSheet as pure component accepting `images: string[]` prop
- [x] Remove hard-coded imageList from ContactSheetClaude component
- [x] Clean NegativeStrip to accept `images` and `startIndex` props only
- [x] Remove click handlers from NegativeStrip (make it presentational)
- [x] Extract shared constants (MEASUREMENTS, styling) to separate file
- [x] Create reusable SprocketHoles component
- [x] Make HighlightOverlay optional (for editing vs export modes)
- [x] Test refactored components with existing hard-coded data

### Phase 2: File Upload System ✅ COMPLETED

- [x] Create FileUpload component with drag-and-drop interface
- [x] Implement FileReader API to convert selected files to data URLs
- [x] Add image validation (format: jpg/jpeg/png, reasonable file sizes)
- [x] Create image preview grid for selected files
- [x] Add remove/reorder functionality for uploaded images
- [x] Implement loading states and error handling
- [x] Test with various image formats and sizes
- [x] Global drag-and-drop functionality
- [x] Simplified UI with minimal interface
- [x] Vertically centered contact sheet

### Phase 3: App Structure & State Management ✅ COMPLETED

- [x] Create main App component with upload → preview → download flow
- [x] Set up state management for uploaded images array
- [x] Integrate ContactSheet component with dynamic images
- [x] Add responsive design for mobile devices
- [x] Create clean UI with upload area, preview, and download sections
- [x] Add proper loading states throughout the flow

### Phase 4: Download Functionality ✅ COMPLETED

- [x] Install and configure html-to-image library
- [x] Create DownloadButton component
- [x] Implement contact sheet capture with `toPng` method
- [x] Add high-resolution export (pixelRatio: 2)
- [x] Configure element filtering (exclude UI buttons from export)
- [x] Add download progress indication
- [x] Test download functionality across different browsers and devices

## File Structure

### New Structure

```
src/app/contact-sheet/
├── page.tsx                 # Main upload & generate page
├── components/
│   ├── ContactSheet.tsx     # Pure contact sheet renderer
│   ├── NegativeStrip.tsx    # Individual film strip
│   ├── SprocketHoles.tsx    # Sprocket hole pattern
│   ├── HighlightOverlay.tsx # Optional highlighting system
│   ├── FileUpload.tsx       # Drag-and-drop upload interface
│   ├── ImagePreview.tsx     # Preview grid for uploaded images
│   └── DownloadButton.tsx   # html-to-image integration
├── utils/
│   ├── constants.ts         # MEASUREMENTS, styling constants
│   ├── imageUtils.ts        # File validation, processing
│   └── downloadUtils.ts     # html-to-image configuration
└── types/
    └── index.ts             # TypeScript interfaces
```

### Keep as Reference

```
src/app/contact-sheet-claude/  # Original prototype (for reference)
```

## Component Interfaces

### ContactSheet Component

```typescript
interface ContactSheetProps {
  images: string[]; // Array of image data URLs
  showHighlights?: boolean; // Optional editing mode
  selectedFrames?: Map<number, HighlightType>;
  xMarkedFrames?: Set<number>;
  className?: string;
}
```

### NegativeStrip Component

```typescript
interface NegativeStripProps {
  images: string[];
  startIndex: number;
  onFrameClick?: (frameNumber: number, event: React.MouseEvent) => void;
  stripRef?: React.RefObject<HTMLDivElement>;
}
```

## Technical Implementation Details

### File Upload Flow

1. User selects files via `<input type="file" multiple accept="image/*">`
2. FileReader converts files to data URLs
3. Images stored in React state as string array
4. ContactSheet component renders with dynamic images

### Download Flow

1. User clicks download button
2. html-to-image captures ContactSheet DOM element
3. Configure with `pixelRatio: 2` for high resolution
4. Filter out UI elements (buttons, upload interface)
5. Generate PNG and trigger browser download

### Image Processing

- Client-side validation (file type, size limits)
- Automatic resizing if images are too large
- Data URL conversion for immediate preview
- No server storage required

## Success Criteria

- [ ] Users can select 1-50 images from their device
- [ ] Contact sheet renders immediately with authentic film aesthetic
- [ ] High-quality PNG download works on desktop and mobile
- [ ] No images uploaded to server (privacy-first approach)
- [ ] Clean, intuitive user interface
- [ ] Error handling for unsupported files/formats
- [ ] Responsive design works on all screen sizes

## Risk Mitigation

- **Memory usage**: Implement image compression and size limits
- **Browser compatibility**: Test html-to-image across major browsers
- **Performance**: Lazy load strips for large image sets
- **User experience**: Clear instructions and error messages

**Estimated Timeline**: 2-3 weeks for MVP implementation

---

## Development Notes

- Start with Phase 1 refactoring to create solid foundation
- Test each phase thoroughly before moving to next
- Keep original prototype for reference and comparison
- Focus on simplicity and user experience
- Prioritize client-side privacy (no uploads)
