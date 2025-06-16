import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import ApiService from '../../services/ApiService';
import BulkActionToolbar from '../common/BulkActionToolbar';
import AdvancedFilters from '../common/AdvancedFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, formatPhoneNumber, downloadFile } from '../../utils/helpers';
import { 
    Plus, 
    Search, 
    RotateCcw, 
    Mail, 
    Phone, 
    Edit2, 
    Trash2,
    User,
    Calendar
} from 'lucide-react';

const PatientManagement = () => {
  const auth = useAuth();
  const apiService = useMemo(() => new ApiService(auth), [auth]);
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
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
        { value: 'm', label: 'Male' },
        { value: 'f', label: 'Female' },
        { value: 's', label: 'Other' },
      ]
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ]
    },
    {
      key: 'caregiver',
      label: 'Caregiver',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]
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
      
      // Handle paginated response structure
      setPatients(data.results || []);
      setTotalCount(data.count || 0);
      setNextPage(data.next);
      setPreviousPage(data.previous);
      
      // Calculate total pages (assuming 10 items per page or derive from API)
      const itemsPerPage = 10; // This should match your API's page size
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
    } catch (err) {
      setError('Failed to fetch members: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    fetchPatients(currentPage, searchTerm, filters);
  }, [currentPage, auth.selectedDb, fetchPatients, searchTerm, filters]);

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
      setSelectedItems(patients.map(patient => patient.pkpatientid || patient.id));
    }
  };

  const PatientModal = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      patient || {
        firstname: '',
        lastname: '',
        middlename: '',
        accountnumber: '',
        payorinformation: '',
        dob: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zipcode: '',
        zip4: '',
        phonenumber: '',
        mobilenumber: '',
        othernumber: '',
        primaryphone: '',
        emailaddress: '',
        preferredcontactmethod: '',
        gender: '',
        active: true,
        receivemonthlyreminderemail: false,
        servicecategories: '',
        additionaldata: '',
        caregiver: false,
        fkcounty: null,
        fkmembereligibilityid: null,
        fkpreferredlanguageid: null,
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      
      try {
        // Prepare data for API
        const submitData = {
          ...formData,
          // Convert string booleans to actual booleans
          active: formData.active === 'true' || formData.active === true,
          receivemonthlyreminderemail: formData.receivemonthlyreminderemail === 'true' || formData.receivemonthlyreminderemail === true,
          caregiver: formData.caregiver === 'true' || formData.caregiver === true,
          // Convert foreign key fields to numbers if they exist
          fkcounty: formData.fkcounty ? parseInt(formData.fkcounty) : null,
          fkmembereligibilityid: formData.fkmembereligibilityid ? parseInt(formData.fkmembereligibilityid) : null,
          fkpreferredlanguageid: formData.fkpreferredlanguageid ? parseInt(formData.fkpreferredlanguageid) : null,
        };
        
        if (patient) {
          await apiService.updateItem('patients', patient.pkpatientid || patient.id, submitData);
        } else {
          await apiService.createItem('patients', submitData);
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
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {patient ? 'Edit Member' : 'Create Member'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-3 gap-4">
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
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={formData.middlename}
                  onChange={(e) => setFormData({...formData, middlename: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.emailaddress}
                  onChange={(e) => setFormData({...formData, emailaddress: e.target.value})}
                  className="form-input"
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dob ? formData.dob.split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="form-input"
                />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                  <option value="s">Other</option>
                </select>
              </div>
            </div>

            {/* Account Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Account Number"
                  value={formData.accountnumber}
                  onChange={(e) => setFormData({...formData, accountnumber: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Payor Information"
                  value={formData.payorinformation}
                  onChange={(e) => setFormData({...formData, payorinformation: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phonenumber}
                  onChange={(e) => setFormData({...formData, phonenumber: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={formData.mobilenumber}
                  onChange={(e) => setFormData({...formData, mobilenumber: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="tel"
                  placeholder="Other Number"
                  value={formData.othernumber}
                  onChange={(e) => setFormData({...formData, othernumber: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Primary Phone"
                  value={formData.primaryphone}
                  onChange={(e) => setFormData({...formData, primaryphone: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Preferred Contact Method"
                  value={formData.preferredcontactmethod}
                  onChange={(e) => setFormData({...formData, preferredcontactmethod: e.target.value})}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Address Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={formData.address1}
                  onChange={(e) => setFormData({...formData, address1: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Address Line 2"
                  value={formData.address2}
                  onChange={(e) => setFormData({...formData, address2: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
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
                  value={formData.zipcode}
                  onChange={(e) => setFormData({...formData, zipcode: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="ZIP+4"
                  value={formData.zip4}
                  onChange={(e) => setFormData({...formData, zip4: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Settings & Preferences */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Settings & Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Active Member
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.caregiver}
                      onChange={(e) => setFormData({...formData, caregiver: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Caregiver
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.receivemonthlyreminderemail}
                      onChange={(e) => setFormData({...formData, receivemonthlyreminderemail: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Receive Monthly Reminder Email
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="County ID"
                  value={formData.fkcounty || ''}
                  onChange={(e) => setFormData({...formData, fkcounty: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Member Eligibility ID"
                  value={formData.fkmembereligibilityid || ''}
                  onChange={(e) => setFormData({...formData, fkmembereligibilityid: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Preferred Language ID"
                  value={formData.fkpreferredlanguageid || ''}
                  onChange={(e) => setFormData({...formData, fkpreferredlanguageid: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Service Categories"
                  value={formData.servicecategories}
                  onChange={(e) => setFormData({...formData, servicecategories: e.target.value})}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Additional Data</h4>
              <textarea
                placeholder="Additional data and notes..."
                value={formData.additionaldata}
                onChange={(e) => setFormData({...formData, additionaldata: e.target.value})}
                className="form-input w-full"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <p className="text-gray-600">Manage member records</p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Total: {totalCount} patients
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Member
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
              Search Members
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, email, phone, account number..."
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
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demographics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Info
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
              ) : patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.pkpatientid || patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(patient.pkpatientid || patient.id)}
                        onChange={() => toggleSelectItem(patient.pkpatientid || patient.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {patient.firstname} {patient.middlename && patient.middlename + ' '}{patient.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.pkpatientid || patient.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.emailaddress && (
                          <div className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {patient.emailaddress}
                          </div>
                        )}
                        {patient.primaryphone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {formatPhoneNumber(patient.primaryphone)}
                          </div>
                        )}
                        {patient.phonenumber && patient.phonenumber !== patient.primaryphone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {formatPhoneNumber(patient.phonenumber)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.gender && (
                          <div>Gender: {patient.gender.toUpperCase()}</div>
                        )}
                        {patient.dob && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(patient.dob)}
                          </div>
                        )}
                        {patient.city && patient.state && (
                          <div>{patient.city}, {patient.state}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {patient.accountnumber && (
                          <div>Account: {patient.accountnumber}</div>
                        )}
                        {patient.payorinformation && (
                          <div>Payor: {patient.payorinformation}</div>
                        )}
                        {patient.servicecategories && (
                          <div>Services: {patient.servicecategories}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.active ? 'Active' : 'Inactive'}
                        </span>
                        {patient.caregiver && (
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Caregiver
                            </span>
                          </div>
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
                          onClick={() => handleBulkDelete([patient.pkpatientid || patient.id])}
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
                    No members found
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
                  {totalCount > 0 && (
                    <span> ({totalCount} total patients)</span>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || !previousPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || !nextPage}
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