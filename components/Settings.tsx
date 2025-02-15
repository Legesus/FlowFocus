import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
  const {
    selectedModel,
    setSelectedModel,
    syncOutlook,
    setSyncOutlook,
    syncGoogle,
    setSyncGoogle
  } = useSettings();

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Selected Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-2 rounded-lg border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
        >
          <option value="gemini-1.0-pro-latest">Gemini Pro</option>
          <option value="gemini-1.0-pro">Gemini Pro Legacy</option>
          <option value="gemini-pro-vision">Gemini Pro Vision</option>
        </select>
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