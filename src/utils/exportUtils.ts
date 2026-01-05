import JSZip from 'jszip';
import { CharacterData } from '../types';

/**
 * Creates a structured directory for a single character inside a JSZip instance.
 */
export async function addCharacterToZip(zip: JSZip, char: CharacterData) {
  const folderName = char.name.replace(/[^a-z0-9]/gi, '_') || 'Unnamed_Character';
  const folder = zip.folder(folderName);
  if (!folder) return;

  // 1. Prompts Markdown
  let promptsMd = `# Prompts for ${char.name}\n\n`;
  promptsMd += `## Original Prompt\n${char.originalPrompt}\n\n`;
  promptsMd += `## Refined Seed\n${char.modifiedPrompt || 'N/A'}\n\n`;
  if (char.promptHistory && char.promptHistory.length > 0) {
    promptsMd += `## Prompt History\n\n`;
    char.promptHistory.forEach((h, i) => {
      promptsMd += `### Revision ${i + 1} (${new Date(h.timestamp).toLocaleString()})\n${h.text}\n\n`;
    });
  }
  folder.file('prompts.md', promptsMd);

  // 2. Content Markdown
  let contentMd = `# ${char.name} - Generated Content\n\n`;
  char.fields.forEach(f => {
    contentMd += `## ${f.label}\n${f.value}\n\n`;
  });
  if (char.systemRules) {
    contentMd += `## System Rules\n\`\`\`\n${char.systemRules}\n\`\`\`\n\n`;
  }
  folder.file('content.md', contentMd);

  // 3. Metadata JSON
  folder.file('metadata.json', JSON.stringify(char, null, 2));

  // 4. Images
  const processImage = async (url: string, filename: string) => {
    if (!url) return;
    try {
      if (url.startsWith('data:image')) {
        const base64Data = url.split(',')[1];
        folder.file(filename, base64Data, { base64: true });
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        folder.file(filename, blob);
      }
    } catch (e) {
      console.warn(`Failed to include image ${filename}:`, e);
    }
  };

  await processImage(char.characterImageUrl, 'portrait.png');
  await processImage(char.scenarioImageUrl, 'scenario.png');
}

/**
 * Generates and triggers download of a ZIP file containing multiple characters.
 */
export async function downloadCharactersZip(characters: CharacterData[], filename: string) {
  const zip = new JSZip();
  const tasks = characters.map(c => addCharacterToZip(zip, c));
  await Promise.all(tasks);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses an imported ZIP or JSON file to extract character data.
 */
export async function parseImportFile(file: File): Promise<CharacterData[]> {
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  }

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const characters: CharacterData[] = [];
    
    // Look for all metadata.json files in subfolders
    for (const [path, zipFile] of Object.entries(zip.files)) {
      if (path.endsWith('metadata.json')) {
        // Fix: zipFile is inferred as unknown; casting to any to access .async()
        const content = await (zipFile as any).async('string');
        try {
          const char = JSON.parse(content);
          // Ensure it has at least the minimum required fields
          if (char.name && char.fields) {
            // Scrub IDs for fresh import to prevent collisions
            delete char.id;
            characters.push(char);
          }
        } catch (e) {
          console.error(`Failed to parse metadata in ZIP at ${path}`);
        }
      }
    }
    return characters;
  }

  throw new Error("Unsupported file format. Please use .json or .zip bundles.");
}