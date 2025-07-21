import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (folder === 'hp5') {
      // Handle hp5 folder specifically
      const hp5Dir = path.join(process.cwd(), 'public', 'hp5');

      if (!fs.existsSync(hp5Dir)) {
        return NextResponse.json([]);
      }

      const files = fs
        .readdirSync(hp5Dir)
        .filter(
          file =>
            file.toLowerCase().endsWith('.jpg') ||
            file.toLowerCase().endsWith('.jpeg')
        )
        .sort(); // Sort alphabetically for consistent ordering

      return NextResponse.json(files);
    }

    // Default behavior for rolls folder
    const rollsDir = path.join(process.cwd(), 'public', 'rolls');

    if (!fs.existsSync(rollsDir)) {
      return NextResponse.json([]);
    }

    const allImages: string[] = [];
    const folders = fs
      .readdirSync(rollsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    folders.forEach(folderName => {
      const folderPath = path.join(rollsDir, folderName);
      const files = fs
        .readdirSync(folderPath)
        .filter(
          file =>
            file.toLowerCase().endsWith('.jpg') ||
            file.toLowerCase().endsWith('.jpeg')
        );

      files.forEach(file => {
        allImages.push(`/rolls/${folderName}/${file}`);
      });
    });

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json([]);
  }
}
