import React, { useState } from 'react';
import { X, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DoctorDispatchModal({ isOpen, onClose, patientId, patientName, riskLevel, onDispatch }) {
  const { theme } = useTheme();
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispatchedDoctors, setDispatchedDoctors] = useState([]);

  const doctors = [
    { id: 1, name: 'Dr. Rajesh Kumar', specialty: 'Critical Care', available: true },
    { id: 2, name: 'Dr. Priya Sharma', specialty: 'Cardiology', available: true },
    { id: 3, name: 'Dr. Arun Patel', specialty: 'Pulmonology', available: false },
    { id: 4, name: 'Dr. Neha Singh', specialty: 'Nephrology', available: true },
    { id: 5, name: 'Dr. Vikram Desai', specialty: 'General ICU', available: true },
  ];

  const handleDispatch = async () => {
    if (!selectedDoctor || !dispatchTime) {
      alert('Please select a doctor and estimated arrival time');
      return;
    }

    setLoading(true);
    try {
      const doctor = doctors.find(d => d.id === parseInt(selectedDoctor));
      const newDispatch = {
        doctorId: selectedDoctor,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        dispatchTime: new Date().toLocaleTimeString(),
        estimatedArrival: dispatchTime,
        status: 'Dispatched',
      };

      setDispatchedDoctors([...dispatchedDoctors, newDispatch]);
      
      // Call parent callback
      if (onDispatch) {
        onDispatch({
          patientId,
          doctor: doctor.name,
          specialty: doctor.specialty,
          time: new Date().toLocaleTimeString(),
        });
      }

      // Reset form
      setSelectedDoctor('');
      setDispatchTime('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const inputBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
  const riskColor = riskLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${bgColor} rounded-lg shadow-2xl max-w-2xl w-full mx-4 ${borderColor} border`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <UserPlus className="text-blue-500" size={24} />
            <div>
              <h2 className={`text-xl font-bold ${textColor}`}>Dispatch Doctor</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Patient: {patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Risk Level Badge */}
          <div className={`p-4 rounded-lg border ${riskColor}`}>
            <p className={`font-semibold ${riskLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              Risk Level: {riskLevel}
            </p>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className={`w-full p-3 rounded border ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Choose a doctor...</option>
              {doctors.map(doctor => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                  disabled={!doctor.available}
                >
                  {doctor.name} ({doctor.specialty}) {!doctor.available ? '- Unavailable' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Arrival Time */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Estimated Arrival (Minutes)</label>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-500" />
              <input
                type="number"
                value={dispatchTime}
                onChange={(e) => setDispatchTime(e.target.value)}
                placeholder="e.g., 5, 10, 15"
                min="1"
                max="60"
                className={`flex-1 p-3 rounded border ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Dispatched Doctors List */}
          {dispatchedDoctors.length > 0 && (
            <div className={`bg-green-500/10 border border-green-500 rounded-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                <CheckCircle size={18} /> Dispatched
              </h3>
              <div className="space-y-2">
                {dispatchedDoctors.map((dispatch, idx) => (
                  <div key={idx} className={`text-sm p-2 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`font-semibold ${textColor}`}>{dispatch.doctorName}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {dispatch.specialty} • ETA: {dispatch.estimatedArrival} min
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-6 border-t ${borderColor}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded border ${borderColor} ${textColor} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold`}
          >
            Close
          </button>
          <button
            onClick={handleDispatch}
            disabled={loading || !selectedDoctor || !dispatchTime}
            className={`flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold transition-colors flex items-center justify-center gap-2`}
          >
            {loading ? 'Dispatching...' : <><UserPlus size={18} /> Dispatch Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}
