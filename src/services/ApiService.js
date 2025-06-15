import { API_BASE_URL } from '../utils/constants';

class ApiService {
  constructor(authContext) {
    this.auth = authContext;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.auth.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.auth.logout();
        throw new Error('Authentication failed');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async getList(entity, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/${entity}/${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getItem(entity, id) {
    return this.request(`/${entity}/${id}/`);
  }

  async createItem(entity, data) {
    return this.request(`/${entity}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(entity, id, data) {
    return this.request(`/${entity}/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(entity, id) {
    return this.request(`/${entity}/${id}/`, {
      method: 'DELETE',
    });
  }

  async bulkDelete(entity, ids) {
    const promises = ids.map(id => this.deleteItem(entity, id));
    return Promise.allSettled(promises);
  }

  async bulkUpdate(entity, updates) {
    const promises = updates.map(({ id, data }) => this.updateItem(entity, id, data));
    return Promise.allSettled(promises);
  }

  async exportData(entity, params = {}) {
    const queryString = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const endpoint = `/${entity}/export/?${queryString}`;
    return this.request(endpoint);
  }

  // Entity-specific methods
  async getClients(params = {}) { return this.getList('clients', params); }
  async getProviders(params = {}) { return this.getList('providers', params); }
  async getReferrals(params = {}) { return this.getList('referrals', params); }
  async getPatients(params = {}) { return this.getList('patients', params); }
  async getServices(params = {}) { return this.getList('services', params); }
  async getReferralTypes() { return this.getList('referral-types'); }
  async getReferralStatuses() { return this.getList('referral-status'); }
  async getTenants() { return this.getList('tenants'); }
}

export default ApiService;
