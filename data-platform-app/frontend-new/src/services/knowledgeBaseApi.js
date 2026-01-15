import axios from 'axios';

// NEW: Gunakan prefix /kb-api agar proxy ke port 2222
const API_BASE_URL = '/kb-api';

// Get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const knowledgeBaseApi = {
  // Upload document
  uploadDocument: async (file, product, subProduct, category) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('product', product);
    formData.append('sub_product', subProduct);
    formData.append('category', category);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Search documents
  searchDocuments: async (query, filters = {}) => {
    const params = new URLSearchParams({ q: query });
    
    if (filters.product) params.append('product', filters.product);
    if (filters.subProduct) params.append('sub_product', filters.subProduct);
    if (filters.category) params.append('category', filters.category);

    const response = await axios.get(`${API_BASE_URL}/search?${params}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // List documents by path
  listDocuments: async (path = '') => {
    const response = await axios.get(`${API_BASE_URL}/documents`, {
      params: { path },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get document details
  getDocument: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Download document
  downloadDocument: async (id, filename) => {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/download`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Delete document
  deleteDocument: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/documents/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },


};
