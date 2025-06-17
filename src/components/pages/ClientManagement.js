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
    Building,
    User,
    Calendar,
    MapPin,
    Printer
} from 'lucide-react';

const ClientManagement = () => {
  const auth = useAuth();
  const apiService = useMemo(() => new ApiService(auth), [auth]);
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({});

  const filterOptions = [
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
      key: 'hl7interface',
      label: 'HL7 Interface',
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ]
    },
    {
      key: 'autofileinvoices',
      label: 'Auto File Invoices',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ]
    },
    {
      key: 'visibleincoretenant',
      label: 'Visible in Core Tenant',
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

  const fetchClients = useCallback(async (page = 1, search = '', filterParams = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const params = { page, search, ...filterParams };
      const data = await apiService.getClients(params);
      
      // Handle paginated response structure
      setClients(data.results || []);
      setTotalCount(data.count || 0);
      setNextPage(data.next);
      setPreviousPage(data.previous);
      
      // Calculate total pages (assuming 10 items per page or derive from API)
      const itemsPerPage = 10; // This should match your API's page size
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
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
      downloadFile(response, 'clients.csv');
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
      setSelectedItems(clients.map(client => client.pkclientid || client.id));
    }
  };

  const ClientModal = ({ client, onClose, onSave }) => {
    const [formData, setFormData] = useState(
      client || {
        clientname: '',
        contactname: '',
        billingaddress1: '',
        billingaddress2: '',
        billingstate: '',
        billingcity: '',
        billingzip: '',
        emailaddress: '',
        faxnumber: '',
        phonenumber: '',
        active: true,
        hl7interface: false,
        invoicedeliverymethod: null,
        pono: '',
        terms: null,
        autofileinvoices: false,
        claimoriginatingid: '',
        enabledatadownloadsync: false,
        visibleincoretenant: true,
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
          hl7interface: formData.hl7interface === 'true' || formData.hl7interface === true,
          autofileinvoices: formData.autofileinvoices === 'true' || formData.autofileinvoices === true,
          enabledatadownloadsync: formData.enabledatadownloadsync === 'true' || formData.enabledatadownloadsync === true,
          visibleincoretenant: formData.visibleincoretenant === 'true' || formData.visibleincoretenant === true,
          // Convert numeric fields
          invoicedeliverymethod: formData.invoicedeliverymethod ? parseInt(formData.invoicedeliverymethod) : null,
          terms: formData.terms ? parseInt(formData.terms) : null,
        };
        
        if (client) {
          await apiService.updateItem('clients', client.pkclientid || client.id, submitData);
        } else {
          await apiService.createItem('clients', submitData);
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
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {client ? 'Edit Client' : 'Create Client'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name *"
                  value={formData.clientname}
                  onChange={(e) => setFormData({...formData, clientname: e.target.value})}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={formData.contactname}
                  onChange={(e) => setFormData({...formData, contactname: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.emailaddress}
                  onChange={(e) => setFormData({...formData, emailaddress: e.target.value})}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phonenumber}
                  onChange={(e) => setFormData({...formData, phonenumber: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="mt-4">
                <input
                  type="tel"
                  placeholder="Fax Number"
                  value={formData.faxnumber}
                  onChange={(e) => setFormData({...formData, faxnumber: e.target.value})}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Billing Address</h4>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Billing Address Line 1"
                  value={formData.billingaddress1}
                  onChange={(e) => setFormData({...formData, billingaddress1: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Billing Address Line 2"
                  value={formData.billingaddress2}
                  onChange={(e) => setFormData({...formData, billingaddress2: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.billingcity}
                  onChange={(e) => setFormData({...formData, billingcity: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.billingstate}
                  onChange={(e) => setFormData({...formData, billingstate: e.target.value})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={formData.billingzip}
                  onChange={(e) => setFormData({...formData, billingzip: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            {/* Business Settings */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Business Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Purchase Order Number"
                  value={formData.pono}
                  onChange={(e) => setFormData({...formData, pono: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Payment Terms (Days)"
                  value={formData.terms || ''}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Invoice Delivery Method"
                  value={formData.invoicedeliverymethod || ''}
                  onChange={(e) => setFormData({...formData, invoicedeliverymethod: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Claim Originating ID"
                  value={formData.claimoriginatingid}
                  onChange={(e) => setFormData({...formData, claimoriginatingid: e.target.value})}
                  className="form-input w-full"
                />
              </div>
            </div>

            {/* System Configuration */}
            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3">System Configuration</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Active Client
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hl7interface}
                      onChange={(e) => setFormData({...formData, hl7interface: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    HL7 Interface Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autofileinvoices}
                      onChange={(e) => setFormData({...formData, autofileinvoices: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Auto File Invoices
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabledatadownloadsync}
                      onChange={(e) => setFormData({...formData, enabledatadownloadsync: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Enable Data Download Sync
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.visibleincoretenant}
                      onChange={(e) => setFormData({...formData, visibleincoretenant: e.target.checked})}
                      className="rounded border-gray-300 mr-2"
                    />
                    Visible in Core Tenant
                  </label>
                </div>
              </div>
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
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage client organizations and contracts</p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Total: {totalCount} clients
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
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
                placeholder="Search by client name, contact name, email..."
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
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configuration
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
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.pkclientid || client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(client.pkclientid || client.id)}
                        onChange={() => toggleSelectItem(client.pkclientid || client.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {client.clientname}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {client.pkclientid || client.id}
                          </div>
                          {client.contactname && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <User size={12} className="mr-1" />
                              {client.contactname}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {client.emailaddress && (
                          <div className="flex items-center">
                            <Mail size={14} className="mr-1" />
                            {client.emailaddress}
                          </div>
                        )}
                        {client.phonenumber && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {formatPhoneNumber(client.phonenumber)}
                          </div>
                        )}
                        {client.faxnumber && (
                          <div className="flex items-center">
                            <Printer size={14} className="mr-1" />
                            {formatPhoneNumber(client.faxnumber)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {client.billingaddress1 && (
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-1 mt-0.5" />
                            <div>
                              <div>{client.billingaddress1}</div>
                              {client.billingaddress2 && <div>{client.billingaddress2}</div>}
                              {(client.billingcity || client.billingstate || client.billingzip) && (
                                <div>
                                  {client.billingcity}{client.billingcity && client.billingstate && ', '}{client.billingstate} {client.billingzip}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {client.hl7interface && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            HL7
                          </span>
                        )}
                        {client.autofileinvoices && (
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Auto Invoices
                            </span>
                          </div>
                        )}
                        {client.enabledatadownloadsync && (
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Data Sync
                            </span>
                          </div>
                        )}
                        {client.terms && (
                          <div className="text-xs">Terms: {client.terms} days</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                        {client.visibleincoretenant && (
                          <div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              Core Tenant
                            </span>
                          </div>
                        )}
                        {client.datecreated && (
                          <div className="text-xs text-gray-400 flex items-center">
                            <Calendar size={10} className="mr-1" />
                            Created: {formatDate(client.datecreated)}
                          </div>
                        )}
                      </div>
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
                          onClick={() => handleBulkDelete([client.pkclientid || client.id])}
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
                    No clients found
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
                    <span> ({totalCount} total clients)</span>
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
