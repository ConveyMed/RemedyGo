import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const OrganizationOnboarding = () => {
  const { user, refreshUserProfile, logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your organization code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the verify function
      const { data, error: rpcError } = await supabase.rpc('verify_invite_code', {
        p_user_id: user.id,
        p_invite_code: code.trim()
      });

      if (rpcError) throw rpcError;

      if (data?.success) {
        setSuccess(true);
        // Refresh user profile to get new org assignment
        setTimeout(async () => {
          await refreshUserProfile();
        }, 1500);
      } else {
        setError(data?.error || 'Invalid organization code');
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>
            <CheckIcon />
          </div>
          <h1 style={styles.successTitle}>Welcome!</h1>
          <p style={styles.successText}>
            You've been added to your organization. Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <LockIcon />
        </div>

        <h1 style={styles.title}>Organization Access</h1>
        <p style={styles.subtitle}>
          Enter the organization code provided by your administrator to continue.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Organization Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code"
              style={styles.input}
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <div style={styles.helpSection}>
          <p style={styles.helpText}>
            Don't have a code? Contact your administrator.
          </p>
          <button style={styles.logoutBtn} onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--background-off-white)',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '40px 30px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--background-off-white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: 'var(--primary-blue)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-dark)',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    margin: '0 0 32px 0',
  },
  form: {
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px',
    color: '#dc2626',
    fontSize: '14px',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--primary-blue)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  helpSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  helpText: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: '0 0 16px 0',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--primary-blue)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 16px',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#d1fae5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    color: '#059669',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
    margin: '0 0 8px 0',
  },
  successText: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    margin: 0,
  },
};

export default OrganizationOnboarding;
