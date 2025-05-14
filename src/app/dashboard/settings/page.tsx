"use client";

import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [appName, setAppName] = useState("Atlas-ERP");
  const [companyName, setCompanyName] = useState("KB Konsult & Partner AB");
  const [timezone, setTimezone] = useState("Europe/Stockholm");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">General Settings</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{isSaving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Europe/Stockholm">Europe/Stockholm</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                </select>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Theme Mode
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        defaultChecked
                        className="rounded-full"
                      />
                      <span>Light</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        className="rounded-full"
                      />
                      <span>Dark</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        className="rounded-full"
                      />
                      <span>System</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="color"
                        value="indigo"
                        defaultChecked
                        className="rounded-full"
                      />
                      <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                      <span>Indigo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="color"
                        value="blue"
                        className="rounded-full"
                      />
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                      <span>Blue</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="color"
                        value="green"
                        className="rounded-full"
                      />
                      <div className="w-4 h-4 rounded-full bg-green-600"></div>
                      <span>Green</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
