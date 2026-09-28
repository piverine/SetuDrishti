import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const data = [
    { name: 'Mon', intercepted: 4, late: 1 },
    { name: 'Tue', intercepted: 3, late: 2 },
    { name: 'Wed', intercepted: 7, late: 0 },
    { name: 'Thu', intercepted: 5, late: 1 },
    { name: 'Fri', intercepted: 8, late: 0 },
  ];

  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-6">Hospital-Wide AI Impact</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0f1522] p-6 rounded-lg border border-purple-900/50 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Total Hours Saved</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black text-purple-400">142</p>
            <span className="text-xl text-purple-600 font-bold">hrs</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0f1522] p-6 rounded-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Intercepted Cases</p>
          <p className="text-5xl font-black text-cyan-400">27</p>
        </div>
        <div className="bg-white dark:bg-[#0f1522] p-6 rounded-lg border border-green-900/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mortality Reduction</p>
          <p className="text-5xl font-black text-green-400">31.4%</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#0f1522] p-8 rounded-lg border border-gray-200 dark:border-gray-800 flex-grow min-h-[400px]">
         <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">Early Sepsis Catch Rate (Trailing 5 Days)</h3>
         <div className="h-80 w-full mt-4">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#080c14', border: '1px solid #1f2937', color: '#fff' }} 
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="intercepted" name="AI Caught Early" stackId="a" fill="#22d3ee" radius={[0, 0, 4, 4]} />
                <Bar dataKey="late" name="Detected Normally" stackId="a" fill="#4b5563" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
