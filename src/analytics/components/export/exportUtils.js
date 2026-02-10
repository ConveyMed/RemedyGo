// Build flat column definitions for user report exports (dynamic screens + categories)
function buildUserReportColumns(screenNames = [], categories = []) {
  return [
    { key: 'name', label: 'Name' },
    { key: 'totalSessions', label: 'Total Sessions' },
    { key: 'totalDurationMin', label: 'Duration (min)' },
    { key: 'avgSessionMin', label: 'Avg Session (min)' },
    ...screenNames.map(s => ({ key: `screen_${s}`, label: s })),
    { key: 'screenViewsTotal', label: 'Screen Views Total' },
    { key: 'totalAssets', label: 'Total Assets' },
    ...categories.map(a => ({ key: `asset_${a}`, label: a })),
  ]
}

function buildUserReportGroups(screenNames = [], categories = []) {
  return [
    { label: 'Individual User Activity Report', span: 4 },
    { label: 'Screens Visited', span: screenNames.length + 1 },
    { label: 'Assets Clicked', span: categories.length + 1 },
  ]
}

// Format number with commas
export function formatNumber(num) {
  if (num === null || num === undefined) return '-'
  return num.toLocaleString()
}

// Format percentage
export function formatPercent(num, decimals = 1) {
  if (num === null || num === undefined) return '-'
  return `${num.toFixed(decimals)}%`
}

// Format duration in seconds to readable string
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  return parts.join(' ')
}

// Escape CSV value properly
function escapeCSV(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Convert data to CSV string
export function toCSV(data, columns) {
  if (!data || data.length === 0) return ''
  const headers = columns.map(col => escapeCSV(col.label))
  const rows = data.map(row =>
    columns.map(col => escapeCSV(row[col.key]))
  )
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Get formatted timestamp for filenames
function getTimestamp() {
  const now = new Date()
  return now.toISOString().slice(0, 10)
}

// BOM for Excel UTF-8 compatibility
const UTF8_BOM = '\uFEFF'

// Download CSV file with BOM for Excel
export function downloadCSV(data, columns, filename) {
  const csv = toCSV(data, columns)
  const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${getTimestamp()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate CSV for a single section (stats + table data)
export function sectionToCSV(section) {
  let csv = ''

  // Section header
  csv += `"${section.title}"\n`
  csv += '\n'

  // Stats as key-value pairs
  if (section.stats && section.stats.length > 0) {
    csv += '"Metric","Value"\n'
    section.stats.forEach(stat => {
      csv += `${escapeCSV(stat.title)},${escapeCSV(stat.value)}\n`
    })
    csv += '\n'
  }

  // Table data
  if (section.tableData && section.tableData.length > 0 && section.columns) {
    csv += section.columns.map(col => escapeCSV(col.label)).join(',') + '\n'
    section.tableData.forEach(row => {
      csv += section.columns.map(col => escapeCSV(row[col.key])).join(',') + '\n'
    })
  }

  return csv
}

// Download individual section as CSV
export function downloadSectionCSV(section, baseFilename = 'conveymed') {
  const csv = sectionToCSV(section)
  const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${baseFilename}_${safeName}_${getTimestamp()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate comprehensive CSV with all sections
export function generateFullCSV(sections, options = {}) {
  const { dateRange, companyName = 'ConveyMed', allUsers, userReportRows, categories = [], screenNames = [] } = options
  const USER_REPORT_COLUMNS = buildUserReportColumns(screenNames, categories)
  const USER_REPORT_GROUPS = buildUserReportGroups(screenNames, categories)
  let csv = ''

  // Header metadata
  csv += '"ConveyMed Analytics Export"\n'
  csv += `"Generated","${new Date().toLocaleString()}"\n`
  if (dateRange) {
    csv += `"Date Range","${dateRange}"\n`
  }
  csv += '\n'

  // Executive Summary
  csv += '"EXECUTIVE SUMMARY"\n'
  csv += '"Metric","Value"\n'

  const userActivity = sections.find(s => s.id === 'userActivity')
  const feedActivity = sections.find(s => s.id === 'feedActivity')

  if (userActivity?.stats) {
    userActivity.stats.forEach(stat => {
      csv += `${escapeCSV(stat.title)},${escapeCSV(stat.value)}\n`
    })
  }
  if (feedActivity?.stats) {
    feedActivity.stats.forEach(stat => {
      csv += `${escapeCSV(stat.title)},${escapeCSV(stat.value)}\n`
    })
  }
  csv += '\n'

  // Each section with dividers
  sections.forEach(section => {
    csv += '---\n'
    csv += sectionToCSV(section)
    csv += '\n'
  })

  // User report if provided
  if (userReportRows && userReportRows.length > 0) {
    csv += '---\n'
    csv += '"INDIVIDUAL USER REPORT"\n'
    csv += '\n'

    // Group headers
    const groupCells = []
    USER_REPORT_GROUPS.forEach(g => {
      groupCells.push(escapeCSV(g.label))
      for (let i = 1; i < g.span; i++) groupCells.push('')
    })
    csv += groupCells.join(',') + '\n'

    // Column headers
    csv += USER_REPORT_COLUMNS.map(c => escapeCSV(c.label)).join(',') + '\n'

    // Data rows
    userReportRows.forEach(row => {
      csv += USER_REPORT_COLUMNS.map(c => escapeCSV(row[c.key])).join(',') + '\n'
    })
  }

  return csv
}

// Download comprehensive CSV
export function downloadFullCSV(sections, filename, options = {}) {
  const csv = generateFullCSV(sections, options)
  const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_full_${getTimestamp()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Download multiple CSVs as a ZIP (requires JSZip)
export async function downloadCSVZip(sections, filename, options = {}) {
  const { allUsers, userReportRows, categories = [], screenNames = [] } = options
  const USER_REPORT_COLUMNS = buildUserReportColumns(screenNames, categories)
  const USER_REPORT_GROUPS = buildUserReportGroups(screenNames, categories)

  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Summary CSV
  zip.file(`summary_${getTimestamp()}.csv`, UTF8_BOM + generateFullCSV(sections, options))

  // Individual section CSVs
  sections.forEach(section => {
    const safeName = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    zip.file(`${safeName}_${getTimestamp()}.csv`, UTF8_BOM + sectionToCSV(section))
  })

  // User report CSV
  if (userReportRows && userReportRows.length > 0) {
    let reportCsv = '"Individual User Report"\n\n'

    // Group headers
    const groupCells = []
    USER_REPORT_GROUPS.forEach(g => {
      groupCells.push(escapeCSV(g.label))
      for (let i = 1; i < g.span; i++) groupCells.push('')
    })
    reportCsv += groupCells.join(',') + '\n'
    reportCsv += USER_REPORT_COLUMNS.map(c => escapeCSV(c.label)).join(',') + '\n'
    userReportRows.forEach(row => {
      reportCsv += USER_REPORT_COLUMNS.map(c => escapeCSV(row[c.key])).join(',') + '\n'
    })

    zip.file(`user-report_${getTimestamp()}.csv`, UTF8_BOM + reportCsv)
  }

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_export_${getTimestamp()}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ==========================================
// EXCEL EXPORT
// ==========================================

// Hex color helpers for ExcelJS (ARGB format, no hash)
const XL_COLORS = {
  primary: 'FF1A2A35',
  accent: 'FF3B82F6',
  success: 'FF22C55E',
  warning: 'FFF59E0B',
  error: 'FFEF4444',
  gray: 'FF64748B',
  lightGray: 'FFF1F5F9',
  white: 'FFFFFFFF',
  black: 'FF000000'
}

function styleHeaderRow(row, fillColor = XL_COLORS.primary) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: XL_COLORS.white }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: XL_COLORS.gray } }
    }
  })
  row.height = 28
}

function styleDataRow(row, isAlt = false) {
  row.eachCell(cell => {
    cell.font = { size: 10, color: { argb: XL_COLORS.black } }
    cell.alignment = { vertical: 'middle' }
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_COLORS.lightGray } }
    }
  })
  row.height = 22
}

function autoFitColumns(worksheet) {
  worksheet.columns.forEach(col => {
    let maxLen = 12
    col.eachCell({ includeEmpty: false }, cell => {
      const val = cell.value ? String(cell.value) : ''
      maxLen = Math.max(maxLen, val.length + 2)
    })
    col.width = Math.min(maxLen, 40)
  })
}

function addSectionSheet(workbook, section) {
  const safeName = section.title.slice(0, 31)
  const ws = workbook.addWorksheet(safeName)

  let rowNum = 1

  // Section title
  const titleRow = ws.getRow(rowNum)
  titleRow.getCell(1).value = section.title
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: XL_COLORS.primary } }
  titleRow.height = 30
  rowNum += 2

  // Stats block
  if (section.stats && section.stats.length > 0) {
    const statsHeader = ws.getRow(rowNum)
    statsHeader.getCell(1).value = 'Metric'
    statsHeader.getCell(2).value = 'Value'
    styleHeaderRow(statsHeader, XL_COLORS.accent)
    rowNum++

    section.stats.forEach((stat, i) => {
      const r = ws.getRow(rowNum)
      r.getCell(1).value = stat.title
      r.getCell(2).value = stat.value
      r.getCell(1).font = { size: 10, color: { argb: XL_COLORS.gray } }
      r.getCell(2).font = { bold: true, size: 11, color: { argb: XL_COLORS.primary } }
      styleDataRow(r, i % 2 === 1)
      rowNum++
    })
    rowNum += 1
  }

  // Table data
  if (section.tableData && section.tableData.length > 0 && section.columns) {
    const header = ws.getRow(rowNum)
    section.columns.forEach((col, i) => {
      header.getCell(i + 1).value = col.label
    })
    styleHeaderRow(header, XL_COLORS.primary)
    rowNum++

    section.tableData.forEach((row, ri) => {
      const r = ws.getRow(rowNum)
      section.columns.forEach((col, ci) => {
        const val = row[col.key]
        r.getCell(ci + 1).value = val !== undefined && val !== null ? val : '-'
      })
      styleDataRow(r, ri % 2 === 1)
      rowNum++
    })
  }

  autoFitColumns(ws)
  return ws
}

export async function downloadExcel(sections, filename, options = {}) {
  const ExcelJS = (await import('exceljs')).default
  const { companyName = 'ConveyMed', dateRange, allUsers, userReportRows, categories = [], screenNames = [] } = options
  const USER_REPORT_COLUMNS = buildUserReportColumns(screenNames, categories)
  const USER_REPORT_GROUPS = buildUserReportGroups(screenNames, categories)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = companyName
  workbook.created = new Date()

  // --- Summary sheet ---
  const summary = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: XL_COLORS.accent } }
  })

  let row = 1

  // Title
  const titleRow = summary.getRow(row)
  titleRow.getCell(1).value = `${companyName} Analytics Report`
  titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: XL_COLORS.primary } }
  titleRow.height = 36
  row += 1

  // Metadata
  const genRow = summary.getRow(row)
  genRow.getCell(1).value = 'Generated'
  genRow.getCell(2).value = new Date().toLocaleString()
  genRow.getCell(1).font = { size: 10, color: { argb: XL_COLORS.gray } }
  genRow.getCell(2).font = { size: 10 }
  row++

  if (dateRange) {
    const drRow = summary.getRow(row)
    drRow.getCell(1).value = 'Date Range'
    drRow.getCell(2).value = dateRange
    drRow.getCell(1).font = { size: 10, color: { argb: XL_COLORS.gray } }
    drRow.getCell(2).font = { size: 10 }
    row++
  }
  row++

  // Key metrics header
  const metricsTitle = summary.getRow(row)
  metricsTitle.getCell(1).value = 'Key Metrics'
  metricsTitle.getCell(1).font = { bold: true, size: 13, color: { argb: XL_COLORS.primary } }
  metricsTitle.height = 28
  row++

  const metricsHeader = summary.getRow(row)
  metricsHeader.getCell(1).value = 'Section'
  metricsHeader.getCell(2).value = 'Metric'
  metricsHeader.getCell(3).value = 'Value'
  styleHeaderRow(metricsHeader, XL_COLORS.accent)
  row++

  // All stats from all sections
  sections.forEach(section => {
    if (section.stats && section.stats.length > 0) {
      section.stats.forEach((stat, i) => {
        const r = summary.getRow(row)
        r.getCell(1).value = section.title
        r.getCell(2).value = stat.title
        r.getCell(3).value = stat.value
        styleDataRow(r, row % 2 === 0)
        row++
      })
    }
  })

  autoFitColumns(summary)

  // --- Individual section sheets ---
  sections.forEach(section => {
    addSectionSheet(workbook, section)
  })

  // --- Individual User Report sheet ---
  if (userReportRows && userReportRows.length > 0) {
    const report = workbook.addWorksheet('User Report', {
      properties: { tabColor: { argb: XL_COLORS.success } }
    })

    // Row 1: Group headers (merged)
    let col = 1
    USER_REPORT_GROUPS.forEach(g => {
      const startCol = col
      const endCol = col + g.span - 1
      if (g.span > 1) {
        report.mergeCells(1, startCol, 1, endCol)
      }
      const cell = report.getCell(1, startCol)
      cell.value = g.label
      cell.font = { bold: true, size: 11, color: { argb: XL_COLORS.white } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_COLORS.primary } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      for (let c = startCol; c <= endCol; c++) {
        const mc = report.getCell(1, c)
        mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_COLORS.primary } }
      }
      col = endCol + 1
    })
    report.getRow(1).height = 26

    // Row 2: Column headers
    USER_REPORT_COLUMNS.forEach((c, i) => {
      const cell = report.getCell(2, i + 1)
      cell.value = c.label
      cell.font = { bold: true, size: 10, color: { argb: XL_COLORS.white } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_COLORS.accent } }
      cell.alignment = { vertical: 'middle' }
    })
    report.getRow(2).height = 24

    // Data rows
    userReportRows.forEach((row, ri) => {
      const r = report.getRow(3 + ri)
      USER_REPORT_COLUMNS.forEach((c, ci) => {
        const cell = r.getCell(ci + 1)
        cell.value = row[c.key] !== undefined ? row[c.key] : 0
        cell.font = { size: 10 }
        if (ri % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL_COLORS.lightGray } }
        }
      })
      r.height = 22
    })

    autoFitColumns(report)
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${getTimestamp()}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

