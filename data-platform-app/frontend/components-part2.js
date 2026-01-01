// ========================================
// LANJUTAN - COPY KODE INI JUGA
// ========================================

// CERTIFICATIONS COMPONENT (Fitur #2 - dengan tabs)
const Certifications = () => {
    const [certs, setCerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list'); // list, expiring, plans
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        planning_year: '2025',
        planning_quarter: 'Q1',
        name: '',
        certification: '',
        schedule_1: '',
        result_1: '',
        schedule_2: '',
        result_2: '',
        schedule_3: '',
        result_3: '',
        status_final: 'On Progress',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [certsRes, statsRes] = await Promise.all([
                api.certifications.getAll(),
                api.certifications.getStats({ year: new Date().getFullYear() }),
            ]);
            setCerts(certsRes.data);
            setStats(statsRes.data);
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
                await api.certifications.update(editing.plan_id, formData);
            } else {
                await api.certifications.create(formData);
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            alert('Failed to save');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.certifications.delete(id);
                loadData();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            planning_year: '2025',
            planning_quarter: 'Q1',
            name: '',
            certification: '',
            schedule_1: '',
            result_1: '',
            schedule_2: '',
            result_2: '',
            schedule_3: '',
            result_3: '',
            status_final: 'On Progress',
        });
        setEditing(null);
    };

    const handleEdit = (cert) => {
        setEditing(cert);
        setFormData(cert);
        setShowModal(true);
    };

    const expiringCerts = stats?.expiring || [];
    const currentYear = new Date().getFullYear();

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

    return (
        <div>
            <div className="header">
                <h2>Certifications</h2>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Certification
                    </button>
                )}
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                    All Certifications
                </button>
                <button className={`tab ${activeTab === 'expiring' ? 'active' : ''}`} onClick={() => setActiveTab('expiring')}>
                    Expiring This Year ({expiringCerts.length})
                </button>
                <button className={`tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
                    Plans
                </button>
            </div>

            {activeTab === 'list' && (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Certification</th>
                                    <th>Year/Quarter</th>
                                    <th>Schedule 1</th>
                                    <th>Result 1</th>
                                    <th>Status</th>
                                    {user?.role === 'admin' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {certs.map((cert) => (
                                    <tr key={cert.plan_id}>
                                        <td>{cert.name}</td>
                                        <td>{cert.certification}</td>
                                        <td>{cert.planning_year} {cert.planning_quarter}</td>
                                        <td>{cert.schedule_1}</td>
                                        <td>
                                            {cert.result_1 && (
                                                <span className={`badge badge-${cert.result_1 === 'PASS' || cert.result_1 === 'Pass' ? 'success' : 'danger'}`}>
                                                    {cert.result_1}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${cert.status_final === 'On Progress' ? 'info' : 'success'}`}>
                                                {cert.status_final}
                                            </span>
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(cert)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cert.plan_id)}>Delete</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'expiring' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Certifications Expiring in {currentYear}</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Certification</th>
                                    <th>Last Pass Date</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringCerts.map((cert, idx) => {
                                    const lastPass = cert.result_3 === 'PASS' || cert.result_3 === 'Pass' ? cert.schedule_3 :
                                                    cert.result_2 === 'PASS' || cert.result_2 === 'Pass' ? cert.schedule_2 :
                                                    cert.schedule_1;
                                    return (
                                        <tr key={idx}>
                                            <td>{cert.name}</td>
                                            <td>{cert.certification}</td>
                                            <td>{lastPass}</td>
                                            <td><span className="badge badge-warning">May Expire</span></td>
                                        </tr>
                                    );
                                })}
                                {expiringCerts.length === 0 && (
                                    <tr><td colSpan="4" style={{textAlign: 'center'}}>No expiring certifications</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'plans' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Certification Plans</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Certification</th>
                                    <th>Planned Quarter</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certs.filter(c => c.status_final === 'On Progress').map((cert) => (
                                    <tr key={cert.plan_id}>
                                        <td>{cert.name}</td>
                                        <td>{cert.certification}</td>
                                        <td>{cert.planning_year} {cert.planning_quarter}</td>
                                        <td><span className="badge badge-info">Planned</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Edit Certification' : 'Add Certification'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Certification</label>
                                <input className="form-input" value={formData.certification} onChange={(e) => setFormData({...formData, certification: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Planning Year</label>
                                <input type="number" className="form-input" value={formData.planning_year} onChange={(e) => setFormData({...formData, planning_year: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Planning Quarter</label>
                                <select className="form-select" value={formData.planning_quarter} onChange={(e) => setFormData({...formData, planning_quarter: e.target.value})}>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Schedule 1</label>
                                <input type="date" className="form-input" value={formData.schedule_1} onChange={(e) => setFormData({...formData, schedule_1: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Result 1</label>
                                <input className="form-input" value={formData.result_1} onChange={(e) => setFormData({...formData, result_1: e.target.value})} placeholder="PASS, Fail, etc" />
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

// PRODUCT ASSIGNMENT COMPONENT (Fitur #3)
const ProductAssignment = () => {
    const [assignments, setAssignments] = useState([]);
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        employee_id: '',
        product_id: '',
        assignment_type: '',
        level: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [assignRes, prodRes, empRes] = await Promise.all([
                api.productAssignments.getAll(),
                api.productAssignments.getProducts(),
                api.employees.getAll(),
            ]);
            setAssignments(assignRes.data);
            setProducts(prodRes.data);
            setEmployees(empRes.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.productAssignments.create(formData);
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            alert('Failed to save');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.productAssignments.delete(id);
                loadData();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            employee_id: '',
            product_id: '',
            assignment_type: '',
            level: '',
        });
    };

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

    return (
        <div>
            <div className="header">
                <h2>Product Assignment</h2>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Assignment
                    </button>
                )}
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Product</th>
                                <th>Assignment Type</th>
                                <th>Level</th>
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.full_name || a.employee_id}</td>
                                    <td>{a.product_name}</td>
                                    <td>{a.assignment_type || '-'}</td>
                                    <td>{a.level || '-'}</td>
                                    {user?.role === 'admin' && (
                                        <td>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Delete</button>
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
                            <h3 className="modal-title">Add Product Assignment</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Employee</label>
                                <select className="form-select" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} required>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Product</label>
                                <select className="form-select" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required>
                                    <option value="">Select Product</option>
                                    {products.map(prod => (
                                        <option key={prod.product_id} value={prod.product_id}>{prod.product_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Assignment Type</label>
                                <input className="form-input" value={formData.assignment_type} onChange={(e) => setFormData({...formData, assignment_type: e.target.value})} placeholder="e.g., Primary, Secondary" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Level</label>
                                <input className="form-input" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} placeholder="e.g., Expert, Intermediate" />
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

// MINI POCs COMPONENT (Fitur #7)
const MiniPOCs = () => {
    const [pocs, setPocs] = useState([]);
    const [selectedPoc, setSelectedPoc] = useState(null);
    const [pocDetail, setPocDetail] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        poc_code: '',
        use_case: '',
        start_date: '',
        end_date: '',
        status: 'On Progress',
        winner_team: '',
        second_team: '',
        third_team: '',
    });

    useEffect(() => {
        loadPOCs();
    }, []);

    const loadPOCs = async () => {
        try {
            const response = await api.miniPocs.getAll();
            setPocs(response.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.miniPocs.create(formData);
            setShowModal(false);
            resetForm();
            loadPOCs();
        } catch (err) {
            alert('Failed to save');
        }
    };

    const handleDelete = async (code) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.miniPocs.delete(code);
                loadPOCs();
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const viewDetail = async (poc) => {
        try {
            const response = await api.miniPocs.getByCode(poc.poc_code);
            setPocDetail(response.data);
            setSelectedPoc(poc);
            setShowDetailModal(true);
        } catch (err) {
            alert('Failed to load details');
        }
    };

    const resetForm = () => {
        setFormData({
            poc_code: '',
            use_case: '',
            start_date: '',
            end_date: '',
            status: 'On Progress',
            winner_team: '',
            second_team: '',
            third_team: '',
        });
    };

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading...</p></div>;

    return (
        <div>
            <div className="header">
                <h2>Mini POCs</h2>
                {user?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Mini POC
                    </button>
                )}
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>POC Code</th>
                                <th>Use Case</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Winner</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pocs.map((poc) => (
                                <tr key={poc.poc_id}>
                                    <td>{poc.poc_code}</td>
                                    <td>{poc.use_case}</td>
                                    <td>{poc.start_date}</td>
                                    <td>{poc.end_date}</td>
                                    <td>
                                        <span className={`badge badge-${poc.status === 'Done' ? 'success' : 'info'}`}>
                                            {poc.status}
                                        </span>
                                    </td>
                                    <td>{poc.winner_team || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-sm btn-secondary" onClick={() => viewDetail(poc)}>View Detail</button>
                                            {user?.role === 'admin' && (
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(poc.poc_code)}>Delete</button>
                                            )}
                                        </div>
                                    </td>
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
                            <h3 className="modal-title">Add Mini POC</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">POC Code</label>
                                <input className="form-input" value={formData.poc_code} onChange={(e) => setFormData({...formData, poc_code: e.target.value})} required placeholder="e.g., Mini-POC-1" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Use Case</label>
                                <input className="form-input" value={formData.use_case} onChange={(e) => setFormData({...formData, use_case: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                    <option value="On Progress">On Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && pocDetail && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Mini POC Detail: {selectedPoc.poc_code}</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>
                        <div>
                            <p><strong>Use Case:</strong> {pocDetail.poc.use_case}</p>
                            <p><strong>Period:</strong> {pocDetail.poc.start_date} to {pocDetail.poc.end_date}</p>
                            <p><strong>Status:</strong> {pocDetail.poc.status}</p>
                            
                            {pocDetail.poc.winner_team && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                    <h4 style={{ color: '#6ee7b7', marginBottom: '0.5rem' }}>🏆 Winner: {pocDetail.poc.winner_team}</h4>
                                    {pocDetail.poc.second_team && <p>🥈 2nd Place: {pocDetail.poc.second_team}</p>}
                                    {pocDetail.poc.third_team && <p>🥉 3rd Place: {pocDetail.poc.third_team}</p>}
                                </div>
                            )}
                            
                            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Team Members:</h4>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Team</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pocDetail.teams.map((member, idx) => (
                                            <tr key={idx}>
                                                <td><span className={`badge badge-${
                                                    member.team_name === pocDetail.poc.winner_team ? 'success' : 'info'
                                                }`}>{member.team_name}</span></td>
                                                <td>{member.full_name || member.name}</td>
                                                <td>{member.role_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ========================================
// TERAKHIR: UPDATE renderPage() di App Component dengan menambahkan case ini:
// ========================================
/*
const renderPage = () => {
    switch (currentPage) {
        case 'dashboard':
            return <Dashboard />;
        case 'employees':
            return <Employees />;
        case 'users':
            return <UserManagement />;
        case 'projects':
            return <Projects />;
        case 'opportunities':
            return <Opportunities />;
        case 'certifications':
            return <Certifications />;
        case 'products':
            return <ProductAssignment />;
        case 'mini-pocs':
            return <MiniPOCs />;
        default:
            return <Dashboard />;
    }
};
*/
