import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
  const {
    selectedModel,
    setSelectedModel,
    syncOutlook,
    setSyncOutlook,
    syncGoogle,
    setSyncGoogle,
    geminiApiKey,
    setGeminiApiKey
  } = useSettings();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showModelWarning, setShowModelWarning] = useState(false);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    if (newModel === 'gemini-2.0-flash') {
      setShowModelWarning(true);
    } else {
      setShowModelWarning(false);
    }
    setSelectedModel(newModel);
  };

  return (
    <div className="space-y-6">
      {/* Model Selection and API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">Gemini Model</label>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="API Key Settings"
          >
            ⚙️
          </button>
        </div>
        
        {showApiKey && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm"
              />
              {geminiApiKey && (
                <button
                  onClick={() => setGeminiApiKey('')}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear API Key"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Get your API key from the{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <select
            value={selectedModel}
            onChange={handleModelChange}
            className="w-full p-2 rounded-lg border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
          </select>
          {showModelWarning && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ Note: Gemini Pro is for text analysis only. For PDF processing, use Gemini Pro Vision.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Select 'Gemini Pro Vision' for PDF processing. Text analysis will automatically use Gemini Pro.
          </p>
        </div>
      </div>

      {/* Calendar Sync Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/outlook-icon.svg" alt="Outlook" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Sync to Calendar (Outlook)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={syncOutlook}
              onChange={(e) => setSyncOutlook(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Sync to Calendar (Google)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={syncGoogle}
              onChange={(e) => setSyncGoogle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;