import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, formatPhoneNumber, getStatusBadgeClass, downloadFile } from '../../utils/helpers';
import { 
  Search, Plus, Edit2, Trash2, RotateCcw, Mail, Phone, MapPin, Award, 
  Building, Users, Stethoscope
} from 'lucide-react';

const ProviderManagement = () => {
  const auth = useAuth();
  const apiService = new ApiService(auth);
  
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});

  const filterOptions = [
    {
      key: 'provider_type',
      label: 'Provider Type',
      type: 'select',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'organization', label: 'Organization' },
        { value: 'facility', label: 'Facility' },
      ]
    },
    {
      key: 'specialty',
      label: 'Specialty',
      type: 'select',
      options: [
        { value: 'primary_care', label: 'Primary Care' },
        { value: 'cardiology', label: 'Cardiology' },
        { value: 'orthopedics', label: 'Orthopedics' },
        { value: 'neurology', label: 'Neurology' },
        { value: 'oncology', label: 'Oncology' },
        { value: 'pediatrics', label: 'Pediatrics' },
        { value: 'psychiatry', label: 'Psychiatry' },
        { value: 'surgery', label: 'Surgery' },
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
      ]
    },
    {
      key: 'network_status',
      label: 'Network Status',
      type: 'select',
      options: [
        { value: 'in_network', label: 'In Network' },
        { value: 'out_of_network', label: 'Out of Network' },
        { value: 'pending', label: 'Pending' },
      ]
    }
  ];

  const fetchProviders = useCallback(async (page = 1, search = '', filterParams = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, search, ...filterParams };
      const data = await apiService.getProviders(params);
      setProviders(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err) {
      setError('Failed to fetch providers: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    fetchProviders(currentPage, searchTerm, filters);
  }, [currentPage, auth.selectedDb, fetchProviders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProviders(1, searchTerm, filters);
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} providers?`)) return;
    
    try {
      await apiService.bulkDelete('providers', ids);
      setSelectedItems([]);
      fetchProviders(currentPage, searchTerm, filters);
    } catch (err) {
      setError('Failed to delete providers: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.exportData('providers', { search: searchTerm, ...filters });
      downloadFile(response, 'providers.csv');
    } catch (err) {
      setError('Failed to export providers: ' + err.message);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === providers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(providers.map(provider => provider.id));
    }
  };

  const ProviderModal = ({ provider, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      provider || {
        name: '',
        provider_type: 'individual',
        first_name: '',
        last_name: '',
        title: '',
        specialty: '',
        subspecialty: '',
        npi_number: '',
        license_number: '',
        license_state: '',
        dea_number: '',
        tax_id: '',
        phone: '',
        fax: '',
        email: '',
        practice_name: '',
        practice_address: '',
        practice_city: '',
        practice_state: '',
        practice_zip: '',
        billing_address: '',
        billing_city: '',
        billing_state: '',
        billing_zip: '',
        status: 'active',
        network_status: 'in_network',
        contract_start_date: '',
        contract_end_date: '',
        notes: '',
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        if (provider) {
          await apiService.updateItem('providers', provider.id, formData);
        } else {
          await apiService.createItem('providers', formData);
        }
        onSave();
        onClose();
      } catch (err) {
        setError('Failed to save provider: ' + err.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {provider ? 'Edit Provider' : 'Create Provider'}
          </h3>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.provider_type}
                  onChange={(e) => setFormData({...formData, provider_type: e.target.value})}
                  className="form-input"
                >
                  <option value="individual">Individual Provider</option>
                  <option value="organization">Organization</option>
                  <option value="facility">Facility</option>
                </select>
                <input
                  type="text"
                  placeholder="Provider/Organization Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              {formData.provider_type === 'individual' && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Title (MD, DO, NP, etc.)"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            {/* Specialty & Credentials */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Specialty & Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select Specialty</option>
                  <option value="primary_care">Primary Care</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="neurology">Neurology</option>
                  <option value="oncology">Oncology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="surgery">Surgery</option>
                </select>
                <input
                  type="text"
                  placeholder="Subspecialty"
                  value={formData.subspecialty}
                  onChange={(e) => setFormData({...formData, subspecialty: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="NPI Number"
                  value={formData.npi_number}
                  onChange={(e) => setFormData({...formData, npi_number: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="License State"
                  value={formData.license_state}
                  onChange={(e) => setFormData({...formData, license_state: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="DEA Number"
                  value={formData.dea_number}
                  onChange={(e) => setFormData({...formData, dea_number: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Tax ID"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({...formData, fax: e.target.value})}
                  className="form-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Practice Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Practice Information</h4>
              <input
                type="text"
                placeholder="Practice Name"
                value={formData.practice_name}
                onChange={(e) => setFormData({...formData, practice_name: e.target.value})}
                className="form-input w-full mb-4"
              />

              <textarea
                placeholder="Practice Address"
                value={formData.practice_address}
                onChange={(e) => setFormData({...formData, practice_address: e.target.value})}
                className="form-input w-full mb-4"
                rows="2"
              />

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.practice_city}
                  onChange={(e) => setFormData({...formData, practice_city: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.practice_state}
                  onChange={(e) => setFormData({...formData, practice_state: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.practice_zip}
                  onChange={(e) => setFormData({...formData, practice_zip: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Status & Contract */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Status & Contract</h4>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={formData.network_status}
                  onChange={(e) => setFormData({...formData, network_status: e.target.value})}
                  className="form-input"
                >
                  <option value="in_network">In Network</option>
                  <option value="out_of_network">Out of Network</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => setFormData({...formData, contract_start_date: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData({...formData, contract_end_date: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
              <textarea
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="form-input w-full"
                rows="3"
              />
            </div>
            
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
                className="btn-primary"
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
          <h2 className="text-2xl font-bold text-gray-900">Provider Management</h2>
          <p className="text-gray-600">Manage healthcare providers and networks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Provider
        </button>
      </div>

      <BulkActionToolbar
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        entityName="provider"
      />

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Providers
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, specialty, NPI..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary"
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
            onClick={() => fetchProviders(currentPage, searchTerm, filters)}
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === providers.length && providers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credentials
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
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : providers.length > 0 ? (
                providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(provider.id)}
                        onChange={() => toggleSelectItem(provider.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {provider.provider_type === 'individual' ? (
                            <Stethoscope className="h-10 w-10 text-blue-500 bg-blue-100 rounded-full p-2" />
                          ) : provider.provider_type === 'organization' ? (
                            <Building className="h-10 w-10 text-green-500 bg-green-100 rounded-full p-2" />
                          ) : (
                            <Users className="h-10 w-10 text-purple-500 bg-purple-100 rounded-full p-2" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {provider.name}
                          </div>
                          {provider.first_name && provider.last_name && (
                            <div className="text-sm text-gray-500">
                              {provider.first_name} {provider.last_name} {provider.title}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {provider.provider_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {provider.specialty?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </div>
                      {provider.subspecialty && (
                        <div className="text-sm text-gray-500">
                          {provider.subspecialty}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {provider.phone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {formatPhoneNumber(provider.phone)}
                          </div>
                        )}
                        {provider.email && (
                          <div className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {provider.email}
                          </div>
                        )}
                        {provider.practice_name && (
                          <div className="flex items-center">
                            <Building size={14} className="mr-1" />
                            {provider.practice_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {provider.npi_number && (
                          <div>NPI: {provider.npi_number}</div>
                        )}
                        {provider.license_number && (
                          <div>License: {provider.license_number}</div>
                        )}
                        {provider.license_state && (
                          <div>State: {provider.license_state}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`status-badge ${getStatusBadgeClass(provider.status)}`}>
                          {provider.status}
                        </span>
                        <div className="text-xs text-gray-500">
                          {provider.network_status?.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProvider(provider)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleBulkDelete([provider.id])}
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
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No providers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Modals */}
      {showCreateModal && (
        <ProviderModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchProviders(currentPage, searchTerm, filters);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingProvider && (
        <ProviderModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={() => {
            fetchProviders(currentPage, searchTerm, filters);
            setEditingProvider(null);
          }}
        />
      )}
    </div>
  );
};

export default ProviderManagement;
