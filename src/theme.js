/**
 * REMEDYGO THEME CONFIGURATION
 *
 * Change colors here to rebrand the entire app.
 * All components pull from this single source of truth.
 */

const theme = {
  // ===========================================
  // BRAND COLORS - RemedyGo Purple Theme
  // ===========================================
  brand: {
    primary: '#8246AF',      // Main purple
    primaryLight: '#9d6bc4', // Lighter purple (hover states, accents)
    primaryDark: '#6d3a94',  // Darker purple (pressed states)
    accent: '#a855f7',       // Bright purple accent
  },

  // ===========================================
  // ORGANIZATION COLORS - Both purple, different shades
  // ===========================================
  orgs: {
    OR: {
      primary: '#8246AF',    // OsteoRemedies - main purple
      dark: '#6d3a94',
      light: '#9d6bc4',
      bg: 'rgba(130, 70, 175, 0.1)',
    },
    AM: {
      primary: '#5c3d7a',    // Antimicrobials - darker purple
      dark: '#4a3163',
      light: '#7a5299',
      bg: 'rgba(92, 61, 122, 0.1)',
    },
  },

  // ===========================================
  // NEUTRAL COLORS - Light mode with purple tints
  // ===========================================
  neutral: {
    white: '#ffffff',
    offWhite: '#faf8fc',    // Very slight purple tint
    light: '#f3f0f7',       // Light purple-gray
    border: '#e8e0f0',      // Purple-tinted border
    textLight: '#9088a3',   // Muted purple-gray
    textMuted: '#6b5f7a',   // Purple-gray
    textDark: '#1a1523',    // Near black with purple
  },

  // ===========================================
  // STATUS COLORS - Usually don't change
  // ===========================================
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get organization color by code
 * Returns object with { bg, hover } for easy component usage
 */
export const getOrgColor = (orgCode) => {
  const org = theme.orgs[orgCode];
  if (org) {
    return {
      bg: org.primary,
      hover: org.dark,
      light: org.light,
      bgLight: org.bg,
    };
  }
  // Fallback to brand colors
  return {
    bg: theme.brand.primary,
    hover: theme.brand.primaryDark,
    light: theme.brand.primaryLight,
    bgLight: 'rgba(30, 64, 175, 0.1)',
  };
};

/**
 * Check if multi-org is enabled
 */
export const hasMultiOrg = () => Object.keys(theme.orgs).length > 0;

/**
 * Convert hex to RGB string
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

/**
 * Generate CSS variables string
 */
export const generateCSSVariables = () => `
  :root {
    /* Brand Colors */
    --primary: ${theme.brand.primary};
    --primary-light: ${theme.brand.primaryLight};
    --primary-dark: ${theme.brand.primaryDark};
    --accent: ${theme.brand.accent};
    --primary-rgb: ${hexToRgb(theme.brand.primary)};

    /* Org Colors */
    --org-or-primary: ${theme.orgs.OR?.primary || theme.brand.primary};
    --org-or-dark: ${theme.orgs.OR?.dark || theme.brand.primaryDark};
    --org-am-primary: ${theme.orgs.AM?.primary || theme.brand.primary};
    --org-am-dark: ${theme.orgs.AM?.dark || theme.brand.primaryDark};

    /* Neutral Colors */
    --white: ${theme.neutral.white};
    --off-white: ${theme.neutral.offWhite};
    --bg-light: ${theme.neutral.light};
    --border: ${theme.neutral.border};
    --text-light: ${theme.neutral.textLight};
    --text-muted: ${theme.neutral.textMuted};
    --text-dark: ${theme.neutral.textDark};

    /* Status Colors */
    --success: ${theme.status.success};
    --warning: ${theme.status.warning};
    --error: ${theme.status.error};
    --info: ${theme.status.info};

    /* Legacy compatibility */
    --primary-blue: ${theme.brand.primary};
    --primary-blue-light: ${theme.brand.primaryLight};
    --primary-blue-dark: ${theme.brand.primaryDark};
    --accent-blue: ${theme.brand.accent};
    --primary-blue-rgb: ${hexToRgb(theme.brand.primary)};
    --background-white: ${theme.neutral.white};
    --background-off-white: ${theme.neutral.offWhite};
    --border-light: ${theme.neutral.border};
    --text-dark-rgb: ${hexToRgb(theme.neutral.textDark)};
  }
`;

/**
 * Inject theme CSS variables into document
 */
export const injectTheme = () => {
  if (typeof document === 'undefined') return;

  const styleId = 'app-theme-variables';
  let styleEl = document.getElementById(styleId);

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.insertBefore(styleEl, document.head.firstChild);
  }

  styleEl.textContent = generateCSSVariables();
};

export default theme;
