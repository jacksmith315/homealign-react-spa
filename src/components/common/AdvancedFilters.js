import React, { useState } from 'react';
import { Filter } from 'lucide-react';

const AdvancedFilters = ({ filters, onFiltersChange, filterOptions, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center"
      >
        <Filter size={16} className="mr-2" />
        Advanced Filters
        {Object.keys(filters).length > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-10 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter Options</h3>
            <button
              onClick={onReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset All
            </button>
          </div>
          
          <div className="space-y-3">
            {filterOptions.map((option) => (
              <div key={option.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {option.label}
                </label>
                {option.type === 'select' ? (
                  <select
                    value={filters[option.key] || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      [option.key]: e.target.value || undefined
                    })}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {option.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={option.type}
                    value={filters[option.key] || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      [option.key]: e.target.value || undefined
                    })}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={option.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
