import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  syncOutlook: boolean;
  setSyncOutlook: (sync: boolean) => void;
  syncGoogle: boolean;
  setSyncGoogle: (sync: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [syncOutlook, setSyncOutlook] = useState(false);
  const [syncGoogle, setSyncGoogle] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('geminiApiKey', geminiApiKey);
    }
  }, [geminiApiKey]);

  return (
    <SettingsContext.Provider value={{
      selectedModel,
      setSelectedModel,
      syncOutlook,
      setSyncOutlook,
      syncGoogle,
      setSyncGoogle,
      geminiApiKey,
      setGeminiApiKey,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};