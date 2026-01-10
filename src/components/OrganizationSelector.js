import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * OrganizationSelector Component
 *
 * Two modes:
 * 1. Simple mode (for posts): Radio buttons - AM / OR / Both
 * 2. Full mode (for library/training): Checkboxes per org with category selection
 *
 * Props:
 * - mode: 'simple' | 'full'
 * - value: For simple mode: orgId or 'both'. For full mode: { [orgId]: [categoryIds] }
 * - onChange: Callback with selected value
 * - categories: Array of category objects (for full mode)
 * - disabled: Boolean to disable the selector
 */
const OrganizationSelector = ({
  mode = 'simple',
  value,
  onChange,
  categories = [],
  disabled = false,
  label = 'Organization'
}) => {
  const { organizations, canCreateContent } = useAuth();
  const [simpleValue, setSimpleValue] = useState(value || null);
  const [fullValue, setFullValue] = useState(value || {});

  // Sync internal state with prop value
  useEffect(() => {
    if (mode === 'simple') {
      setSimpleValue(value);
    } else {
      setFullValue(value || {});
    }
  }, [value, mode]);

  // Simple mode handlers
  const handleSimpleChange = (newValue) => {
    if (disabled) return;
    setSimpleValue(newValue);
    onChange?.(newValue);
  };

  // Full mode handlers
  const handleOrgToggle = (orgId) => {
    if (disabled) return;
    const newValue = { ...fullValue };
    if (newValue[orgId]) {
      delete newValue[orgId];
    } else {
      newValue[orgId] = [];
    }
    setFullValue(newValue);
    onChange?.(newValue);
  };

  const handleCategoryToggle = (orgId, categoryId) => {
    if (disabled) return;
    const newValue = { ...fullValue };
    if (!newValue[orgId]) {
      newValue[orgId] = [categoryId];
    } else if (newValue[orgId].includes(categoryId)) {
      newValue[orgId] = newValue[orgId].filter(id => id !== categoryId);
    } else {
      newValue[orgId] = [...newValue[orgId], categoryId];
    }
    setFullValue(newValue);
    onChange?.(newValue);
  };

  if (!canCreateContent) {
    return null; // Regular users don't see this selector
  }

  if (organizations.length === 0) {
    return <div className="org-selector-loading">Loading organizations...</div>;
  }

  // Simple mode: Radio buttons for AM / OR / Both
  if (mode === 'simple') {
    return (
      <div className="org-selector org-selector-simple">
        <label className="org-selector-label">{label}</label>
        <div className="org-selector-options">
          {organizations.map(org => (
            <label key={org.id} className="org-selector-radio">
              <input
                type="radio"
                name="organization"
                value={org.id}
                checked={simpleValue === org.id}
                onChange={() => handleSimpleChange(org.id)}
                disabled={disabled}
              />
              <span className="org-selector-radio-label">{org.name}</span>
            </label>
          ))}
          <label className="org-selector-radio">
            <input
              type="radio"
              name="organization"
              value="both"
              checked={simpleValue === 'both'}
              onChange={() => handleSimpleChange('both')}
              disabled={disabled}
            />
            <span className="org-selector-radio-label">Both Organizations</span>
          </label>
        </div>
      </div>
    );
  }

  // Full mode: Checkboxes per org with category selection
  return (
    <div className="org-selector org-selector-full">
      <label className="org-selector-label">{label}</label>
      <div className="org-selector-orgs">
        {organizations.map(org => {
          const isOrgSelected = !!fullValue[org.id];
          const selectedCategories = fullValue[org.id] || [];

          return (
            <div key={org.id} className={`org-selector-org ${isOrgSelected ? 'selected' : ''}`}>
              <label className="org-selector-checkbox org-checkbox">
                <input
                  type="checkbox"
                  checked={isOrgSelected}
                  onChange={() => handleOrgToggle(org.id)}
                  disabled={disabled}
                />
                <span className="org-checkbox-label">{org.name}</span>
              </label>

              {isOrgSelected && categories.length > 0 && (
                <div className="org-selector-categories">
                  <span className="categories-label">Categories:</span>
                  {categories.map(cat => (
                    <label key={cat.id} className="org-selector-checkbox category-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(org.id, cat.id)}
                        disabled={disabled}
                      />
                      <span className="category-checkbox-label">{cat.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Styles
const styles = `
.org-selector {
  margin: 1rem 0;
}

.org-selector-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.org-selector-loading {
  padding: 1rem;
  color: var(--text-secondary, #666);
  font-style: italic;
}

/* Simple mode styles */
.org-selector-simple .org-selector-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.org-selector-radio {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.org-selector-radio input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.org-selector-radio-label {
  color: var(--text-primary, #333);
}

/* Full mode styles */
.org-selector-full .org-selector-orgs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.org-selector-org {
  padding: 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  background: var(--bg-secondary, #f9f9f9);
}

.org-selector-org.selected {
  border-color: var(--primary-color, #007bff);
  background: var(--bg-primary, #fff);
}

.org-selector-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.org-selector-checkbox input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.org-checkbox-label {
  font-weight: 600;
  color: var(--text-primary, #333);
}

.org-selector-categories {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color, #eee);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.categories-label {
  width: 100%;
  font-size: 0.875rem;
  color: var(--text-secondary, #666);
  margin-bottom: 0.25rem;
}

.category-checkbox-label {
  color: var(--text-primary, #333);
}

/* Disabled state */
.org-selector input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.org-selector input:disabled + span {
  opacity: 0.6;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'org-selector-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default OrganizationSelector;
