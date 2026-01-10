import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Get org colors from centralized theme
import { getOrgColor } from '../theme';

/**
 * OrgSwitcher Component
 *
 * Toggle for admin/full_line users to switch between organization views.
 * Shows current org with a dropdown to switch.
 *
 * Props:
 * - compact: Boolean - if true, shows only icon/short code
 * - showLabel: Boolean - if true, shows "Viewing:" label
 * - className: Additional CSS class
 */
const OrgSwitcher = ({
  compact = false,
  showLabel = false,
  className = ''
}) => {
  const {
    organizations,
    currentViewOrgId,
    currentViewOrg,
    switchOrganizationView,
    canSwitchOrgs
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if user can't switch orgs
  if (!canSwitchOrgs) {
    return null;
  }

  const handleSelect = (orgId) => {
    switchOrganizationView(orgId);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const currentOrgCode = currentViewOrg?.code || 'OR';
  const currentColors = getOrgColor(currentOrgCode);
  const currentColor = currentColors.bg;
  const currentColorDark = currentColors.hover;

  return (
    <div className={`org-switcher ${className}`} ref={dropdownRef}>
      {showLabel && <span className="org-switcher-label">Viewing:</span>}

      <button
        className={`org-switcher-button ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          '--org-color': currentColor,
          '--org-color-dark': currentColorDark,
        }}
      >
        <span className="org-switcher-current">
          {compact ? (
            <span className="org-code" style={{ backgroundColor: currentColor }}>{currentViewOrg?.code || '?'}</span>
          ) : (
            <span className="org-name">{currentViewOrg?.name || 'Select Org'}</span>
          )}
        </span>
        <svg
          className={`org-switcher-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="org-switcher-dropdown">
          {organizations.map(org => {
            const orgColor = getOrgColor(org.code).bg;
            return (
              <button
                key={org.id}
                className={`org-switcher-option ${org.id === currentViewOrgId ? 'selected' : ''}`}
                onClick={() => handleSelect(org.id)}
                style={{ '--option-org-color': orgColor }}
              >
                <span
                  className="org-option-code"
                  style={{
                    backgroundColor: org.id === currentViewOrgId ? orgColor : '#eee',
                    color: org.id === currentViewOrgId ? '#fff' : '#666'
                  }}
                >
                  {org.code}
                </span>
                <span className="org-option-name">{org.name}</span>
                {org.id === currentViewOrgId && (
                  <svg
                    className="org-option-check"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: orgColor }}
                  >
                    <path
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Styles
const styles = `
.org-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.org-switcher-label {
  font-size: 0.875rem;
  color: #64748b;
}

.org-switcher-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1e293b;
  transition: all 0.2s ease;
}

.org-switcher-button:hover {
  background: #f8fafc;
  border-color: var(--org-color, #224B6E);
}

.org-switcher-button.open {
  border-color: var(--org-color, #224B6E);
  box-shadow: 0 0 0 2px rgba(34, 75, 110, 0.1);
}

.org-switcher-current {
  font-weight: 500;
}

.org-code {
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.org-switcher-arrow {
  transition: transform 0.2s ease;
  color: #64748b;
}

.org-switcher-arrow.open {
  transform: rotate(180deg);
}

.org-switcher-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  min-width: 220px;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

.org-switcher-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.org-switcher-option:hover {
  background: #f8fafc;
}

.org-switcher-option.selected {
  background: #f1f5f9;
}

.org-option-code {
  flex-shrink: 0;
  min-width: 2.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.025em;
}

.org-option-name {
  flex: 1;
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
}

.org-option-check {
  flex-shrink: 0;
}

/* Badge variant - for compact display in nav */
.org-switcher.badge .org-switcher-button {
  padding: 0.375rem 0.5rem;
  background: transparent;
  border: none;
}

.org-switcher.badge .org-switcher-button:hover {
  background: rgba(0, 0, 0, 0.05);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'org-switcher-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default OrgSwitcher;
