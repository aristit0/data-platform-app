const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/* =========================================================
 * ASSET ENVIRONMENTS (GLOBAL)
 * ========================================================= */

/**
 * GET /api/assets
 * List assets with sub counts (TiDB safe)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { asset_type, status } = req.query;

    let sql = `
      SELECT
        ae.id,
        ae.asset_name,
        ae.asset_type,
        ae.category,
        ae.description,
        ae.version,
        ae.status,
        ae.technology_stack,
        ae.team,
        ae.environment_type,
        ae.tags,
        ae.notes,
        ae.is_public,
        ae.expiry_date,
        ae.created_at,

        (SELECT COUNT(*) FROM asset_repositories r WHERE r.asset_id = ae.id) AS repository_count,
        (SELECT COUNT(*) FROM asset_documents d WHERE d.asset_id = ae.id) AS document_count,
        (SELECT COUNT(*) FROM asset_servers s WHERE s.asset_id = ae.id) AS server_count,
        (SELECT COUNT(*) FROM asset_credentials c WHERE c.asset_id = ae.id) AS credential_count,
        (SELECT COUNT(*) FROM asset_links l WHERE l.asset_id = ae.id) AS link_count

      FROM asset_environments ae
      WHERE 1=1
    `;

    const params = [];

    if (asset_type) {
      sql += ' AND ae.asset_type = ?';
      params.push(asset_type);
    }

    if (status) {
      sql += ' AND ae.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ae.created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[GET /assets]', err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/assets/:assetId
 * Asset detail + all relations
 */
router.get('/:assetId', authMiddleware, async (req, res) => {
  try {
    const assetId = req.params.assetId;

    const [[asset]] = await db.query(
      'SELECT * FROM asset_environments WHERE id = ?',
      [assetId]
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const [repositories] = await db.query(
      'SELECT * FROM asset_repositories WHERE asset_id = ? ORDER BY is_primary DESC',
      [assetId]
    );

    const [documents] = await db.query(
      'SELECT * FROM asset_documents WHERE asset_id = ? ORDER BY is_primary DESC',
      [assetId]
    );

    const [servers] = await db.query(
      'SELECT * FROM asset_servers WHERE asset_id = ? ORDER BY server_type',
      [assetId]
    );

    const [credentials] = await db.query(
      'SELECT * FROM asset_credentials WHERE asset_id = ? ORDER BY credential_type',
      [assetId]
    );

    const [links] = await db.query(
      'SELECT * FROM asset_links WHERE asset_id = ? ORDER BY is_primary DESC',
      [assetId]
    );

    res.json({
      ...asset,
      repositories,
      documents,
      servers,
      credentials,
      links
    });
  } catch (err) {
    console.error('[GET /assets/:id]', err);
    res.status(500).json({ error: 'Failed to fetch asset detail' });
  }
});

/**
 * POST /api/assets
 * Create asset
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      asset_name,
      asset_type,
      category,
      description,
      version,
      status,
      technology_stack,
      team,
      environment_type,
      tags,
      notes,
      is_public,
      expiry_date
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO asset_environments
      (asset_name, asset_type, category, description, version, status,
       technology_stack, team, environment_type, tags, notes,
       is_public, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_name,
        asset_type,
        category,
        description,
        version,
        status,
        technology_stack,
        team,
        environment_type,
        tags,
        notes,
        is_public,
        expiry_date
      ]
    );

    res.status(201).json({
      message: 'Asset created',
      asset_id: result.insertId
    });
  } catch (err) {
    console.error('[POST /assets]', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

/**
 * PUT /api/assets/:assetId
 * Update asset
 */
router.put('/:assetId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const assetId = req.params.assetId;

    const {
      asset_name,
      asset_type,
      category,
      description,
      version,
      status,
      technology_stack,
      team,
      environment_type,
      tags,
      notes,
      is_public,
      expiry_date
    } = req.body;

    await db.query(
      `UPDATE asset_environments
       SET asset_name = ?, asset_type = ?, category = ?, description = ?,
           version = ?, status = ?, technology_stack = ?, team = ?,
           environment_type = ?, tags = ?, notes = ?, is_public = ?, expiry_date = ?
       WHERE id = ?`,
      [
        asset_name,
        asset_type,
        category,
        description,
        version,
        status,
        technology_stack,
        team,
        environment_type,
        tags,
        notes,
        is_public,
        expiry_date,
        assetId
      ]
    );

    res.json({ message: 'Asset updated' });
  } catch (err) {
    console.error('[PUT /assets/:id]', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

/**
 * DELETE /api/assets/:assetId
 * Delete asset (CASCADE handled by FK)
 */
router.delete('/:assetId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM asset_environments WHERE id = ?',
      [req.params.assetId]
    );
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    console.error('[DELETE /assets/:id]', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

/* =========================================================
 * SUB-RESOURCES (CRUD)
 * ========================================================= */

/**
 * GENERIC HELPERS
 */
const simpleInsert = async (res, sql, params, message) => {
  const [r] = await db.query(sql, params);
  res.status(201).json({ message, id: r.insertId });
};

/* ---------- REPOSITORIES ---------- */
router.post('/:assetId/repositories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { repository_type, repository_url, repository_name, branch_name, is_primary, access_level, notes } = req.body;
    await simpleInsert(
      res,
      `INSERT INTO asset_repositories
       (asset_id, repository_type, repository_url, repository_name, branch_name, is_primary, access_level, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.assetId,
        repository_type,
        repository_url,
        repository_name,
        branch_name || 'main',
        !!is_primary,
        access_level,
        notes
      ],
      'Repository created'
    );
  } catch (e) {
    console.error('[POST repo]', e);
    res.status(500).json({ error: 'Failed to add repository' });
  }
});

router.put('/repositories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { repository_type, repository_url, repository_name, branch_name, is_primary, access_level, notes } = req.body;
    await db.query(
      `UPDATE asset_repositories
       SET repository_type=?, repository_url=?, repository_name=?, branch_name=?,
           is_primary=?, access_level=?, notes=?
       WHERE id=?`,
      [repository_type, repository_url, repository_name, branch_name, is_primary, access_level, notes, req.params.id]
    );
    res.json({ message: 'Repository updated' });
  } catch (e) {
    console.error('[PUT repo]', e);
    res.status(500).json({ error: 'Failed to update repository' });
  }
});

router.delete('/repositories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM asset_repositories WHERE id=?', [req.params.id]);
    res.json({ message: 'Repository deleted' });
  } catch (e) {
    console.error('[DELETE repo]', e);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

/* ---------- DOCUMENTS ---------- */
router.post('/:assetId/documents', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[POST document] Request body:', req.body);
    console.log('[POST document] Asset ID:', req.params.assetId);
    
    const { document_title, document_type, document_url, file_format, is_primary, description } = req.body;
    
    // Validate required fields
    if (!document_title || !document_url) {
      console.error('[POST document] Missing required fields');
      return res.status(400).json({ error: 'Document title and URL are required' });
    }
    
    await simpleInsert(
      res,
      `INSERT INTO asset_documents
       (asset_id, document_title, document_type, document_url, file_format, is_primary, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.assetId, 
        document_title, 
        document_type || 'Technical Documentation', 
        document_url, 
        file_format || null, 
        !!is_primary, 
        description || null
      ],
      'Document created'
    );
  } catch (e) {
    console.error('[POST document] Error:', e);
    res.status(500).json({ error: 'Failed to add document', details: e.message });
  }
});

router.put('/documents/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[PUT document] Request body:', req.body);
    console.log('[PUT document] Document ID:', req.params.id);
    
    const { document_title, document_type, document_url, file_format, is_primary, description } = req.body;
    
    await db.query(
      `UPDATE asset_documents
       SET document_title=?, document_type=?, document_url=?, file_format=?, is_primary=?, description=?
       WHERE id=?`,
      [document_title, document_type, document_url, file_format, is_primary, description, req.params.id]
    );
    res.json({ message: 'Document updated' });
  } catch (e) {
    console.error('[PUT document] Error:', e);
    res.status(500).json({ error: 'Failed to update document', details: e.message });
  }
});

router.delete('/documents/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[DELETE document] Document ID:', req.params.id);
    
    await db.query('DELETE FROM asset_documents WHERE id=?', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (e) {
    console.error('[DELETE document] Error:', e);
    res.status(500).json({ error: 'Failed to delete document', details: e.message });
  }
});

/* ---------- SERVERS ---------- */
router.post('/:assetId/servers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { server_name, server_type, ip_address, hostname, port, url, hosting_provider, region, specifications, status, notes } = req.body;
    await simpleInsert(
      res,
      `INSERT INTO asset_servers
       (asset_id, server_name, server_type, ip_address, hostname, port, url,
        hosting_provider, region, specifications, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.assetId,
        server_name,
        server_type,
        ip_address,
        hostname,
        port,
        url,
        hosting_provider,
        region,
        specifications,
        status,
        notes
      ],
      'Server created'
    );
  } catch (e) {
    console.error('[POST server]', e);
    res.status(500).json({ error: 'Failed to add server' });
  }
});

router.put('/servers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { server_name, server_type, ip_address, hostname, port, url, hosting_provider, region, specifications, status, notes } = req.body;
    await db.query(
      `UPDATE asset_servers
       SET server_name=?, server_type=?, ip_address=?, hostname=?, port=?, url=?,
           hosting_provider=?, region=?, specifications=?, status=?, notes=?
       WHERE id=?`,
      [server_name, server_type, ip_address, hostname, port, url, hosting_provider, region, specifications, status, notes, req.params.id]
    );
    res.json({ message: 'Server updated' });
  } catch (e) {
    console.error('[PUT server]', e);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

router.delete('/servers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM asset_servers WHERE id=?', [req.params.id]);
    res.json({ message: 'Server deleted' });
  } catch (e) {
    console.error('[DELETE server]', e);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

/* ---------- CREDENTIALS (FIXED!) ---------- */
router.post('/:assetId/credentials', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[POST credential] Request body:', req.body);
    console.log('[POST credential] Asset ID:', req.params.assetId);
    
    const { 
      credential_type, 
      username, 
      password, 
      email, 
      access_level, 
      environment, 
      description, 
      expiry_date, 
      is_active, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!credential_type || !environment) {
      console.error('[POST credential] Missing required fields');
      return res.status(400).json({ error: 'Credential type and environment are required' });
    }
    
    await simpleInsert(
      res,
      `INSERT INTO asset_credentials
       (asset_id, credential_type, username, password, email, access_level,
        environment, description, expiry_date, is_active, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.assetId,
        credential_type,
        username || null,
        password || null,
        email || null,
        access_level || 'Full',
        environment,
        description || null,
        expiry_date || null,
        is_active !== false,
        notes || null
      ],
      'Credential created'
    );
    console.log('[POST credential] Success');
  } catch (e) {
    console.error('[POST credential] Error:', e);
    console.error('[POST credential] Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to add credential', details: e.message });
  }
});

router.put('/credentials/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[PUT credential] Request body:', req.body);
    console.log('[PUT credential] Credential ID:', req.params.id);
    
    const { 
      credential_type, 
      username, 
      password, 
      email, 
      access_level, 
      environment, 
      description, 
      expiry_date, 
      is_active, 
      notes 
    } = req.body;
    
    await db.query(
      `UPDATE asset_credentials
       SET credential_type=?, username=?, password=?, email=?, access_level=?,
           environment=?, description=?, expiry_date=?, is_active=?, notes=?
       WHERE id=?`,
      [
        credential_type, 
        username || null, 
        password || null, 
        email || null, 
        access_level, 
        environment, 
        description || null, 
        expiry_date || null, 
        is_active, 
        notes || null, 
        req.params.id
      ]
    );
    res.json({ message: 'Credential updated' });
    console.log('[PUT credential] Success');
  } catch (e) {
    console.error('[PUT credential] Error:', e);
    console.error('[PUT credential] Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to update credential', details: e.message });
  }
});

router.delete('/credentials/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('[DELETE credential] Credential ID:', req.params.id);
    
    await db.query('DELETE FROM asset_credentials WHERE id=?', [req.params.id]);
    res.json({ message: 'Credential deleted' });
    console.log('[DELETE credential] Success');
  } catch (e) {
    console.error('[DELETE credential] Error:', e);
    console.error('[DELETE credential] Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to delete credential', details: e.message });
  }
});

/* ---------- LINKS ---------- */
router.post('/:assetId/links', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { link_title, link_type, url, description, is_primary } = req.body;
    await simpleInsert(
      res,
      `INSERT INTO asset_links
       (asset_id, link_title, link_type, url, description, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.assetId, link_title, link_type, url, description, !!is_primary],
      'Link created'
    );
  } catch (e) {
    console.error('[POST link]', e);
    res.status(500).json({ error: 'Failed to add link' });
  }
});

router.put('/links/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { link_title, link_type, url, description, is_primary } = req.body;
    await db.query(
      `UPDATE asset_links
       SET link_title=?, link_type=?, url=?, description=?, is_primary=?
       WHERE id=?`,
      [link_title, link_type, url, description, is_primary, req.params.id]
    );
    res.json({ message: 'Link updated' });
  } catch (e) {
    console.error('[PUT link]', e);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

router.delete('/links/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM asset_links WHERE id=?', [req.params.id]);
    res.json({ message: 'Link deleted' });
  } catch (e) {
    console.error('[DELETE link]', e);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

module.exports = router;
