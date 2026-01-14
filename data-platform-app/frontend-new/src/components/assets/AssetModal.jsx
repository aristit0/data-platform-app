import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AssetModal = ({ editing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: '',
    category: '',
    description: '',
    version: '',
    status: 'Active',
    technology_stack: '',
    team: '',
    environment_type: '',
    tags: '',
    notes: '',
    is_public: false,
    expiry_date: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setFormData({
        asset_name: editing.asset_name || '',
        asset_type: editing.asset_type || '',
        category: editing.category || '',
        description: editing.description || '',
        version: editing.version || '',
        status: editing.status || 'Active',
        technology_stack: editing.technology_stack || '',
        team: editing.team || '',
        environment_type: editing.environment_type || '',
        tags: editing.tags || '',
        notes: editing.notes || '',
        is_public: editing.is_public || false,
        expiry_date: editing.expiry_date ? editing.expiry_date.split('T')[0] : ''
      });
    }
  }, [editing]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.asset_name.trim()) {
      newErrors.asset_name = 'Asset name is required';
    }

    if (!formData.asset_type) {
      newErrors.asset_type = 'Asset type is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-xl z-10">
          <h2 className="text-2xl font-bold text-white">
            {editing ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Asset Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Name *
            </label>
            <input
              type="text"
              value={formData.asset_name}
              onChange={(e) => handleChange('asset_name', e.target.value)}
              className={`w-full px-4 py-2 bg-white/10 border ${
                errors.asset_name ? 'border-red-500' : 'border-white/20'
              } rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="e.g., Customer Portal Platform"
            />
            {errors.asset_name && (
              <p className="text-red-400 text-sm mt-1">{errors.asset_name}</p>
            )}
          </div>

          {/* Asset Type & Status */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asset Type *
              </label>
              <select
                value={formData.asset_type}
                onChange={(e) => handleChange('asset_type', e.target.value)}
                className={`w-full px-4 py-2 bg-white/10 border ${
                  errors.asset_type ? 'border-red-500' : 'border-white/20'
                } rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="" className="bg-gray-800">Select Type</option>
                <option value="Framework" className="bg-gray-800">Framework</option>
                <option value="POC" className="bg-gray-800">POC</option>
                <option value="Demo Environment" className="bg-gray-800">Demo Environment</option>
                <option value="Document" className="bg-gray-800">Document</option>
                <option value="Tool" className="bg-gray-800">Tool</option>
                <option value="Template" className="bg-gray-800">Template</option>
                <option value="Library" className="bg-gray-800">Library</option>
                <option value="API" className="bg-gray-800">API</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
              {errors.asset_type && (
                <p className="text-red-400 text-sm mt-1">{errors.asset_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={`w-full px-4 py-2 bg-white/10 border ${
                  errors.status ? 'border-red-500' : 'border-white/20'
                } rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="Active" className="bg-gray-800">Active</option>
                <option value="Inactive" className="bg-gray-800">Inactive</option>
                <option value="In Development" className="bg-gray-800">In Development</option>
                <option value="Deprecated" className="bg-gray-800">Deprecated</option>
                <option value="Archived" className="bg-gray-800">Archived</option>
              </select>
              {errors.status && (
                <p className="text-red-400 text-sm mt-1">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Category & Version */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Web Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., v2.1.0"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe the asset..."
            />
          </div>

          {/* Technology Stack */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Technology Stack
            </label>
            <input
              type="text"
              value={formData.technology_stack}
              onChange={(e) => handleChange('technology_stack', e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., React, Node.js, MySQL"
            />
          </div>

          {/* Team & Environment Type */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team
              </label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => handleChange('team', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Engineering Team"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Environment Type
              </label>
              <select
                value={formData.environment_type}
                onChange={(e) => handleChange('environment_type', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-gray-800">Select Environment</option>
                <option value="Production" className="bg-gray-800">Production</option>
                <option value="Staging" className="bg-gray-800">Staging</option>
                <option value="Development" className="bg-gray-800">Development</option>
                <option value="Testing" className="bg-gray-800">Testing</option>
                <option value="Demo" className="bg-gray-800">Demo</option>
              </select>
            </div>
          </div>

          {/* Tags & Expiry Date */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., customer, portal, production"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated tags</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          {/* Public Asset Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => handleChange('is_public', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-300">Public Asset</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              Make this asset visible to all users
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              {editing ? 'Update Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
