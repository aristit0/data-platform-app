import React, { useState } from 'react';
import {
  X, Plus, Edit2, Trash2, Copy, Eye, EyeOff, ExternalLink,
  GitBranch, FileText, Server, Key, Link as LinkIcon,
  CheckCircle, XCircle, Clock, AlertCircle, Archive
} from 'lucide-react';
import { 
  RepositoryModal, 
  DocumentModal, 
  ServerModal, 
  CredentialModal, 
  LinkModal 
} from './AssetModals';

const API_URL = '/api';

const AssetDetailModal = ({ asset, isAdmin, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('repositories');
  const [showPassword, setShowPassword] = useState({});
  
  // NO RESTRICTION - Everyone can edit/delete
  const canEdit = true;
  
  // Sub-modals state
  const [showRepositoryModal, setShowRepositoryModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Editing state
  const [editingRepository, setEditingRepository] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingServer, setEditingServer] = useState(null);
  const [editingCredential, setEditingCredential] = useState(null);
  const [editingLink, setEditingLink] = useState(null);

  const repositories = asset.repositories || [];
  const documents = asset.documents || [];
  const servers = asset.servers || [];
  const credentials = asset.credentials || [];
  const links = asset.links || [];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
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

  // CRUD Handlers
  const handleSaveRepository = async (repoData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingRepository
        ? `${API_URL}/assets/repositories/${editingRepository.id}`
        : `${API_URL}/assets/${asset.id}/repositories`;
      
      const response = await fetch(url, {
        method: editingRepository ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repoData)
      });

      if (!response.ok) throw new Error('Failed to save repository');

      onRefresh();
      setShowRepositoryModal(false);
      setEditingRepository(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteRepository = async (repoId) => {
    if (!window.confirm('Are you sure you want to delete this repository?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/repositories/${repoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete repository');
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveDocument = async (docData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingDocument
        ? `${API_URL}/assets/documents/${editingDocument.id}`
        : `${API_URL}/assets/${asset.id}/documents`;
      
      const response = await fetch(url, {
        method: editingDocument ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(docData)
      });

      if (!response.ok) throw new Error('Failed to save document');

      onRefresh();
      setShowDocumentModal(false);
      setEditingDocument(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete document');
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveServer = async (serverData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingServer
        ? `${API_URL}/assets/servers/${editingServer.id}`
        : `${API_URL}/assets/${asset.id}/servers`;
      
      const response = await fetch(url, {
        method: editingServer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serverData)
      });

      if (!response.ok) throw new Error('Failed to save server');

      onRefresh();
      setShowServerModal(false);
      setEditingServer(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteServer = async (serverId) => {
    if (!window.confirm('Are you sure you want to delete this server?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/servers/${serverId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete server');
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveCredential = async (credData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingCredential
        ? `${API_URL}/assets/credentials/${editingCredential.id}`
        : `${API_URL}/assets/${asset.id}/credentials`;
      
      const response = await fetch(url, {
        method: editingCredential ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(credData)
      });

      if (!response.ok) throw new Error('Failed to save credential');

      onRefresh();
      setShowCredentialModal(false);
      setEditingCredential(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteCredential = async (credId) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/credentials/${credId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete credential');
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveLink = async (linkData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingLink
        ? `${API_URL}/assets/links/${editingLink.id}`
        : `${API_URL}/assets/${asset.id}/links`;
      
      const response = await fetch(url, {
        method: editingLink ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkData)
      });

      if (!response.ok) throw new Error('Failed to save link');

      onRefresh();
      setShowLinkModal(false);
      setEditingLink(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/assets/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete link');
      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header - Dark Theme */}
        <div className="sticky top-0 glass border-b border-white/10 px-6 py-4 flex justify-between items-center z-10 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-bold text-white">{asset.asset_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                {asset.asset_type}
              </span>
              <div className="flex items-center gap-1">
                {getStatusIcon(asset.status)}
                <span className="text-sm text-gray-300">{asset.status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Asset Info - Dark Theme */}
        <div className="p-6 bg-white/5 border-b border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {asset.version && (
              <div>
                <p className="text-sm text-gray-400">Version</p>
                <p className="font-medium text-white">{asset.version}</p>
              </div>
            )}
            {asset.category && (
              <div>
                <p className="text-sm text-gray-400">Category</p>
                <p className="font-medium text-white">{asset.category}</p>
              </div>
            )}
            {asset.team && (
              <div>
                <p className="text-sm text-gray-400">Team</p>
                <p className="font-medium text-white">{asset.team}</p>
              </div>
            )}
            {asset.environment_type && (
              <div>
                <p className="text-sm text-gray-400">Environment</p>
                <p className="font-medium text-white">{asset.environment_type}</p>
              </div>
            )}
          </div>
          {asset.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">Description</p>
              <p className="text-gray-200 mt-1">{asset.description}</p>
            </div>
          )}
          {asset.technology_stack && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">Technology Stack</p>
              <p className="text-gray-200 mt-1">{asset.technology_stack}</p>
            </div>
          )}
        </div>

        {/* Tabs - Dark Theme */}
        <div className="border-b border-white/10 glass sticky" style={{top: '76px'}}>
          <div className="flex overflow-x-auto">
            <TabButton 
              active={activeTab === 'repositories'} 
              onClick={() => setActiveTab('repositories')}
              icon={<GitBranch className="w-4 h-4" />}
              label="Repositories"
              count={repositories.length}
            />
            <TabButton 
              active={activeTab === 'documents'} 
              onClick={() => setActiveTab('documents')}
              icon={<FileText className="w-4 h-4" />}
              label="Documents"
              count={documents.length}
            />
            <TabButton 
              active={activeTab === 'servers'} 
              onClick={() => setActiveTab('servers')}
              icon={<Server className="w-4 h-4" />}
              label="Servers"
              count={servers.length}
            />
            <TabButton 
              active={activeTab === 'credentials'} 
              onClick={() => setActiveTab('credentials')}
              icon={<Key className="w-4 h-4" />}
              label="Credentials"
              count={credentials.length}
            />
            <TabButton 
              active={activeTab === 'links'} 
              onClick={() => setActiveTab('links')}
              icon={<LinkIcon className="w-4 h-4" />}
              label="Links"
              count={links.length}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Repositories Tab */}
          {activeTab === 'repositories' && (
            <TabContent
              title="Repositories"
              items={repositories}
              emptyIcon={<GitBranch className="w-12 h-12 text-gray-500 mx-auto mb-3" />}
              emptyMessage="No repositories added yet"
              onAdd={() => {
                setEditingRepository(null);
                setShowRepositoryModal(true);
              }}
              canEdit={canEdit}
              renderItem={(repo) => (
                <RepositoryItem 
                  key={repo.id} 
                  repo={repo} 
                  canEdit={canEdit}
                  onEdit={() => {
                    setEditingRepository(repo);
                    setShowRepositoryModal(true);
                  }}
                  onDelete={() => handleDeleteRepository(repo.id)}
                  copyToClipboard={copyToClipboard}
                />
              )}
            />
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <TabContent
              title="Documents"
              items={documents}
              emptyIcon={<FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />}
              emptyMessage="No documents added yet"
              onAdd={() => {
                setEditingDocument(null);
                setShowDocumentModal(true);
              }}
              canEdit={canEdit}
              renderItem={(doc) => (
                <DocumentItem 
                  key={doc.id} 
                  doc={doc} 
                  canEdit={canEdit}
                  onEdit={() => {
                    setEditingDocument(doc);
                    setShowDocumentModal(true);
                  }}
                  onDelete={() => handleDeleteDocument(doc.id)}
                  copyToClipboard={copyToClipboard}
                />
              )}
            />
          )}

          {/* Servers Tab */}
          {activeTab === 'servers' && (
            <TabContent
              title="Servers"
              items={servers}
              emptyIcon={<Server className="w-12 h-12 text-gray-500 mx-auto mb-3" />}
              emptyMessage="No servers added yet"
              onAdd={() => {
                setEditingServer(null);
                setShowServerModal(true);
              }}
              canEdit={canEdit}
              renderItem={(server) => (
                <ServerItem 
                  key={server.id} 
                  server={server} 
                  canEdit={canEdit}
                  onEdit={() => {
                    setEditingServer(server);
                    setShowServerModal(true);
                  }}
                  onDelete={() => handleDeleteServer(server.id)}
                  copyToClipboard={copyToClipboard}
                />
              )}
            />
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <TabContent
              title="Credentials"
              items={credentials}
              emptyIcon={<Key className="w-12 h-12 text-gray-500 mx-auto mb-3" />}
              emptyMessage="No credentials added yet"
              onAdd={() => {
                setEditingCredential(null);
                setShowCredentialModal(true);
              }}
              canEdit={canEdit}
              renderItem={(cred) => (
                <CredentialItem 
                  key={cred.id} 
                  cred={cred} 
                  canEdit={canEdit}
                  showPassword={showPassword}
                  onEdit={() => {
                    setEditingCredential(cred);
                    setShowCredentialModal(true);
                  }}
                  onDelete={() => handleDeleteCredential(cred.id)}
                  togglePasswordVisibility={togglePasswordVisibility}
                  copyToClipboard={copyToClipboard}
                />
              )}
            />
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <TabContent
              title="Links"
              items={links}
              emptyIcon={<LinkIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />}
              emptyMessage="No links added yet"
              onAdd={() => {
                setEditingLink(null);
                setShowLinkModal(true);
              }}
              canEdit={canEdit}
              renderItem={(link) => (
                <LinkItem 
                  key={link.id} 
                  link={link} 
                  canEdit={canEdit}
                  onEdit={() => {
                    setEditingLink(link);
                    setShowLinkModal(true);
                  }}
                  onDelete={() => handleDeleteLink(link.id)}
                  copyToClipboard={copyToClipboard}
                />
              )}
            />
          )}
        </div>
      </div>

      {/* Sub Modals */}
      {showRepositoryModal && (
        <RepositoryModal
          editing={editingRepository}
          onClose={() => {
            setShowRepositoryModal(false);
            setEditingRepository(null);
          }}
          onSave={handleSaveRepository}
        />
      )}

      {showDocumentModal && (
        <DocumentModal
          editing={editingDocument}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingDocument(null);
          }}
          onSave={handleSaveDocument}
        />
      )}

      {showServerModal && (
        <ServerModal
          editing={editingServer}
          onClose={() => {
            setShowServerModal(false);
            setEditingServer(null);
          }}
          onSave={handleSaveServer}
        />
      )}

      {showCredentialModal && (
        <CredentialModal
          editing={editingCredential}
          onClose={() => {
            setShowCredentialModal(false);
            setEditingCredential(null);
          }}
          onSave={handleSaveCredential}
        />
      )}

      {showLinkModal && (
        <LinkModal
          editing={editingLink}
          onClose={() => {
            setShowLinkModal(false);
            setEditingLink(null);
          }}
          onSave={handleSaveLink}
        />
      )}
    </div>
  );
};

// Helper Components - Dark Theme
const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-gray-400 hover:text-gray-200'
    }`}
  >
    <div className="flex items-center gap-2">
      {icon}
      {label} ({count})
    </div>
  </button>
);

const TabContent = ({ title, items, emptyIcon, emptyMessage, onAdd, canEdit, renderItem }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {canEdit && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add {title.slice(0, -1)}
        </button>
      )}
    </div>

    {items.length === 0 ? (
      <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
        {emptyIcon}
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    ) : (
      <div className="space-y-3">
        {items.map(renderItem)}
      </div>
    )}
  </div>
);

// Item Components - NO RESTRICTION
const RepositoryItem = ({ repo, canEdit, onEdit, onDelete, copyToClipboard }) => (
  <div className="glass rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium text-white">{repo.repository_name || 'Unnamed Repository'}</h4>
          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">{repo.repository_type}</span>
          {repo.is_primary && <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">Primary</span>}
          <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-300 rounded">{repo.access_level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
          <a href={repo.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate">
            {repo.repository_url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          <button onClick={() => copyToClipboard(repo.repository_url)} className="text-gray-400 hover:text-gray-200 flex-shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-gray-300">
          Branch: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{repo.branch_name}</span>
        </div>
        {repo.notes && <p className="text-sm text-gray-400 mt-2">{repo.notes}</p>}
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30"
            title="Edit Repository"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30"
            title="Delete Repository"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const DocumentItem = ({ doc, canEdit, onEdit, onDelete, copyToClipboard }) => (
  <div className="glass rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium text-white">{doc.document_title}</h4>
          <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-300 rounded border border-orange-500/30">{doc.document_type}</span>
          {doc.is_primary && <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">Primary</span>}
          {doc.file_format && <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-300 rounded font-mono">{doc.file_format}</span>}
        </div>
        {doc.description && <p className="text-sm text-gray-300 mb-2">{doc.description}</p>}
        {doc.document_url && (
          <div className="flex items-center gap-2 text-sm">
            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Open Document
              <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => copyToClipboard(doc.document_url)} className="text-gray-400 hover:text-gray-200">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30" title="Edit Document">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30" title="Delete Document">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const ServerItem = ({ server, canEdit, onEdit, onDelete, copyToClipboard }) => (
  <div className="glass rounded-lg p-4 border border-green-500/30 hover:border-green-500/50 transition-all">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium text-white">{server.server_name}</h4>
          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">{server.server_type}</span>
          <span className={`px-2 py-0.5 text-xs rounded border ${
            server.status === 'Running' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
            server.status === 'Stopped' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
          }`}>{server.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 mb-2">
          {server.ip_address && (
            <div>
              <span className="text-gray-400">IP:</span>{' '}
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{server.ip_address}</span>
            </div>
          )}
          {server.hostname && <div><span className="text-gray-400">Hostname:</span> {server.hostname}</div>}
          {server.port && <div><span className="text-gray-400">Port:</span> {server.port}</div>}
          {server.hosting_provider && <div><span className="text-gray-400">Provider:</span> {server.hosting_provider}</div>}
        </div>
        {server.url && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <a href={server.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
              {server.url}
              <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => copyToClipboard(server.url)} className="text-gray-400 hover:text-gray-200">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const CredentialItem = ({ cred, canEdit, showPassword, onEdit, onDelete, togglePasswordVisibility, copyToClipboard }) => (
  <div className="glass rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium text-white">{cred.credential_type}</h4>
          <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded border border-red-500/30">{cred.environment}</span>
          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">{cred.access_level}</span>
          {cred.is_active ? (
            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">Active</span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded">Inactive</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {cred.username && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20">Username:</span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-gray-200">{cred.username}</span>
              <button onClick={() => copyToClipboard(cred.username)} className="text-gray-400 hover:text-gray-200">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          {cred.password && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20">Password:</span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-gray-200">
                {showPassword[cred.id] ? cred.password : '••••••••'}
              </span>
              <button onClick={() => togglePasswordVisibility(cred.id)} className="text-gray-400 hover:text-gray-200">
                {showPassword[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copyToClipboard(cred.password)} className="text-gray-400 hover:text-gray-200">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
          {cred.email && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20">Email:</span>
              <span className="text-gray-200">{cred.email}</span>
              <button onClick={() => copyToClipboard(cred.email)} className="text-gray-400 hover:text-gray-200">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const LinkItem = ({ link, canEdit, onEdit, onDelete, copyToClipboard }) => (
  <div className="glass rounded-lg p-4 border border-blue-500/30 hover:border-blue-500/50 transition-all">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-medium text-white">{link.link_title}</h4>
          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">{link.link_type}</span>
          {link.is_primary && <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-500/30">Primary</span>}
        </div>
        {link.description && <p className="text-sm text-gray-300 mb-2">{link.description}</p>}
        <div className="flex items-center gap-2 text-sm">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate">
            {link.url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          <button onClick={() => copyToClipboard(link.url)} className="text-gray-400 hover:text-gray-200 flex-shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
);

export default AssetDetailModal;
