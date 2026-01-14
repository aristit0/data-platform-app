import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Repository Modal - DARK THEME
export const RepositoryModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    repository_type: 'GitHub',
    repository_url: '',
    repository_name: '',
    branch_name: 'main',
    is_primary: false,
    access_level: 'Private',
    notes: ''
  });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">
            {editing ? 'Edit Repository' : 'Add Repository'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Repository Type *
              </label>
              <select
                value={formData.repository_type}
                onChange={(e) => setFormData({...formData, repository_type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="GitHub" className="bg-gray-800">GitHub</option>
                <option value="GitLab" className="bg-gray-800">GitLab</option>
                <option value="Bitbucket" className="bg-gray-800">Bitbucket</option>
                <option value="Azure DevOps" className="bg-gray-800">Azure DevOps</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Level *
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData({...formData, access_level: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Private" className="bg-gray-800">Private</option>
                <option value="Public" className="bg-gray-800">Public</option>
                <option value="Internal" className="bg-gray-800">Internal</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repository URL *
            </label>
            <input
              type="url"
              value={formData.repository_url}
              onChange={(e) => setFormData({...formData, repository_url: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/company/repository"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Repository Name *
              </label>
              <input
                type="text"
                value={formData.repository_name}
                onChange={(e) => setFormData({...formData, repository_name: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="my-repository"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="main"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Primary Repository</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Update Repository' : 'Add Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Document Modal - DARK THEME
export const DocumentModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    document_title: '',
    document_type: 'Technical Documentation',
    document_url: '',
    file_format: 'PDF',
    is_primary: false,
    description: ''
  });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">
            {editing ? 'Edit Document' : 'Add Document'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type *
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Technical Documentation" className="bg-gray-800">Technical Documentation</option>
                <option value="User Guide" className="bg-gray-800">User Guide</option>
                <option value="API Documentation" className="bg-gray-800">API Documentation</option>
                <option value="Presentation" className="bg-gray-800">Presentation</option>
                <option value="SOP" className="bg-gray-800">SOP</option>
                <option value="Architecture" className="bg-gray-800">Architecture</option>
                <option value="Specification" className="bg-gray-800">Specification</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File Format
              </label>
              <select
                value={formData.file_format}
                onChange={(e) => setFormData({...formData, file_format: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="PDF" className="bg-gray-800">PDF</option>
                <option value="DOCX" className="bg-gray-800">DOCX</option>
                <option value="PPTX" className="bg-gray-800">PPTX</option>
                <option value="MD" className="bg-gray-800">Markdown</option>
                <option value="HTML" className="bg-gray-800">HTML</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              value={formData.document_title}
              onChange={(e) => setFormData({...formData, document_title: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="API Documentation v2.0"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Document URL *
            </label>
            <input
              type="url"
              value={formData.document_url}
              onChange={(e) => setFormData({...formData, document_url: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://docs.example.com/api"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Document description..."
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Primary Document</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Update Document' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Server Modal, Credential Modal, Link Modal dengan pattern yang sama...
// (Continuing with similar dark theme pattern for all modals)

export const ServerModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    server_name: '',
    server_type: 'Development',
    ip_address: '',
    hostname: '',
    port: '',
    url: '',
    hosting_provider: 'AWS',
    region: '',
    specifications: '',
    status: 'Running',
    notes: ''
  });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">
            {editing ? 'Edit Server' : 'Add Server'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Server Name *</label>
              <input
                type="text"
                value={formData.server_name}
                onChange={(e) => setFormData({...formData, server_name: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="production-server-01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Server Type *</label>
              <select
                value={formData.server_type}
                onChange={(e) => setFormData({...formData, server_type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Development" className="bg-gray-800">Development</option>
                <option value="Staging" className="bg-gray-800">Staging</option>
                <option value="Production" className="bg-gray-800">Production</option>
                <option value="Demo" className="bg-gray-800">Demo</option>
                <option value="Backup" className="bg-gray-800">Backup</option>
                <option value="Testing" className="bg-gray-800">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hostname</label>
              <input
                type="text"
                value={formData.hostname}
                onChange={(e) => setFormData({...formData, hostname: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="server.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="8080"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hosting Provider</label>
              <select
                value={formData.hosting_provider}
                onChange={(e) => setFormData({...formData, hosting_provider: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="AWS" className="bg-gray-800">AWS</option>
                <option value="Azure" className="bg-gray-800">Azure</option>
                <option value="GCP" className="bg-gray-800">Google Cloud Platform</option>
                <option value="DigitalOcean" className="bg-gray-800">DigitalOcean</option>
                <option value="On-Premise" className="bg-gray-800">On-Premise</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="us-east-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Running" className="bg-gray-800">Running</option>
                <option value="Stopped" className="bg-gray-800">Stopped</option>
                <option value="Maintenance" className="bg-gray-800">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://server.example.com"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Specifications</label>
            <input
              type="text"
              value={formData.specifications}
              onChange={(e) => setFormData({...formData, specifications: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="4 vCPU, 8GB RAM, 100GB SSD"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Update Server' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CredentialModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    credential_type: 'Admin',
    username: '',
    password: '',
    email: '',
    access_level: 'Full',
    environment: 'Production',
    description: '',
    expiry_date: '',
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">
            {editing ? 'Edit Credential' : 'Add Credential'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Credential Type *</label>
              <select
                value={formData.credential_type}
                onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Admin" className="bg-gray-800">Admin</option>
                <option value="User" className="bg-gray-800">User</option>
                <option value="Demo" className="bg-gray-800">Demo</option>
                <option value="API Key" className="bg-gray-800">API Key</option>
                <option value="Database" className="bg-gray-800">Database</option>
                <option value="SSH" className="bg-gray-800">SSH</option>
                <option value="FTP" className="bg-gray-800">FTP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Environment *</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({...formData, environment: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Production" className="bg-gray-800">Production</option>
                <option value="Staging" className="bg-gray-800">Staging</option>
                <option value="Development" className="bg-gray-800">Development</option>
                <option value="Testing" className="bg-gray-800">Testing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData({...formData, access_level: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full" className="bg-gray-800">Full</option>
                <option value="Read Only" className="bg-gray-800">Read Only</option>
                <option value="Limited" className="bg-gray-800">Limited</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Admin account for production database"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Update Credential' : 'Add Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LinkModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    link_title: '',
    link_type: 'Demo URL',
    url: '',
    description: '',
    is_primary: false
  });

  useEffect(() => {
    if (editing) {
      setFormData(editing);
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-xl max-w-2xl w-full border border-white/10">
        <div className="glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">
            {editing ? 'Edit Link' : 'Add Link'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Link Title *</label>
              <input
                type="text"
                value={formData.link_title}
                onChange={(e) => setFormData({...formData, link_title: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Production Dashboard"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Link Type *</label>
              <select
                value={formData.link_type}
                onChange={(e) => setFormData({...formData, link_type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Demo URL" className="bg-gray-800">Demo URL</option>
                <option value="Monitoring" className="bg-gray-800">Monitoring</option>
                <option value="Analytics" className="bg-gray-800">Analytics</option>
                <option value="Wiki" className="bg-gray-800">Wiki</option>
                <option value="Jira" className="bg-gray-800">Jira</option>
                <option value="Confluence" className="bg-gray-800">Confluence</option>
                <option value="Swagger" className="bg-gray-800">Swagger</option>
                <option value="Postman" className="bg-gray-800">Postman</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              placeholder="https://dashboard.example.com"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Link description..."
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Primary Link</span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
