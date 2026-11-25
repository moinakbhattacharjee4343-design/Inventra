import React, { createContext, useContext, useEffect, useState } from "react";
import { LanguageCode } from "../types/inventory";
import { DICTIONARY, Dictionary } from "./i18n";

const STORAGE_KEY_LANG = "inventra_lang_v1";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: DICTIONARY.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === "en" || saved === "hi" || saved === "bn") return saved;
    } catch {
      // Ignore storage errors
    }
    return "en";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch {
      // Ignore
    }
  }, [language]);

  const value: LanguageContextValue = {
    language,
    setLanguage: setLanguageState,
    t: DICTIONARY[language] ?? DICTIONARY.en,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
