import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import FilmGallery from '../FilmGallery';

interface Roll {
  folderName: string;
  twin: string;
  lab: string;
  film: string;
  date: string;
  images: string[];
}

function parseRollFolderName(folderName: string) {
  // Parse folder name like: "twin:1017 lab:dubblelab film:gold-200 date:16-04-2024"
  const parts = folderName.split(' ');
  const parsed: Record<string, string> = {};

  parts.forEach(part => {
    const [key, value] = part.split(':');
    if (key && value) {
      parsed[key] = value;
    }
  });

  return {
    twin: parsed.twin || '',
    lab: parsed.lab || '',
    film: parsed.film || '',
    date: parsed.date || '',
  };
}

function getRolls(): Roll[] {
  const rollsDir = path.join(process.cwd(), 'public', 'rolls');

  if (!fs.existsSync(rollsDir)) {
    return [];
  }

  const folders = fs
    .readdirSync(rollsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const rolls: Roll[] = [];

  folders.forEach(folderName => {
    const folderPath = path.join(rollsDir, folderName);
    const files = fs
      .readdirSync(folderPath)
      .filter(
        file =>
          file.toLowerCase().endsWith('.jpg') ||
          file.toLowerCase().endsWith('.jpeg')
      )
      .sort();

    const parsedName = parseRollFolderName(folderName);

    rolls.push({
      folderName,
      ...parsedName,
      images: files,
    });
  });

  return rolls;
}

// Server component
export default function GalleryPage() {
  const rolls = getRolls();

  return (
    <div>
      <h1 className="pt-4 mb-4 ml-8">Film Rolls</h1>

      {rolls.length > 0 ? (
        <FilmGallery rolls={rolls} />
      ) : (
        <p>No rolls found in the public/rolls directory.</p>
      )}
    </div>
  );
}
