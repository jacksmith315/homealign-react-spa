import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, getStatusBadgeClass, downloadFile } from '../../utils/helpers';
import { 
  Search, Plus, Edit2, Trash2, RotateCcw, Settings, DollarSign,
  Clock, CheckCircle, AlertCircle, Tag, Users, Star
} from 'lucide-react';

const ServiceManagement = () => {
  const auth = useAuth();
  const apiService = new ApiService(auth);
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});

  const filterOptions = [
    {
      key: 'service_type',
      label: 'Service Type',
      type: 'select',
      options: [
        { value: 'medical', label: 'Medical' },
        { value: 'diagnostic', label: 'Diagnostic' },
        { value: 'therapeutic', label: 'Therapeutic' },
        { value: 'preventive', label: 'Preventive' },
        { value: 'emergency', label: 'Emergency' },
        { value: 'consultation', label: 'Consultation' },
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'primary_care', label: 'Primary Care' },
        { value: 'specialty_care', label: 'Specialty Care' },
        { value: 'urgent_care', label: 'Urgent Care' },
        { value: 'home_health', label: 'Home Health' },
        { value: 'telehealth', label: 'Telehealth' },
        { value: 'mental_health', label: 'Mental Health' },
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'discontinued', label: 'Discontinued' },
        { value: 'pending_approval', label: 'Pending Approval' },
      ]
    },
    {
      key: 'requires_authorization',
      label: 'Authorization Required',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]
    },
    {
      key: 'price_min',
      label: 'Minimum Price',
      type: 'number',
      placeholder: 'Min price'
    },
    {
      key: 'price_max',
      label: 'Maximum Price',
      type: 'number',
      placeholder: 'Max price'
    }
  ];

  const fetchServices = useCallback(async (page = 1, search = '', filterParams = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, search, ...filterParams };
      const data = await apiService.getServices(params);
      setServices(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err) {
      setError('Failed to fetch services: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    fetchServices(currentPage, searchTerm, filters);
  }, [currentPage, auth.selectedDb, fetchServices]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchServices(1, searchTerm, filters);
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} services?`)) return;
    
    try {
      await apiService.bulkDelete('services', ids);
      setSelectedItems([]);
      fetchServices(currentPage, searchTerm, filters);
    } catch (err) {
      setError('Failed to delete services: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.exportData('services', { search: searchTerm, ...filters });
      downloadFile(response, 'services.csv');
    } catch (err) {
      setError('Failed to export services: ' + err.message);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === services.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(services.map(service => service.id));
    }
  };

  const getServiceTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'medical':
        return <Settings className="h-5 w-5 text-blue-500" />;
      case 'diagnostic':
        return <Search className="h-5 w-5 text-purple-500" />;
      case 'therapeutic':
        return <Star className="h-5 w-5 text-green-500" />;
      case 'preventive':
        return <CheckCircle className="h-5 w-5 text-teal-500" />;
      case 'emergency':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'consultation':
        return <Users className="h-5 w-5 text-orange-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const ServiceModal = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      service || {
        name: '',
        description: '',
        service_type: 'medical',
        category: 'primary_care',
        service_code: '',
        cpt_code: '',
        hcpcs_code: '',
        price: '',
        duration_minutes: '',
        requires_authorization: false,
        requires_referral: false,
        telehealth_eligible: false,
        status: 'active',
        provider_instructions: '',
        patient_instructions: '',
        prerequisites: '',
        contraindications: '',
        billing_code: '',
        revenue_code: '',
        modifier_codes: '',
        unit_of_measure: 'visit',
        max_units_per_day: '',
        frequency_limit: '',
        age_restrictions: '',
        gender_restrictions: '',
        notes: '',
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        if (service) {
          await apiService.updateItem('services', service.id, formData);
        } else {
          await apiService.createItem('services', formData);
        }
        onSave();
        onClose();
      } catch (err) {
        setError('Failed to save service: ' + err.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {service ? 'Edit Service' : 'Create Service'}
          </h3>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Service Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Service Code"
                  value={formData.service_code}
                  onChange={(e) => setFormData({...formData, service_code: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                  className="form-input"
                >
                  <option value="medical">Medical</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="therapeutic">Therapeutic</option>
                  <option value="preventive">Preventive</option>
                  <option value="emergency">Emergency</option>
                  <option value="consultation">Consultation</option>
                </select>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="form-input"
                >
                  <option value="primary_care">Primary Care</option>
                  <option value="specialty_care">Specialty Care</option>
                  <option value="urgent_care">Urgent Care</option>
                  <option value="home_health">Home Health</option>
                  <option value="telehealth">Telehealth</option>
                  <option value="mental_health">Mental Health</option>
                </select>
              </div>

              <div className="mt-4">
                <textarea
                  placeholder="Service Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input w-full"
                  rows="3"
                />
              </div>
            </div>

            {/* Coding & Billing */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Coding & Billing</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="CPT Code"
                  value={formData.cpt_code}
                  onChange={(e) => setFormData({...formData, cpt_code: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="HCPCS Code"
                  value={formData.hcpcs_code}
                  onChange={(e) => setFormData({...formData, hcpcs_code: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Billing Code"
                  value={formData.billing_code}
                  onChange={(e) => setFormData({...formData, billing_code: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="number"
                  placeholder="Price ($)"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="form-input"
                  step="0.01"
                />
                <input
                  type="text"
                  placeholder="Revenue Code"
                  value={formData.revenue_code}
                  onChange={(e) => setFormData({...formData, revenue_code: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Modifier Codes"
                  value={formData.modifier_codes}
                  onChange={(e) => setFormData({...formData, modifier_codes: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Service Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({...formData, unit_of_measure: e.target.value})}
                  className="form-input"
                >
                  <option value="visit">Visit</option>
                  <option value="hour">Hour</option>
                  <option value="session">Session</option>
                  <option value="unit">Unit</option>
                  <option value="procedure">Procedure</option>
                </select>
                <input
                  type="number"
                  placeholder="Max Units/Day"
                  value={formData.max_units_per_day}
                  onChange={(e) => setFormData({...formData, max_units_per_day: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Frequency Limit (e.g., '1 per week')"
                  value={formData.frequency_limit}
                  onChange={(e) => setFormData({...formData, frequency_limit: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>
            </div>

            {/* Requirements & Restrictions */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Requirements & Restrictions</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requires_authorization"
                      checked={formData.requires_authorization}
                      onChange={(e) => setFormData({...formData, requires_authorization: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="requires_authorization" className="ml-2 text-sm text-gray-700">
                      Requires Authorization
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requires_referral"
                      checked={formData.requires_referral}
                      onChange={(e) => setFormData({...formData, requires_referral: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="requires_referral" className="ml-2 text-sm text-gray-700">
                      Requires Referral
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="telehealth_eligible"
                      checked={formData.telehealth_eligible}
                      onChange={(e) => setFormData({...formData, telehealth_eligible: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="telehealth_eligible" className="ml-2 text-sm text-gray-700">
                      Telehealth Eligible
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Age Restrictions (e.g., '18+')"
                    value={formData.age_restrictions}
                    onChange={(e) => setFormData({...formData, age_restrictions: e.target.value})}
                    className="form-input"
                  />
                  <select
                    value={formData.gender_restrictions}
                    onChange={(e) => setFormData({...formData, gender_restrictions: e.target.value})}
                    className="form-input"
                  >
                    <option value="">No Gender Restriction</option>
                    <option value="M">Male Only</option>
                    <option value="F">Female Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Additional Notes</h4>
              <textarea
                placeholder="Additional notes and comments..."
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
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600">Manage healthcare services and programs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Service
        </button>
      </div>

      <BulkActionToolbar
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        entityName="service"
      />

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Services
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, code, description..."
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
            onClick={() => fetchServices(currentPage, searchTerm, filters)}
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
                    checked={selectedItems.length === services.length && services.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Codes & Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requirements
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
              ) : services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(service.id)}
                        onChange={() => toggleSelectItem(service.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getServiceTypeIcon(service.service_type)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {service.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.service_code || `ID: ${service.id}`}
                          </div>
                          {service.description && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.service_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {service.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock size={12} className="mr-1" />
                          {service.duration_minutes} min
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {service.cpt_code && (
                          <div>CPT: {service.cpt_code}</div>
                        )}
                        {service.hcpcs_code && (
                          <div>HCPCS: {service.hcpcs_code}</div>
                        )}
                        {service.price && (
                          <div className="flex items-center">
                            <DollarSign size={12} className="mr-1" />
                            ${parseFloat(service.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {service.requires_authorization && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Auth Required
                          </span>
                        )}
                        {service.requires_referral && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Referral Req
                          </span>
                        )}
                        {service.telehealth_eligible && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Telehealth
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStatusBadgeClass(service.status)}`}>
                        {service.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingService(service)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleBulkDelete([service.id])}
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
                    No services found
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
        <ServiceModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchServices(currentPage, searchTerm, filters);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingService && (
        <ServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={() => {
            fetchServices(currentPage, searchTerm, filters);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
