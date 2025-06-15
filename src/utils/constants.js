export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/core-api';
export const AUTH_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:8000';

export const DATABASES = [
  { id: 'core', name: 'Core' },
  { id: 'humana', name: 'Humana' },
  { id: 'bcbs_az', name: 'BCBS Arizona' },
  { id: 'centene', name: 'Centene' },
  { id: 'uhc', name: 'UHC' },
  { id: 'aarp', name: 'AARP' },
  { id: 'aetna', name: 'Aetna' },
];

export const CLIENT_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'corporate', label: 'Corporate' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

export const MENU_ITEMS = [
  { id: 'patients', label: 'Patients', icon: 'Users' },
  { id: 'clients', label: 'Clients', icon: 'Building' },
  { id: 'providers', label: 'Providers', icon: 'UserCheck' },
  { id: 'referrals', label: 'Referrals', icon: 'FileText' },
  { id: 'services', label: 'Services', icon: 'Settings' },
];
