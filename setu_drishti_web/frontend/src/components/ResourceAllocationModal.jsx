import React, { useState } from 'react';
import { X, Home, Paperclip, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ResourceAllocationModal({ isOpen, onClose, patientId, patientName, riskLevel, onAllocate }) {
  const { theme } = useTheme();
  const [allocatedRoom, setAllocatedRoom] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);

  const availableRooms = [
    { id: 'ICU-01', name: 'ICU Room 01', type: 'Critical Care', status: 'Available' },
    { id: 'ICU-02', name: 'ICU Room 02', type: 'Critical Care', status: 'Occupied' },
    { id: 'ICU-03', name: 'ICU Room 03', type: 'Critical Care', status: 'Available' },
    { id: 'HDU-01', name: 'HDU Room 01', type: 'High Dependency', status: 'Available' },
    { id: 'ISO-01', name: 'Isolation Room 01', type: 'Isolation', status: 'Available' },
  ];

  const availableResources = [
    { id: 'vent', label: 'Ventilator', category: 'Breathing Support', critical: true },
    { id: 'ecmo', label: 'ECMO Machine', category: 'Circulatory Support', critical: false },
    { id: 'dialysis', label: 'Dialysis Unit', category: 'Renal Support', critical: false },
    { id: 'monitor', label: 'Continuous Monitor', category: 'Monitoring', critical: true },
    { id: 'bed', label: 'ICU Bed with Accessories', category: 'Infrastructure', critical: true },
    { id: 'pump', label: 'IV Pump', category: 'Drug Delivery', critical: true },
    { id: 'oxygen', label: 'Oxygen Supply (H-Cylinder)', category: 'Gas Supply', critical: true },
    { id: 'suction', label: 'Suction Unit', category: 'Airway Management', critical: true },
  ];

  const toggleResource = (resourceId) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(r => r !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleAllocate = async () => {
    if (!allocatedRoom || selectedResources.length === 0) {
      alert('Please select a room and at least one resource');
      return;
    }

    setLoading(true);
    try {
      const room = availableRooms.find(r => r.id === allocatedRoom);
      const resources = selectedResources.map(id =>
        availableResources.find(r => r.id === id)
      );

      const newAllocation = {
        allocatedTime: new Date().toLocaleTimeString(),
        room: room.name,
        roomType: room.type,
        resources: resources.map(r => r.label),
        status: 'Allocated',
      };

      setAllocations([...allocations, newAllocation]);

      // Call parent callback
      if (onAllocate) {
        onAllocate({
          patientId,
          room: room.name,
          resources: resources.map(r => r.label),
          time: new Date().toLocaleTimeString(),
        });
      }

      // Reset form
      setAllocatedRoom('');
      setSelectedResources([]);
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
  const checkboxBg = theme === 'dark' ? 'accent-blue-500' : 'accent-blue-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className={`${bgColor} rounded-lg shadow-2xl max-w-3xl w-full mx-4 my-8 ${borderColor} border`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <Home className="text-green-500" size={24} />
            <div>
              <h2 className={`text-xl font-bold ${textColor}`}>Allocate Resources</h2>
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
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Risk Level Badge */}
          <div className={`p-4 rounded-lg border ${riskColor}`}>
            <p className={`font-semibold ${riskLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              Risk Level: {riskLevel}
            </p>
          </div>

          {/* Room Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${textColor}`}>Select ICU Room</label>
            <div className="grid grid-cols-1 gap-2">
              {availableRooms.map(room => (
                <label
                  key={room.id}
                  className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${
                    allocatedRoom === room.id
                      ? `${theme === 'dark' ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-100 border-blue-500'}`
                      : `${borderColor} hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`
                  } ${room.status === 'Occupied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="room"
                    value={room.id}
                    checked={allocatedRoom === room.id}
                    onChange={(e) => setAllocatedRoom(e.target.value)}
                    disabled={room.status === 'Occupied'}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className={`font-semibold ${textColor}`}>{room.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {room.type} • {room.status}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Resource Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${textColor}`}>Select Resources</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableResources.map(resource => (
                <label
                  key={resource.id}
                  className={`flex items-start p-3 rounded border cursor-pointer transition-colors ${borderColor} hover:${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedResources.includes(resource.id)}
                    onChange={() => toggleResource(resource.id)}
                    className={`mt-0.5 mr-3 ${checkboxBg}`}
                  />
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${textColor}`}>{resource.label}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {resource.category} {resource.critical && <span className="text-red-500">• Critical</span>}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Allocation History */}
          {allocations.length > 0 && (
            <div className={`bg-green-500/10 border border-green-500 rounded-lg p-4`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                <CheckCircle size={18} /> Allocated Resources
              </h3>
              <div className="space-y-3">
                {allocations.map((alloc, idx) => (
                  <div key={idx} className={`text-sm p-3 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`font-semibold ${textColor}`}>{alloc.room}</p>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {alloc.roomType}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {alloc.resources.map((res, i) => (
                        <span
                          key={i}
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            theme === 'dark'
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
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
            onClick={handleAllocate}
            disabled={loading || !allocatedRoom || selectedResources.length === 0}
            className={`flex-1 px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold transition-colors flex items-center justify-center gap-2`}
          >
            {loading ? 'Allocating...' : <><Paperclip size={18} /> Allocate Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}
