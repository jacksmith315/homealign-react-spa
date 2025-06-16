import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, formatPhoneNumber, getStatusBadgeClass, downloadFile } from '../../utils/helpers';
import { 
  Search, Plus, Edit2, Trash2, RotateCcw, Mail, Phone, MapPin, Calendar, User
} from 'lucide-react';

const PatientManagement = () => {
  const auth = useAuth();
  const apiService = new ApiService(auth);
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});

  const filterOptions = [
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
        { value: 'O', label: 'Other' },
      ]
    },
    {
      key: 'age_min',
      label: 'Minimum Age',
      type: 'number',
      placeholder: 'Min age'
    },
    {
      key: 'age_max',
      label: 'Maximum Age',
      type: 'number',
      placeholder: 'Max age'
    },
    {
      key: 'created_after',
      label: 'Created After',
      type: 'date',
      placeholder: 'Select date'
    }
  ];

  const fetchPatients = useCallback(async (page = 1, search = '', filterParams = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, search, ...filterParams };
      const data = await apiService.getPatients(params);
      setPatients(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err) {
      setError('Failed to fetch patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    fetchPatients(currentPage, searchTerm, filters);
  }, [currentPage, auth.selectedDb, fetchPatients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients(1, searchTerm, filters);
  };

  const handleBulkDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} patients?`)) return;
    
    try {
      await apiService.bulkDelete('patients', ids);
      setSelectedItems([]);
      fetchPatients(currentPage, searchTerm, filters);
    } catch (err) {
      setError('Failed to delete patients: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.exportData('patients', { search: searchTerm, ...filters });
      downloadFile(response, 'patients.csv');
    } catch (err) {
      setError('Failed to export patients: ' + err.message);
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === patients.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(patients.map(patient => patient.id));
    }
  };

  const PatientModal = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      patient || {
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        dateofbirth: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        emergency_contact: '',
        emergency_phone: '',
        medical_record_number: '',
        insurance_id: '',
        notes: '',
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        if (patient) {
          await apiService.updateItem('patients', patient.id, formData);
        } else {
          await apiService.createItem('patients', formData);
        }
        onSave();
        onClose();
      } catch (err) {
        setError('Failed to save patient: ' + err.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {patient ? 'Edit Patient' : 'Create Patient'}
          </h3>
          
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={formData.firstname}
                  onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={formData.lastname}
                  onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div className="mt-4">
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateofbirth}
                  onChange={(e) => setFormData({...formData, dateofbirth: e.target.value})}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Address Information</h4>
              <textarea
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="form-input w-full"
                rows="2"
              />

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Emergency Contact Name"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Emergency Contact Phone"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Medical Record Number"
                  value={formData.medical_record_number}
                  onChange={(e) => setFormData({...formData, medical_record_number: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Insurance ID"
                  value={formData.insurance_id}
                  onChange={(e) => setFormData({...formData, insurance_id: e.target.value})}
                  className="form-input"
                />
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
          <p className="text-gray-600">Manage patient records and medical information</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Patient
        </button>
      </div>

      <BulkActionToolbar
        selectedItems={selectedItems}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        entityName="patient"
      />

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Patients
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, email, phone..."
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
            onClick={() => fetchPatients(currentPage, searchTerm, filters)}
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
                    checked={selectedItems.length === patients.length && patients.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demographics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical Info
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
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(patient.id)}
                        onChange={() => toggleSelectItem(patient.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {patient.firstname} {patient.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.email && (
                          <div className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {patient.email}
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {formatPhoneNumber(patient.phone)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.gender && (
                          <div>Gender: {patient.gender}</div>
                        )}
                        {patient.dateofbirth && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(patient.dateofbirth)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.medical_record_number && (
                          <div>MRN: {patient.medical_record_number}</div>
                        )}
                        {patient.insurance_id && (
                          <div>Insurance: {patient.insurance_id}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingPatient(patient)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleBulkDelete([patient.id])}
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
                    No patients found
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
        <PatientModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            fetchPatients(currentPage, searchTerm, filters);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingPatient && (
        <PatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={() => {
            fetchPatients(currentPage, searchTerm, filters);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientManagement;
