
import { profanityDictionary } from './profanity';

export type Language = 'mr' | 'en';

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
      desire: profanityDictionary.mr.desire,
      imagination: profanityDictionary.mr.imagination,
      studio: profanityDictionary.mr.studio,
      canvas: [
        "कॅनव्हास तुमच्या इच्छेची वाट पाहत आहे...", 
        "तुमची वासना येथे मांडून पहा...", 
        "शृंगाराची सुरुवात करा...", 
        "नव्या मादक जगाचा उगम...", 
        "तुमच्या नग्न कल्पनेला आकार द्या...", 
        "तुमच्या घाणेरड्या स्वप्नांना जिवंत करा...",
        "तुमच्या विकृत वासनांना मोकळी वाट करून द्या...",
        "तुमच्या नग्नावस्थेला शब्दांत मांडा..."
      ]
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
      desire: profanityDictionary.en.desire,
      imagination: profanityDictionary.en.imagination,
      studio: profanityDictionary.en.studio,
      canvas: [
        "The canvas awaits your crave...", 
        "Map your lust here...", 
        "Begin the erotic ritual...", 
        "Birth of a new obsession...", 
        "Give shape to your filthiest thoughts...", 
        "Unleash your most depraved fantasies...",
        "Surrender to your darkest kinks...",
        "Let the degradation begin..."
      ]
    }
  }
};
