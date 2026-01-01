// ========================================
// COPY KODE INI DAN PASTE KE index.html 
// SEBELUM "// Main App Component"
// ========================================

// PROJECTS COMPONENT (Fitur #4 - dengan pagination)
const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [yearFilter, setYearFilter] = useState('2025');
    const [quarterFilter, setQuarterFilter] = useState('');
    const { user } = useAuth();
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        type: 'Implementasi',
        client: '',
        project_name: '',
        duration: '',
        end_date: '',
        status: 'On Progress',
        quarter: 'Q1',
        year: '2025',
    });

    useEffect(() => {
        loadProjects();
    }, [yearFilter, quarterFilter]);

    const loadProjects = async () => {
        try {
            const params = { year: yearFilter };
            if (quarterFilter) params.quarter = quarterFilter;
            const response = await api.projects.getAll(params);
            setProjects(response.data);
        } catch (err) {
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.projects.update(editing.project_id, formData);
            } else {
                await api.projects.create(formData);
            }
            setShowModal(false);
            resetForm();
            loadProjects();
        } catch (err) {
            alert('Failed to save project');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.projects.delete(id);
                loadProjects();
            } catch (err) {
                alert('Failed to delete project');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'Implementasi',
            client: '',
            project_name: '',
            duration: '',
            end_date: '',
            status: 'On Progress',
            quarter: 'Q1',
            year: '2025',
        });
        setEditing(null);
    };

    const handleEdit = (project) => {
        setEditing(project);
        setFormData(project);
        setShowModal(true);
    };

    // Pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = projects.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(projects.length / itemsPerPage);

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

    return (
        <div>
            <div className="header">
                <h2>Projects</h2>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Project
                    </button>
                )}
            </div>

            <div className="filters">
                <div className="filter-item">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
                <div className="filter-item">
                    <label className="form-label">Quarter</label>
                    <select className="form-select" value={quarterFilter} onChange={(e) => setQuarterFilter(e.target.value)}>
                        <option value="">All Quarters</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Client</th>
                                <th>Project Name</th>
                                <th>Duration</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Quarter</th>
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((proj) => (
                                <tr key={proj.project_id}>
                                    <td>{proj.type}</td>
                                    <td>{proj.client}</td>
                                    <td>{proj.project_name}</td>
                                    <td>{proj.duration}</td>
                                    <td>{proj.end_date}</td>
                                    <td><span className={`badge badge-${proj.status === 'On Progress' ? 'success' : 'info'}`}>{proj.status}</span></td>
                                    <td>{proj.quarter} {proj.year}</td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(proj)}>Edit</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(proj.project_id)}>Delete</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span className="page-info">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Edit Project' : 'Add Project'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                    <option value="Implementasi">Implementasi</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Client</label>
                                <input className="form-input" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input className="form-input" value={formData.project_name} onChange={(e) => setFormData({...formData, project_name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration</label>
                                <input className="form-input" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                    <option value="On Progress">On Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quarter</label>
                                <select className="form-select" value={formData.quarter} onChange={(e) => setFormData({...formData, quarter: e.target.value})}>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <input type="number" className="form-input" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// OPPORTUNITIES COMPONENT (Fitur #6)
const Opportunities = () => {
    const [opptys, setOpptys] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        type: 'Oppty',
        client: '',
        project_name: '',
        progress: '',
        actual_status: 'Open',
        quarter: 'Q1',
        year: '2025',
    });

    useEffect(() => {
        loadOpportunities();
    }, [statusFilter]);

    const loadOpportunities = async () => {
        try {
            const params = {};
            if (statusFilter) params.actual_status = statusFilter;
            const response = await api.opportunities.getAll(params);
            setOpptys(response.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.opportunities.update(editing.oppty_id, formData);
            } else {
                await api.opportunities.create(formData);
            }
            setShowModal(false);
            resetForm();
            loadOpportunities();
        } catch (err) {
            alert('Failed to save opportunity');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.opportunities.delete(id);
                loadOpportunities();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'Oppty',
            client: '',
            project_name: '',
            progress: '',
            actual_status: 'Open',
            quarter: 'Q1',
            year: '2025',
        });
        setEditing(null);
    };

    const handleEdit = (oppty) => {
        setEditing(oppty);
        setFormData(oppty);
        setShowModal(true);
    };

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

    return (
        <div>
            <div className="header">
                <h2>Opportunities</h2>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Opportunity
                    </button>
                )}
            </div>

            <div className="filters">
                <div className="filter-item">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Lose">Lose</option>
                        <option value="Drop">Drop</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Project Name</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Quarter</th>
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {opptys.map((opp) => (
                                <tr key={opp.oppty_id}>
                                    <td>{opp.client}</td>
                                    <td>{opp.project_name}</td>
                                    <td>{opp.progress}</td>
                                    <td>
                                        <span className={`badge badge-${
                                            opp.actual_status === 'Open' ? 'success' : 
                                            opp.actual_status === 'Lose' ? 'danger' : 'warning'
                                        }`}>
                                            {opp.actual_status}
                                        </span>
                                    </td>
                                    <td>{opp.quarter} {opp.year}</td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(opp)}>Edit</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(opp.oppty_id)}>Delete</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Edit Opportunity' : 'Add Opportunity'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Client</label>
                                <input className="form-input" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input className="form-input" value={formData.project_name} onChange={(e) => setFormData({...formData, project_name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Progress</label>
                                <input className="form-input" value={formData.progress} onChange={(e) => setFormData({...formData, progress: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={formData.actual_status} onChange={(e) => setFormData({...formData, actual_status: e.target.value})}>
                                    <option value="Open">Open</option>
                                    <option value="Lose">Lose</option>
                                    <option value="Drop">Drop</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quarter</label>
                                <select className="form-select" value={formData.quarter} onChange={(e) => setFormData({...formData, quarter: e.target.value})}>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <input type="number" className="form-input" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
