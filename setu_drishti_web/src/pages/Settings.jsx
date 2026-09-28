import React from 'react';

export default function Settings() {
  return (
    <div className="p-8 h-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-8">Alert Preferences</h2>
      
      <div className="bg-white dark:bg-[#0f1522] p-8 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl">
        <h3 className="text-cyan-400 font-bold mb-6 border-b border-gray-200 dark:border-gray-800 pb-3 uppercase tracking-widest text-sm">Twilio SMS Configuration</h3>
        
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Primary Duty Phone</label>
            <input 
              type="text" 
              defaultValue="+1 (555) 019-2834" 
              className="w-full max-w-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-3 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors" 
            />
            <p className="text-[10px] text-gray-500 mt-2 tracking-widest uppercase">This number will receive critical alerts via Twilio.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Alert Threshold Sensitivity</label>
            <select className="w-full max-w-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-3 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono">
              <option value="50">&gt; 50% Risk (Conservative)</option>
              <option value="75" selected>&gt; 75% Risk (Standard)</option>
              <option value="90">&gt; 90% Risk (Aggressive)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-800 mt-4">
             <input type="checkbox" id="mute" className="w-4 h-4 accent-cyan-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
             <label htmlFor="mute" className="text-sm text-gray-800 dark:text-gray-300 font-bold">Mute SMS alerts while actively signed into the web dashboard</label>
          </div>
          
          <div className="pt-6">
             <button className="bg-cyan-600 hover:bg-cyan-500 text-gray-900 dark:text-white font-bold py-3 px-8 rounded transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-[0_0_20px_rgba(8,145,178,0.6)]">
               Save Preferences
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
