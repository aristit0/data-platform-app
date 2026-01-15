import React, { useState, useEffect } from 'react';
import { Upload, Search, Folder, File, Loader, Download, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { knowledgeBaseApi } from '../services/knowledgeBaseApi';

const KnowledgeBase = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    product: '',
    subProduct: '',
    category: '',
  });

  // NEW: Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadDocuments();
  }, [currentPath]);

  // NEW: Reset to page 1 when path or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, searchResults]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await knowledgeBaseApi.listDocuments(currentPath);
      setFolders(data.folders || []);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      alert('Gagal memuat dokumen: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

const handleSearch = async (e) => {
  e.preventDefault();
  if (!searchQuery.trim()) {
    // If search is empty, clear results
    setSearchResults([]);
    return;
  }

  setLoading(true);
  try {
    const data = await knowledgeBaseApi.searchDocuments(searchQuery);
    setSearchResults(data.documents || []);
    
    // Show message if no results
    if (!data.documents || data.documents.length === 0) {
      alert(`Tidak ada hasil untuk "${searchQuery}"`);
    }
  } catch (error) {
    console.error('Search failed:', error);
    alert('Pencarian gagal: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.product || !uploadForm.subProduct || !uploadForm.category) {
      alert('Semua field harus diisi');
      return;
    }

    // Check file size
    const fileSizeMB = uploadForm.file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
      alert(`File terlalu besar (${fileSizeMB.toFixed(2)} MB). Maksimal 100 MB.`);
      return;
    }

    setLoading(true);
    try {
      await knowledgeBaseApi.uploadDocument(
        uploadForm.file,
        uploadForm.product,
        uploadForm.subProduct,
        uploadForm.category
      );
      
      alert('File berhasil diupload! Parsing akan dilakukan secara async.');
      setUploadModal(false);
      setUploadForm({ file: null, product: '', subProduct: '', category: '' });
      loadDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload gagal: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      setLoading(true);
      await knowledgeBaseApi.downloadDocument(doc.id, doc.file_name);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.original_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await knowledgeBaseApi.deleteDocument(doc.id);
      alert('Dokumen berhasil dihapus');
      loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Gagal menghapus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      setLoading(true);
      const fullDoc = await knowledgeBaseApi.getDocument(doc.id);
      setSelectedDoc(fullDoc);
      setViewModal(true);
    } catch (error) {
      console.error('Failed to load document details:', error);
      alert('Gagal memuat detail dokumen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
    setSearchResults([]);
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const renderBreadcrumb = () => {
    if (!currentPath) return <span className="text-gray-300">Home</span>;
    
    const parts = currentPath.split('/').filter(Boolean);
    return (
      <div className="flex items-center gap-2">
        <span 
          onClick={() => setCurrentPath('')}
          className="cursor-pointer hover:text-blue-400 text-gray-300"
        >
          Home
        </span>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-gray-500">/</span>
            <span
              onClick={() => setCurrentPath(parts.slice(0, index + 1).join('/'))}
              className="cursor-pointer hover:text-blue-400 text-gray-300"
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // NEW: Pagination logic
  //const displayedDocuments = searchResults.length > 0 ? searchResults : documents;
  const displayedDocuments = searchQuery ? searchResults : documents;
  const totalPages = Math.ceil(displayedDocuments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = displayedDocuments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-3 py-2 rounded ${
              currentPage === number
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
        <button
          onClick={() => setUploadModal(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Upload size={20} />
          Upload Document
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumen, keywords, error messages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          )}
        </div>
{/* NEW: Search feedback */}
{searchQuery && (
  <div className="mt-2 text-sm">
    {searchResults.length > 0 ? (
      <span className="text-green-400">✓ Ditemukan {searchResults.length} hasil untuk "{searchQuery}"</span>
    ) : (
      <span className="text-red-400">✗ Tidak ada hasil untuk "{searchQuery}"</span>
    )}
  </div>
)}
      </form>

      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        {renderBreadcrumb()}
      </div>

      {/* Back Button */}
      {currentPath && (
        <button
          onClick={goBack}
          className="mb-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          ← Back
        </button>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-blue-500" size={48} />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-white">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map((folder, index) => (
                  <div
                    key={index}
                    onClick={() => navigateToFolder(folder.path)}
                    className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <Folder size={24} className="text-yellow-500" />
                    <span className="text-white">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-white">
                Documents ({displayedDocuments.length} total)
              </h2>
              <div className="text-sm text-gray-400">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, displayedDocuments.length)} of {displayedDocuments.length}
              </div>
            </div>

            {currentDocuments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <File size={48} className="mx-auto mb-4 opacity-50" />
                <p>Tidak ada dokumen</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {currentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-gray-800 rounded hover:bg-gray-700 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <File size={24} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{doc.original_name}</div>
                          <div className="text-sm text-gray-400">
                            {doc.product} / {doc.sub_product} / {doc.category}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: <span className={`${
                              doc.status === 'parsed' ? 'text-green-500' :
                              doc.status === 'parsing' ? 'text-yellow-500' :
                              doc.status === 'error' ? 'text-red-500' :
                              'text-gray-500'
                            }`}>{doc.status}</span>
                            {' • '}
                            {(doc.file_size / 1024).toFixed(2)} KB
                          </div>
                          {doc.parsed_text && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {doc.parsed_text.substring(0, 150)}...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <div className="text-sm text-gray-400 mr-2 hidden md:block">
                          {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
                        </div>
                        
                        {/* View Button */}
                        <button
                          onClick={() => handleViewDocument(doc)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
                          title="View Document"
                        >
                          <Eye size={16} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={loading}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1 disabled:opacity-50"
                          title="Download Document"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-1 disabled:opacity-50"
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </div>
        </>
      )}








      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.csv,.ppt,.pptx,.txt"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className="w-full bg-gray-700 text-white rounded p-2"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supported: PDF, DOCX, XLSX, CSV, PPT, PPTX, TXT
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product
                </label>
                <input
                  type="text"
                  value={uploadForm.product}
                  onChange={(e) => setUploadForm({...uploadForm, product: e.target.value})}
                  placeholder="e.g., cloudera"
                  className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub Product
                </label>
                <input
                  type="text"
                  value={uploadForm.subProduct}
                  onChange={(e) => setUploadForm({...uploadForm, subProduct: e.target.value})}
                  placeholder="e.g., cdp"
                  className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                  placeholder="e.g., services"
                  className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadModal(false);
                    setUploadForm({ file: null, product: '', subProduct: '', category: '' });
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">{selectedDoc.original_name}</h2>
              <button
                onClick={() => {
                  setViewModal(false);
                  setSelectedDoc(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Metadata */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Metadata</h3>
                <div className="bg-gray-700 p-4 rounded space-y-2">
                  <p className="text-gray-300"><strong>Product:</strong> {selectedDoc.product}</p>
                  <p className="text-gray-300"><strong>Sub Product:</strong> {selectedDoc.sub_product}</p>
                  <p className="text-gray-300"><strong>Category:</strong> {selectedDoc.category}</p>
                  <p className="text-gray-300"><strong>File Type:</strong> {selectedDoc.file_type}</p>
                  <p className="text-gray-300"><strong>File Size:</strong> {(selectedDoc.file_size / 1024).toFixed(2)} KB</p>
                  <p className="text-gray-300"><strong>Uploaded:</strong> {new Date(selectedDoc.uploaded_at).toLocaleString('id-ID')}</p>
                  <p className="text-gray-300">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      selectedDoc.status === 'parsed' ? 'bg-green-600' :
                      selectedDoc.status === 'parsing' ? 'bg-yellow-600' :
                      selectedDoc.status === 'error' ? 'bg-red-600' :
                      'bg-gray-600'
                    }`}>
                      {selectedDoc.status}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Parsed Content */}
              {selectedDoc.parsed_text && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Content</h3>
                  <div className="bg-gray-700 p-4 rounded max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                      {selectedDoc.parsed_text}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Keywords */}
              {selectedDoc.keywords && selectedDoc.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Error Messages */}
              {selectedDoc.error_messages && selectedDoc.error_messages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Error Messages Found</h3>
                  <div className="space-y-2">
                    {selectedDoc.error_messages.map((error, idx) => (
                      <div key={idx} className="bg-red-900 bg-opacity-30 p-3 rounded text-red-300 text-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={() => {
                    setViewModal(false);
                    handleDelete(selectedDoc);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
