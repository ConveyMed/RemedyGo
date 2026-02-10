import { useAppContext } from '../context/AppContext'

export default function OrgSelector() {
  const { availableOrgs, selectedOrgId, setSelectedOrgId } = useAppContext()

  if (availableOrgs.length === 0) return null

  const options = [{ id: null, code: 'All' }, ...availableOrgs]

  return (
    <div style={styles.container}>
      <span style={styles.label}>Organization</span>
      <div style={styles.pills}>
        {options.map(org => {
          const isActive = org.id === selectedOrgId
          return (
            <button
              key={org.id || 'all'}
              onClick={() => setSelectedOrgId(org.id)}
              style={{
                ...styles.pill,
                ...(isActive ? styles.pillActive : {})
              }}
            >
              {org.code}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  pills: {
    display: 'flex',
    gap: '6px'
  },
  pill: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
    flex: 1,
    textAlign: 'center'
  },
  pillActive: {
    backgroundColor: 'var(--accent)',
    color: '#ffffff',
    borderColor: 'var(--accent)'
  }
}
