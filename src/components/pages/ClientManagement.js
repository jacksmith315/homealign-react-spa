import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { Plus, Search, RotateCcw, Mail, Phone, Edit2, Trash2 } from 'lucide-react';

const ClientManagement = () => {
    const auth = useAuth();
    const apiService = useMemo(() => new ApiService(auth), [auth]);
    
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [filters, setFilters] = useState({});
  
    const filterOptions = [
      {
        key: 'client_type',
        label: 'Client Type',
        type: 'select',
        options: [
          { value: 'hospital', label: 'Hospital' },
          { value: 'clinic', label: 'Clinic' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'corporate', label: 'Corporate' },
        ]
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
        ]
      },
      {
        key: 'created_after',
        label: 'Created After',
        type: 'date',
        placeholder: 'Select date'
      }
    ];
  
    const fetchClients = useCallback(async (page = 1, search = '', filterParams = {}) => {
      setLoading(true);
      setError('');
      
      try {
        const params = { page, search, ...filterParams };
        const data = await apiService.getClients(params);
        setClients(data.results || []);
        setTotalPages(Math.ceil(data.count / 10));
      } catch (err) {
        setError('Failed to fetch clients: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, [apiService]);
  
    useEffect(() => {
      fetchClients(currentPage, searchTerm, filters);
    }, [currentPage, auth.selectedDb, fetchClients, searchTerm, filters]);
  
    const handleSearch = (e) => {
      e.preventDefault();
      setCurrentPage(1);
      fetchClients(1, searchTerm, filters);
    };
  
    const handleBulkDelete = async (ids) => {
      if (!window.confirm(`Are you sure you want to delete ${ids.length} clients?`)) return;
      
      try {
        await apiService.bulkDelete('clients', ids);
        setSelectedItems([]);
        fetchClients(currentPage, searchTerm, filters);
      } catch (err) {
        setError('Failed to delete clients: ' + err.message);
      }
    };
  
    const handleExport = async () => {
      try {
        const response = await apiService.exportData('clients', { search: searchTerm, ...filters });
        // Handle export response (create download link)
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clients.csv';
        a.click();
      } catch (err) {
        setError('Failed to export clients: ' + err.message);
      }
    };
  
    const toggleSelectItem = (id) => {
      setSelectedItems(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    };
  
    const toggleSelectAll = () => {
      if (selectedItems.length === clients.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(clients.map(client => client.id));
      }
    };
  
    const ClientModal = ({ client, onClose, onSave }) => {
      const [formData, setFormData] = useState(
        client || {
          name: '',
          client_type: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          status: 'active',
          notes: '',
        }
      );
      const [saving, setSaving] = useState(false);
  
      const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
          if (client) {
            await apiService.updateItem('clients', client.id, formData);
          } else {
            await apiService.createItem('clients', formData);
          }
          onSave();
          onClose();
        } catch (err) {
          setError('Failed to save client: ' + err.message);
        } finally {
          setSaving(false);
        }
      };
  
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {client ? 'Edit Client' : 'Create Client'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={formData.client_type}
                  onChange={(e) => setFormData({...formData, client_type: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="insurance">Insurance</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
  
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
  
              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
  
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
  
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
  
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
  
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
            <p className="text-gray-600">Manage healthcare clients and organizations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} className="mr-2" />
            Add Client
          </button>
        </div>
  
        <BulkActionToolbar
          selectedItems={selectedItems}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          entityName="client"
        />
  
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Clients
              </label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  placeholder="Search by name, contact person..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
              onReset={() => setFilters({})}
            />
            <button
              onClick={() => fetchClients(currentPage, searchTerm, filters)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
  
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
  
        {loading && <LoadingSpinner />}
  
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === clients.length && clients.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(client.id)}
                          onChange={() => toggleSelectItem(client.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.contact_person}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {client.client_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {client.email && (
                            <div className="flex items-center">
                              <Mail size={14} className="mr-1" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center">
                              <Phone size={14} className="mr-1" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.status === 'active' ? 'bg-green-100 text-green-800' :
                          client.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingClient(client)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleBulkDelete([client.id])}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
  
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
  
        {showCreateModal && (
          <ClientModal
            onClose={() => setShowCreateModal(false)}
            onSave={() => {
              fetchClients(currentPage, searchTerm, filters);
              setShowCreateModal(false);
            }}
          />
        )}
  
        {editingClient && (
          <ClientModal
            client={editingClient}
            onClose={() => setEditingClient(null)}
            onSave={() => {
              fetchClients(currentPage, searchTerm, filters);
              setEditingClient(null);
            }}
          />
        )}
      </div>
    );
  };

export default ClientManagement;