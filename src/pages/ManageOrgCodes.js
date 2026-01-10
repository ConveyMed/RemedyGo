import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const KeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ManageOrgCodes = () => {
  const navigate = useNavigate();
  const { organizations } = useAuth();
  const [orgCodes, setOrgCodes] = useState({});
  const [editingOrg, setEditingOrg] = useState(null);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCodes, setShowCodes] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchOrgCodes();
  }, []);

  const fetchOrgCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, code, invite_code')
        .eq('is_active', true);

      if (error) throw error;

      const codes = {};
      data.forEach(org => {
        codes[org.id] = org.invite_code || '';
      });
      setOrgCodes(codes);
    } catch (err) {
      console.error('Error fetching org codes:', err);
      setError('Failed to load organization codes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (orgId) => {
    setEditingOrg(orgId);
    setNewCode(orgCodes[orgId] || '');
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (orgId) => {
    if (!newCode.trim()) {
      setError('Code cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ invite_code: newCode.trim() })
        .eq('id', orgId);

      if (error) throw error;

      setOrgCodes(prev => ({ ...prev, [orgId]: newCode.trim() }));
      setEditingOrg(null);
      setNewCode('');
      setSuccess('Code updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving code:', err);
      setError('Failed to save code');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingOrg(null);
    setNewCode('');
    setError(null);
  };

  const toggleShowCode = (orgId) => {
    setShowCodes(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  const copyToClipboard = async (orgId, code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(orgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/profile')}>
          <BackIcon />
        </button>
        <h1 style={styles.headerTitle}>Organization Codes</h1>
        <div style={{ width: 40 }} />
      </header>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <KeyIcon />
          <p style={styles.infoText}>
            Set access codes for each organization. New users enter this code during onboarding to join the correct team.
          </p>
        </div>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {success && (
          <div style={styles.successBox}>{success}</div>
        )}

        <div style={styles.orgList}>
          {organizations.map(org => (
            <div key={org.id} style={styles.orgCard}>
              <div style={styles.orgHeader}>
                <span style={{
                  ...styles.orgBadge,
                  backgroundColor: org.code === 'AM' ? '#dbeafe' : '#fce7f3',
                  color: org.code === 'AM' ? '#1d4ed8' : '#be185d'
                }}>
                  {org.code}
                </span>
                <span style={styles.orgName}>{org.name}</span>
              </div>

              {editingOrg === org.id ? (
                <div style={styles.editSection}>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Enter new code"
                    style={styles.input}
                    autoFocus
                  />
                  <div style={styles.editActions}>
                    <button
                      style={styles.cancelBtn}
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      style={styles.saveBtn}
                      onClick={() => handleSave(org.id)}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.codeSection}>
                  <div style={styles.codeDisplay}>
                    <span style={styles.codeLabel}>Access Code:</span>
                    <span style={styles.codeValue}>
                      {showCodes[org.id] ? (orgCodes[org.id] || 'Not set') : '********'}
                    </span>
                  </div>
                  <div style={styles.codeActions}>
                    <button
                      style={styles.iconBtn}
                      onClick={() => toggleShowCode(org.id)}
                      title={showCodes[org.id] ? 'Hide' : 'Show'}
                    >
                      {showCodes[org.id] ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {orgCodes[org.id] && (
                      <button
                        style={styles.iconBtn}
                        onClick={() => copyToClipboard(org.id, orgCodes[org.id])}
                        title="Copy"
                      >
                        {copiedId === org.id ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    )}
                    <button
                      style={styles.editBtn}
                      onClick={() => handleEdit(org.id)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ height: '100px' }} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--background-off-white)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--primary-blue)',
    borderRadius: '10px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-dark)',
    margin: 0,
  },
  content: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    color: 'var(--primary-blue)',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#dc2626',
    fontSize: '14px',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#16a34a',
    fontSize: '14px',
  },
  orgList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  orgHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  orgBadge: {
    fontSize: '14px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  orgName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-dark)',
  },
  codeSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--background-off-white)',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  codeDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  codeLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  codeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-dark)',
    fontFamily: 'monospace',
  },
  codeActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  editBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--primary-blue)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  editSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid var(--primary-blue)',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  editActions: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'var(--bg-light)',
    color: 'var(--text-muted)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'var(--primary-blue)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ManageOrgCodes;
