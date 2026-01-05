
// Import React to resolve namespace issues
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { ForgeManager } from '../services/forge/ForgeManager';
import { uploadImageToStorage } from '../services/supabaseStorageService';
import { AIProvider, CharacterData, CharacterField, Platform, PLATFORMS_CONFIG, TagMeta } from '../types';

export function useForgeGenerator(
  character: CharacterData, 
  setCharacter: React.Dispatch<React.SetStateAction<CharacterData>>,
  textModel: string,
  imageModel: string,
  selectedPlatforms: Platform[]
) {
  const { user } = useAuth();
  const { language, models: dbModels, tags: allTags, userSecrets } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generate = async (prompt: string) => {
    if (!prompt.trim()) {
      setErrors({ prompt: language === 'mr' ? "प्रॉम्प्ट आवश्यक आहे" : "Prompt is required" });
      return;
    }

    setIsGenerating(true);
    setErrors({});
    
    try {
      const txtModelData = dbModels.find(m => m.id === textModel);
      const txtProvider = txtModelData?.provider || AIProvider.GEMINI;
      const txtKey = userSecrets[txtProvider];
      const txtService = ForgeManager.getProvider(txtProvider, txtKey);

      const imgModelData = dbModels.find(m => m.id === imageModel);
      const imgProvider = imgModelData?.provider || AIProvider.GEMINI;
      const imgKey = userSecrets[imgProvider];
      const imgService = ForgeManager.getProvider(imgProvider, imgKey);

      const selectedTagMetas = allTags.filter(t => character.tags.includes(t.name));
      const isImageGenEnabled = imageModel !== 'None' && imageModel !== '';

      let currentData = { ...character, originalPrompt: prompt };

      setStepIndex(1);
      setGenerationStep(language === 'mr' ? "प्रॉम्प्ट परिष्कृत करत आहे..." : "Refining vision...");
      // refinePrompt now formally accepts useWebResearch and can return grounding data
      const modifiedResult = await txtService.refinePrompt({ 
        prompt, 
        tags: selectedTagMetas, 
        isNSFW: character.isNSFW,
        modelId: textModel,
        useWebResearch: character.isWebResearchEnabled
      });
      
      if (typeof modifiedResult === 'object' && modifiedResult.text) {
        currentData.modifiedPrompt = modifiedResult.text;
        currentData.groundingChunks = modifiedResult.groundingChunks || [];
      } else {
        currentData.modifiedPrompt = modifiedResult;
      }

      await sleep(1000);

      setStepIndex(2);
      setGenerationStep(language === 'mr' ? "सामग्री तयार होत आहे..." : "Forging content...");
      const platformRequirements = selectedPlatforms.map(p => ({ platform: p, fields: PLATFORMS_CONFIG[p].fields }));
      const textResultRaw = await txtService.generatePlatformContent({
        modifiedPrompt: currentData.modifiedPrompt,
        platforms: selectedPlatforms,
        platformRequirements,
        existingFields: character.fields,
        isNSFW: character.isNSFW,
        tags: selectedTagMetas,
        modelId: textModel,
        useWebResearch: character.isWebResearchEnabled
      });

      const textResult = (textResultRaw as any).data || textResultRaw;
      if ((textResultRaw as any).groundingChunks) {
        currentData.groundingChunks = [...(currentData.groundingChunks || []), ...(textResultRaw as any).groundingChunks];
      }
      
      const updatedFields: CharacterField[] = [];
      const requiredLabels = new Set<string>();
      selectedPlatforms.forEach(p => PLATFORMS_CONFIG[p].fields.forEach(f => requiredLabels.add(f)));
      requiredLabels.forEach(label => {
        const existing = character.fields.find(f => f.label === label);
        if (existing && existing.isLocked) {
          updatedFields.push(existing);
        } else {
          const gen = textResult.fields?.find((f: any) => f.label === label);
          updatedFields.push({
            id: existing?.id || Math.random().toString(36).substring(2, 9),
            label,
            value: gen?.value || existing?.value || '',
            isLocked: false,
            format: existing?.format || 'markdown'
          });
        }
      });
      currentData.name = textResult.name || currentData.name;
      currentData.fields = updatedFields;
      await sleep(1000);

      setStepIndex(3);
      setGenerationStep(language === 'mr' ? "पोर्ट्रेट प्रॉम्प्ट तयार करत आहे..." : "Scripting portrait...");
      if (!character.isCharacterImageLocked && isImageGenEnabled) {
        currentData.characterImagePrompt = await txtService.generateImagePrompt({ prompt, type: 'character', isNSFW: character.isNSFW, modelId: textModel });
      }

      setStepIndex(4);
      setGenerationStep(language === 'mr' ? "पोर्ट्रेट चित्र काढत आहे..." : "Painting portrait...");
      if (!character.isCharacterImageLocked && isImageGenEnabled && currentData.characterImagePrompt) {
        const charImg = await imgService.generateImage({ prompt: currentData.characterImagePrompt, isNSFW: character.isNSFW, modelId: imageModel });
        if (charImg) {
          const cloudUrl = user ? await uploadImageToStorage(user.id, charImg, 'portrait') : null;
          currentData.characterImageUrl = cloudUrl || charImg;
        }
      }

      setStepIndex(6);
      setGenerationStep(language === 'mr' ? "प्रसंग चित्र काढत आहे..." : "Rendering scene...");
      if (!character.isScenarioImageLocked && isImageGenEnabled) {
         currentData.scenarioImagePrompt = await txtService.generateImagePrompt({ prompt, type: 'scenario', isNSFW: character.isNSFW, modelId: textModel });
         const scenImg = await imgService.generateImage({ prompt: currentData.scenarioImagePrompt, isNSFW: character.isNSFW, modelId: imageModel });
         if (scenImg) {
           const cloudUrl = user ? await uploadImageToStorage(user.id, scenImg, 'scenario') : null;
           currentData.scenarioImageUrl = cloudUrl || scenImg;
         }
      }

      setStepIndex(8);
      setGenerationStep(language === 'mr' ? "नियमावली तयार करत आहे..." : "Defining logic rules...");
      currentData.systemRules = await txtService.generateSystemRules({ 
        prompt, 
        tags: selectedTagMetas, 
        content: updatedFields.map(f => f.value).join(' '), 
        isNSFW: character.isNSFW,
        modelId: textModel 
      });

      setCharacter({ ...currentData, status: 'draft' });
    } catch (e) {
      console.error("Forge failed:", e);
      setErrors({ general: "Forge failed." });
    } finally {
      setIsGenerating(false);
      setStepIndex(0);
    }
  };

  return { generate, isGenerating, generationStep, stepIndex, errors };
}
