
import { categorizedProfanity } from './profanity';
import { Theme } from '../types';

export type Language = 'mr' | 'en' | 'hi';

export const translations = {
  mr: {
    appTitle: "कामना",
    appSubtitle: "The Forge of AI Desire",
    studio: "कार्यशाळा",
    museum: "दालन",
    login: "प्रवेश",
    githubSignIn: "GitHub द्वारे प्रवेश करा",
    ageRestriction: "१८+ वयोगटासाठी अनिवार्य",
    imagination: "कल्पनाशक्ती",
    tags: "टॅग्स",
    platforms: "मंच",
    modelConfig: "मॉडेल संरचना",
    provider: "सेवा प्रदाता",
    breatheLife: "प्राण फुंका",
    sculptor: "मुर्तिकार",
    placeholderPrompt: "तुमची शाई येथे सांडा...",
    placeholderTag: "टॅग जोडा...",
    edit: "संपादन",
    delete: "हटवा",
    save: "जतन करा",
    back: "परत जा",
    character: "पात्र",
    scenario: "प्रसंग",
    nsfwLabel: "प्रौढ सामग्री",
    biometric: "बायोमेट्रिक प्रमाणीकरण सक्षम",
    morphing: {
      desire: categorizedProfanity.mr.desire[Theme.DEFAULT],
      imagination: categorizedProfanity.mr.imagination[Theme.DEFAULT],
      studio: categorizedProfanity.mr.studio[Theme.DEFAULT],
      canvas: categorizedProfanity.mr.canvas[Theme.DEFAULT]
    }
  },
  en: {
    appTitle: "Kamana",
    appSubtitle: "The Forge of AI Desire",
    studio: "Studio",
    museum: "Gallery",
    login: "Login",
    githubSignIn: "Sign in with GitHub",
    ageRestriction: "18+ Adults Only",
    imagination: "Imagination",
    tags: "Attributes",
    platforms: "Platforms",
    modelConfig: "Model Config",
    provider: "AI Provider",
    breatheLife: "Breathe Life",
    sculptor: "Sculptor",
    placeholderPrompt: "Pour your ink here...",
    placeholderTag: "Add attribute...",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    back: "Go Back",
    character: "Character",
    scenario: "Scenario",
    nsfwLabel: "NSFW Content",
    biometric: "Biometric Auth Enabled",
    morphing: {
      desire: categorizedProfanity.en.desire[Theme.DEFAULT],
      imagination: categorizedProfanity.en.imagination[Theme.DEFAULT],
      studio: categorizedProfanity.en.studio[Theme.DEFAULT],
      canvas: categorizedProfanity.en.canvas[Theme.DEFAULT]
    }
  },
  hi: {
    appTitle: "कामना",
    appSubtitle: "The Forge of AI Desire",
    studio: "स्टूडियो",
    museum: "संग्रहालय",
    login: "लॉगिन",
    githubSignIn: "GitHub से जुड़ें",
    ageRestriction: "18+ वयस्कों के लिए",
    imagination: "कल्पना",
    tags: "विशेषताएं",
    platforms: "मंच",
    modelConfig: "मॉडल विन्यास",
    provider: "सेवा प्रदाता",
    breatheLife: "प्राण फूँकें",
    sculptor: "मूर्तिकार",
    placeholderPrompt: "अपनी स्याही यहाँ उंडेलें...",
    placeholderTag: "विशेषता जोड़ें...",
    edit: "संपादन",
    delete: "मिटाएं",
    save: "सहेजें",
    back: "पीछे जाएं",
    character: "पात्र",
    scenario: "दृश्य",
    nsfwLabel: "NSFW सामग्री",
    biometric: "बायोमेट्रिक प्रमाणीकरण सक्षम",
    morphing: {
      desire: categorizedProfanity.hi.desire[Theme.DEFAULT],
      imagination: categorizedProfanity.hi.imagination[Theme.DEFAULT],
      studio: categorizedProfanity.hi.studio[Theme.DEFAULT],
      canvas: categorizedProfanity.hi.canvas[Theme.DEFAULT]
    }
  }
};
