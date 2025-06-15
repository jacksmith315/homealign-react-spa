import React from 'react';
import { Download, Trash2 } from 'lucide-react';

const BulkActionToolbar = ({ selectedItems, onBulkDelete, onExport, entityName }) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
      <span className="text-sm text-blue-800">
        {selectedItems.length} {entityName}(s) selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
        >
          <Download size={14} className="mr-1" />
          Export
        </button>
        <button
          onClick={() => onBulkDelete(selectedItems)}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
        >
          <Trash2 size={14} className="mr-1" />
          Delete Selected
        </button>
      </div>
    </div>
  );
};

export default BulkActionToolbar;
