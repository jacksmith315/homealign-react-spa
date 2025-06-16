import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { Plus, Search, RotateCcw, Mail, Phone, Edit2, Trash2 } from 'lucide-react';
import { formatDate, formatPhoneNumber, getStatusBadgeClass, downloadFile } from '../../utils/helpers';
import { 
  CheckCircle, AlertCircle, Calendar, ArrowRight
} from 'lucide-react';

const ReferralManagement = () => {
  const auth = useAuth();
  const apiService = useMemo(() => new ApiService(auth), [auth]);
  
  const [referrals, setReferrals] = useState([]);
  const [referralTypes, setReferralTypes] = useState([]);
  const [referralStatuses, setReferralStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});

  const filterOptions = [
    {
      key: 'referral_type',
      label: 'Referral Type',
      type: 'select',
      options: referralTypes.map(type => ({ value: type.id, label: type.name }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: referralStatuses.map(status => ({ value: status.id, label: status.name }))
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ]
    },
    {
      key: 'created_after',
      label: 'Created After',
      type: 'date',
      placeholder: 'Select date'
    },
    {
      key: 'due_before',
      label: 'Due Before',
      type: 'date',
      placeholder: 'Select date'
    }
  ];

  const fetchReferrals = useCallback(async (page = 1, search = '', filterParams = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, search, ...filterParams };
      const data = await apiService.getReferrals(params);
      setReferrals(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err) {
      setError('Failed to fetch referrals: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [typesData, statusesData] = await Promise.all([
        apiService.getReferralTypes(),
        apiService.getReferralStatuses()
      ]);
      setReferralTypes(typesData.results || []);
      setReferralStatuses(statusesData.results || []);
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
    }
  }, [apiService]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchReferrals(currentPage, searchTerm, filters);
  }, [currentPage, auth.selectedDb, fetchReferrals, searchTerm, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReferrals(1, searchTerm, filters);
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} referrals?`)) return;
    
    try {
      await apiService.bulkDelete('referrals', ids);
      setSelectedItems([]);
      fetchReferrals(currentPage, searchTerm, filters);
    } catch (err) {
      setError('Failed to delete referrals: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.exportData('referrals', { search: searchTerm, ...filters });
      downloadFile(response, 'referrals.csv');
    } catch (err) {
      setError('Failed to export referrals: ' + err.message);
    }
  };

  const handleStatusChange = async (referralId, newStatusId) => {
    try {
      await apiService.updateItem('referrals', referralId, { status: newStatusId });
      fetchReferrals(currentPage, searchTerm, filters);
    } catch (err) {
      setError('Failed to update referral status: ' + err.message);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === referrals.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(referrals.map(referral => referral.id));
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const ReferralModal = ({ referral, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      referral || {
        patient_id: '',
        referring_provider_id: '',
        referred_to_provider_id: '',
        referral_type_id: '',
        status_id: '',
        priority: 'normal',
        reason: '',
        notes: '',
        referral_date: new Date().toISOString().split('T')[0],
        appointment_date: '',
        due_date: '',
        diagnosis_code: '',
        service_requested: '',
        authorization_required: false,
        authorization_number: '',
        insurance_verification: false,
        clinical_summary: '',
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        if (referral) {
          await apiService.updateItem('referrals', referral.id, formData);
        } else {
          await apiService.createItem('referrals', formData);
        }
        onSave();
        onClose();
      } catch (err) {
        setError('Failed to save referral: ' + err.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {referral ? 'Edit Referral' : 'Create Referral'}
          </h3>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID *
                  </label>
                  <input
                    type="text"
                    placeholder="Patient ID"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                    className="form-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referring Provider ID
                  </label>
                  <input
                    type="text"
                    placeholder="Referring Provider ID"
                    value={formData.referring_provider_id}
                    onChange={(e) => setFormData({...formData, referring_provider_id: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referred To Provider ID
                  </label>
                  <input
                    type="text"
                    placeholder="Referred To Provider ID"
                    value={formData.referred_to_provider_id}
                    onChange={(e) => setFormData({...formData, referred_to_provider_id: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Type
                  </label>
                  <select
                    value={formData.referral_type_id}
                    onChange={(e) => setFormData({...formData, referral_type_id: e.target.value})}
                    className="form-input w-full"
                  >
                    <option value="">Select Type</option>
                    {referralTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status and Priority */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Status & Priority</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status_id}
                    onChange={(e) => setFormData({...formData, status_id: e.target.value})}
                    className="form-input w-full"
                  >
                    <option value="">Select Status</option>
                    {referralStatuses.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="form-input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Date
                  </label>
                  <input
                    type="date"
                    value={formData.referral_date}
                    onChange={(e) => setFormData({...formData, referral_date: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Clinical Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis Code
                  </label>
                  <input
                    type="text"
                    placeholder="ICD-10 Code"
                    value={formData.diagnosis_code}
                    onChange={(e) => setFormData({...formData, diagnosis_code: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Requested
                  </label>
                  <input
                    type="text"
                    placeholder="Service or procedure requested"
                    value={formData.service_requested}
                    onChange={(e) => setFormData({...formData, service_requested: e.target.value})}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Referral
                </label>
                <textarea
                  placeholder="Reason for referral..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="form-input w-full"
                  rows="3"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical Summary
                </label>
                <textarea
                  placeholder="Clinical summary and relevant history..."
                  value={formData.clinical_summary}
                  onChange={(e) => setFormData({...formData, clinical_summary: e.target.value})}
                  className="form-input w-full"
                  rows="3"
                />
              </div>
            </div>

            {/* Authorization */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Authorization & Insurance</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="authorization_required"
                    checked={formData.authorization_required}
                    onChange={(e) => setFormData({...formData, authorization_required: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="authorization_required" className="ml-2 text-sm text-gray-700">
                    Authorization Required
                  </label>
                </div>

                {formData.authorization_required && (
                  <input
                    type="text"
                    placeholder="Authorization Number"
                    value={formData.authorization_number}
                    onChange={(e) => setFormData({...formData, authorization_number: e.target.value})}
                    className="form-input w-full"
                  />
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="insurance_verification"
                    checked={formData.insurance_verification}
                    onChange={(e) => setFormData({...formData, insurance_verification: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="insurance_verification" className="ml-2 text-sm text-gray-700">
                    Insurance Verification Complete
                  </label>
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
          <h2 className="text-2xl font-bold text-gray-900">Referral Management</h2>
          <p className="text-gray-600">Manage patient referrals and tracking</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Referral
        </button>
      </div>

      <BulkActionToolbar
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        entityName="referral"
      />

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Referrals
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by patient, provider, reason..."
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
            onClick={() => fetchReferrals(currentPage, searchTerm, filters)}
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
                    checked={selectedItems.length === referrals.length && referrals.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Providers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
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
              ) : referrals.length > 0 ? (
                referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(referral.id)}
                        onChange={() => toggleSelectItem(referral.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-500 bg-blue-100 rounded-full p-1" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            REF-{referral.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.referral_type_name || 'Standard Referral'}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(referral.priority)}`}>
                            {referral.priority?.toUpperCase() || 'NORMAL'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-6 w-6 text-gray-400" />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {referral.patient_name || `Patient ${referral.patient_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {referral.patient_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400">From:</span>
                          <span className="ml-1">{referral.referring_provider_name || referral.referring_provider_id || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight size={12} className="text-gray-400" />
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-400">To:</span>
                          <span className="ml-1">{referral.referred_to_provider_name || referral.referred_to_provider_id || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(referral.status_name)}
                        <select
                          value={referral.status_id || ''}
                          onChange={(e) => handleStatusChange(referral.id, e.target.value)}
                          className="ml-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
                        >
                          {referralStatuses.map(status => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span className="text-xs">Ref:</span>
                          <span className="ml-1">{formatDate(referral.referral_date)}</span>
                        </div>
                        {referral.appointment_date && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span className="text-xs">Appt:</span>
                            <span className="ml-1">{formatDate(referral.appointment_date)}</span>
                          </div>
                        )}
                        {referral.due_date && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span className="text-xs">Due:</span>
                            <span className="ml-1">{formatDate(referral.due_date)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingReferral(referral)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleBulkDelete([referral.id])}
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
                    No referrals found
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
        <ReferralModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchReferrals(currentPage, searchTerm, filters);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingReferral && (
        <ReferralModal
          referral={editingReferral}
          onClose={() => setEditingReferral(null)}
          onSave={() => {
            fetchReferrals(currentPage, searchTerm, filters);
            setEditingReferral(null);
          }}
        />
      )}
    </div>
  );
};

export default ReferralManagement;
