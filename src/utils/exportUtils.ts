import JSZip from 'jszip';
import { CharacterData } from '../types';

/**
 * Creates a structured directory for a single character inside a JSZip instance.
 * Ensures initial, intermediate, and visual generation data is completely preserved.
 */
export async function addCharacterToZip(zip: JSZip, char: CharacterData) {
  const folderName = char.name.replace(/[^a-z0-9]/gi, '_') || 'Unnamed_Character';
  const folder = zip.folder(folderName);
  if (!folder) return;

  // 1. Prompts & Seed Markdown (The Evolution of the Character)
  let promptsMd = `# Generation Seeds: ${char.name}\n\n`;
  promptsMd += `## Original User Vision (Initial Prompt)\n${char.originalPrompt || 'N/A'}\n\n`;
  promptsMd += `## Current Active Refinement (Modified Prompt)\n${char.modifiedPrompt || 'N/A'}\n\n`;
  
  promptsMd += `## Visual Asset Artifacts\n`;
  promptsMd += `- **Portrait Generation Prompt**: ${char.characterImagePrompt || 'N/A'}\n`;
  promptsMd += `- **Scenario/Background Prompt**: ${char.scenarioImagePrompt || 'N/A'}\n\n`;

  if (char.promptHistory && char.promptHistory.length > 0) {
    promptsMd += `## Intermediate Prompt States (Evolution History)\n\n`;
    char.promptHistory.forEach((h, i) => {
      promptsMd += `### Milestone ${i + 1} (${new Date(h.timestamp).toLocaleString()})\n${h.text}\n\n`;
    });
  }
  folder.file('evolution_seeds.md', promptsMd);

  // 2. Manifest & Platform Content (The Resulting Data)
  let contentMd = `# Manifest: ${char.name}\n\n`;
  
  contentMd += `## Archetype Configuration\n`;
  contentMd += `- **Status**: ${char.status.toUpperCase()}\n`;
  contentMd += `- **Version**: ${char.version}\n`;
  contentMd += `- **NSFW Mode**: ${char.isNSFW ? 'Active' : 'Disabled'}\n`;
  contentMd += `- **Attributes/Tags**: ${char.tags.join(', ') || 'None'}\n`;
  contentMd += `- **Web Intelligence**: ${char.isWebResearchEnabled ? 'Enabled' : 'Disabled'}\n`;
  contentMd += `- **Target Platforms**: ${char.platforms?.join(', ') || 'None'}\n`;
  contentMd += `- **Intelligence Model**: ${char.textModelId || 'Default'}\n`;
  contentMd += `- **Visual Model**: ${char.imageModelId || 'Default'}\n\n`;

  contentMd += `## Roleplay Attributes (Neural Fields)\n\n`;
  char.fields.forEach(f => {
    contentMd += `### ${f.label} ${f.isLocked ? '🔒' : ''}\n${f.value}\n\n`;
  });

  if (char.worldInfo && char.worldInfo.length > 0) {
    contentMd += `## AIDungeon World Lore Cards\n\n`;
    char.worldInfo.forEach(card => {
      contentMd += `### ${card.label}\n${card.content}\n\n`;
    });
  }

  if (char.systemRules) {
    contentMd += `## Behavior Logic & System Constraints\n\`\`\`\n${char.systemRules}\n\`\`\`\n\n`;
  }

  if (char.groundingChunks && char.groundingChunks.length > 0) {
    contentMd += `## Grounded Web Intel\n\n`;
    char.groundingChunks.forEach(chunk => {
      if (chunk.web) {
        contentMd += `- [${chunk.web.title}](${chunk.web.uri})\n`;
      }
    });
    contentMd += `\n`;
  }

  folder.file('manifest.md', contentMd);

  // 3. Metadata JSON (Master source for high-fidelity re-import)
  folder.file('metadata.json', JSON.stringify(char, null, 2));

  // 4. Binary Visual Assets (Exporting actual images)
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
      console.warn(`Failed to package asset ${filename}:`, e);
    }
  };

  await processImage(char.characterImageUrl, 'character_portrait.png');
  await processImage(char.scenarioImageUrl, 'scenario_scene.png');
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
    
    for (const [path, zipFile] of Object.entries(zip.files)) {
      if (path.endsWith('metadata.json')) {
        const content = await (zipFile as any).async('string');
        try {
          const char = JSON.parse(content);
          if (char.name && char.fields) {
            // New instance creation on import
            delete char.id;
            characters.push(char);
          }
        } catch (e) {
          console.error(`Metadata corruption detected in ZIP at ${path}`);
        }
      }
    }
    return characters;
  }

  throw new Error("Invalid file lineage. Use .json or .zip manifest bundles.");
}