import React, { useState, useEffect } from 'react';
import {
  Server, FileText, Link as LinkIcon, Key, GitBranch, 
  Plus, Edit2, Trash2, Search, Download,
  ExternalLink, Database, Code, Layers,
  AlertCircle, CheckCircle, XCircle, Clock, Archive, Box, FileCode,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import AssetModal from '../components/assets/AssetModal';
import AssetDetailModal from '../components/assets/AssetDetailModal';

const API_URL = '/api';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // NO ADMIN RESTRICTION
  const canEdit = true;

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.technology_stack?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter(asset => asset.asset_type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }

    setFilteredAssets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterType, filterStatus, assets]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch assets');
      
      const data = await response.json();
      setAssets(data);
      setFilteredAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetDetails = async (assetId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/${assetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch asset details');
      
      const data = await response.json();
      setSelectedAsset(data);
      setShowDetailModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveAsset = async (assetData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingAsset 
        ? `${API_URL}/assets/${editingAsset.id}`
        : `${API_URL}/assets`;
      
      const response = await fetch(url, {
        method: editingAsset ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetData)
      });

      if (!response.ok) throw new Error('Failed to save asset');

      await fetchAssets();
      setShowAssetModal(false);
      setEditingAsset(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset? All related data will be deleted.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete asset');

      await fetchAssets();
      setShowDetailModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // DETAILED CSV EXPORT - TABULAR FORMAT
  const handleExportDetailedCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Show loading indicator
      const originalText = document.querySelector('.export-btn-text')?.textContent;
      if (originalText) {
        document.querySelector('.export-btn-text').textContent = 'Exporting...';
      }
      
      // Fetch all assets with details
      const assetsWithDetails = await Promise.all(
        filteredAssets.map(async (asset) => {
          const response = await fetch(`${API_URL}/assets/${asset.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response.json();
        })
      );

      const rows = [];
      
      // Header row
      rows.push([
        'Asset ID',
        'Asset Name',
        'Asset Type',
        'Asset Status',
        'Asset Version',
        'Asset Category',
        'Asset Team',
        'Asset Environment',
        'Asset Tech Stack',
        'Asset Description',
        'Item Type',
        'Item Name',
        'Item Details',
        'Item URL',
        'Item Status/Access',
        'Item Notes'
      ].join(','));

      // Data rows - TABULAR with all details
      assetsWithDetails.forEach(asset => {
        const baseAssetInfo = [
          asset.id,
          `"${(asset.asset_name || '').replace(/"/g, '""')}"`,
          `"${(asset.asset_type || '').replace(/"/g, '""')}"`,
          `"${(asset.status || '').replace(/"/g, '""')}"`,
          `"${(asset.version || '').replace(/"/g, '""')}"`,
          `"${(asset.category || '').replace(/"/g, '""')}"`,
          `"${(asset.team || '').replace(/"/g, '""')}"`,
          `"${(asset.environment_type || '').replace(/"/g, '""')}"`,
          `"${(asset.technology_stack || '').replace(/"/g, '""')}"`,
          `"${(asset.description || '').replace(/"/g, '""')}"`
        ];

        // Repositories
        if (asset.repositories && asset.repositories.length > 0) {
          asset.repositories.forEach(repo => {
            rows.push([
              ...baseAssetInfo,
              'Repository',
              `"${(repo.repository_name || '').replace(/"/g, '""')}"`,
              `"Type: ${repo.repository_type}, Branch: ${repo.branch_name}, Access: ${repo.access_level}"`,
              `"${(repo.repository_url || '').replace(/"/g, '""')}"`,
              repo.is_primary ? 'Primary' : 'Secondary',
              `"${(repo.notes || '').replace(/"/g, '""')}"`
            ].join(','));
          });
        }

        // Documents
        if (asset.documents && asset.documents.length > 0) {
          asset.documents.forEach(doc => {
            rows.push([
              ...baseAssetInfo,
              'Document',
              `"${(doc.document_title || '').replace(/"/g, '""')}"`,
              `"Type: ${doc.document_type}, Format: ${doc.file_format || 'N/A'}"`,
              `"${(doc.document_url || '').replace(/"/g, '""')}"`,
              doc.is_primary ? 'Primary' : 'Secondary',
              `"${(doc.description || '').replace(/"/g, '""')}"`
            ].join(','));
          });
        }

        // Servers
        if (asset.servers && asset.servers.length > 0) {
          asset.servers.forEach(server => {
            rows.push([
              ...baseAssetInfo,
              'Server',
              `"${(server.server_name || '').replace(/"/g, '""')}"`,
              `"Type: ${server.server_type}, IP: ${server.ip_address || 'N/A'}, Host: ${server.hostname || 'N/A'}, Port: ${server.port || 'N/A'}, Provider: ${server.hosting_provider || 'N/A'}, Region: ${server.region || 'N/A'}"`,
              `"${(server.url || '').replace(/"/g, '""')}"`,
              server.status || 'N/A',
              `"${(server.notes || '').replace(/"/g, '""')}"`
            ].join(','));
          });
        }

        // Credentials
        if (asset.credentials && asset.credentials.length > 0) {
          asset.credentials.forEach(cred => {
            rows.push([
              ...baseAssetInfo,
              'Credential',
              `"${(cred.credential_type || '').replace(/"/g, '""')}"`,
              `"Environment: ${cred.environment}, Access Level: ${cred.access_level}, Username: ${cred.username || 'N/A'}, Email: ${cred.email || 'N/A'}"`,
              `"${(cred.email || '').replace(/"/g, '""')}"`,
              cred.is_active ? 'Active' : 'Inactive',
              `"${(cred.notes || '').replace(/"/g, '""')}"`
            ].join(','));
          });
        }

        // Links
        if (asset.links && asset.links.length > 0) {
          asset.links.forEach(link => {
            rows.push([
              ...baseAssetInfo,
              'Link',
              `"${(link.link_title || '').replace(/"/g, '""')}"`,
              `"Type: ${link.link_type}"`,
              `"${(link.url || '').replace(/"/g, '""')}"`,
              link.is_primary ? 'Primary' : 'Secondary',
              `"${(link.description || '').replace(/"/g, '""')}"`
            ].join(','));
          });
        }

        // If asset has no sub-items, still include the asset info
        if ((!asset.repositories || asset.repositories.length === 0) &&
            (!asset.documents || asset.documents.length === 0) &&
            (!asset.servers || asset.servers.length === 0) &&
            (!asset.credentials || asset.credentials.length === 0) &&
            (!asset.links || asset.links.length === 0)) {
          rows.push([
            ...baseAssetInfo,
            'N/A',
            'N/A',
            'N/A',
            'N/A',
            'N/A',
            'N/A'
          ].join(','));
        }
      });

      // Create and download CSV
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `assets-detailed-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Restore button text
      if (originalText) {
        document.querySelector('.export-btn-text').textContent = originalText;
      }
      
      alert(`Exported ${assetsWithDetails.length} assets with all details to CSV`);
    } catch (err) {
      alert('Error exporting CSV: ' + err.message);
      // Restore button text on error
      const btn = document.querySelector('.export-btn-text');
      if (btn) btn.textContent = 'Export CSV';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Inactive': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'Deprecated': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'In Development': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'Archived': return <Archive className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Framework': return <Layers className="w-5 h-5 text-purple-400" />;
      case 'POC': return <Box className="w-5 h-5 text-blue-400" />;
      case 'Demo Environment': return <Server className="w-5 h-5 text-green-400" />;
      case 'Document': return <FileText className="w-5 h-5 text-orange-400" />;
      case 'Tool': return <Code className="w-5 h-5 text-cyan-400" />;
      case 'Library': return <FileCode className="w-5 h-5 text-pink-400" />;
      default: return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssets = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Asset Environment</h1>
            <p className="text-gray-400 mt-1">Manage frameworks, POCs, demos, and environments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportDetailedCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              title="Export Detailed CSV"
            >
              <Download className="w-5 h-5" />
              <span className="export-btn-text">Export CSV</span>
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingAsset(null);
                  setShowAssetModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add New Asset
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="" className="bg-gray-800">All Types</option>
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
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="" className="bg-gray-800">All Status</option>
                <option value="Active" className="bg-gray-800">Active</option>
                <option value="Inactive" className="bg-gray-800">Inactive</option>
                <option value="Deprecated" className="bg-gray-800">Deprecated</option>
                <option value="In Development" className="bg-gray-800">In Development</option>
                <option value="Archived" className="bg-gray-800">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Assets</p>
                <p className="text-2xl font-bold text-white">{assets.length}</p>
              </div>
              <Database className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-400">
                  {assets.filter(a => a.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Development</p>
                <p className="text-2xl font-bold text-blue-400">
                  {assets.filter(a => a.status === 'In Development').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Deprecated</p>
                <p className="text-2xl font-bold text-orange-400">
                  {assets.filter(a => a.status === 'Deprecated').length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Pagination Info */}
        {filteredAssets.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAssets.length)} of {filteredAssets.length} assets
            </p>
            <p className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-4">
        {currentAssets.map((asset) => (
          <div key={asset.id} className="glass rounded-lg border border-white/10 overflow-hidden hover:border-white/30 transition-all">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-white/5 rounded-lg">
                    {getTypeIcon(asset.asset_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">{asset.asset_name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                        {asset.asset_type}
                      </span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(asset.status)}
                        <span className="text-sm text-gray-400">{asset.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{asset.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {asset.version && (
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          {asset.version}
                        </span>
                      )}
                      {asset.technology_stack && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          {asset.technology_stack}
                        </span>
                      )}
                      {asset.team && (
                        <span className="flex items-center gap-1">
                          <Server className="w-4 h-4" />
                          {asset.team}
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Stats - Clickable Badges */}
                    <div className="flex gap-3 mt-3">
                      {parseInt(asset.repository_count) > 0 && (
                        <button
                          onClick={() => fetchAssetDetails(asset.id)}
                          className="flex items-center gap-1 text-sm text-purple-300 bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer"
                          title="Click to view repositories"
                        >
                          <GitBranch className="w-4 h-4" />
                          {asset.repository_count} repos
                        </button>
                      )}
                      {parseInt(asset.document_count) > 0 && (
                        <button
                          onClick={() => fetchAssetDetails(asset.id)}
                          className="flex items-center gap-1 text-sm text-orange-300 bg-orange-500/20 px-2 py-1 rounded border border-orange-500/30 hover:bg-orange-500/30 transition-colors cursor-pointer"
                          title="Click to view documents"
                        >
                          <FileText className="w-4 h-4" />
                          {asset.document_count} docs
                        </button>
                      )}
                      {parseInt(asset.server_count) > 0 && (
                        <button
                          onClick={() => fetchAssetDetails(asset.id)}
                          className="flex items-center gap-1 text-sm text-green-300 bg-green-500/20 px-2 py-1 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors cursor-pointer"
                          title="Click to view servers"
                        >
                          <Server className="w-4 h-4" />
                          {asset.server_count} servers
                        </button>
                      )}
                      {parseInt(asset.credential_count) > 0 && (
                        <button
                          onClick={() => fetchAssetDetails(asset.id)}
                          className="flex items-center gap-1 text-sm text-red-300 bg-red-500/20 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors cursor-pointer"
                          title="Click to view credentials"
                        >
                          <Key className="w-4 h-4" />
                          {asset.credential_count} credentials
                        </button>
                      )}
                      {parseInt(asset.link_count) > 0 && (
                        <button
                          onClick={() => fetchAssetDetails(asset.id)}
                          className="flex items-center gap-1 text-sm text-blue-300 bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
                          title="Click to view links"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {asset.link_count} links
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchAssetDetails(asset.id)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setShowAssetModal(true);
                        }}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {currentAssets.length === 0 && filteredAssets.length === 0 && (
          <div className="text-center py-12 glass rounded-lg">
            <Database className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
            <p className="text-gray-400">
              {searchTerm || filterType || filterStatus
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first asset'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page Numbers */}
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Show first page, last page, current page, and pages around current
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showAssetModal && (
        <AssetModal
          editing={editingAsset}
          onClose={() => {
            setShowAssetModal(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
        />
      )}

      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          isAdmin={canEdit}
          onClose={() => setShowDetailModal(false)}
          onRefresh={() => fetchAssetDetails(selectedAsset.id)}
        />
      )}
    </div>
  );
};

export default Assets;
