// app/page.tsx
'use client'

import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

type Row = Array<string | number | null | undefined>

export default function Page() {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [filenameBase, setFilenameBase] = useState<string>('output')

  const handleFile = (file?: File) => {
    if (!file) return
    setFilenameBase(file.name.replace(/\.[^/.]+$/, ''))
    const reader = new FileReader()
    reader.onload = (e) => {
      const binaryStr = e.target?.result as string
      const wb = XLSX.read(binaryStr, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const filtered = data.filter(
        (r) => r && r.some((c: any) => c !== null && c !== undefined && String(c).trim() !== '')
      )
      if (!filtered.length) {
        setHeaders([])
        setRows([])
        return
      }
      const firstRow = filtered[0].map((h: any) => (h == null ? '' : String(h)))
      const dataRows = filtered.slice(1).map((r: any[]) => r.map((c: any) => (c == null ? '' : c)))
      setHeaders(firstRow)
      setRows(dataRows)
    }
    reader.readAsBinaryString(file)
  }

  const generatePDF = () => {
    if (!rows.length) return
    const width = 6 * 72
    const height = 4 * 72
    const doc = new jsPDF({ unit: 'pt', format: [width, height], orientation: 'landscape' })

    rows.forEach((row, pageIndex) => {
      if (pageIndex > 0) doc.addPage([width, height], 'landscape')

      // Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      const headerText = 'PALLET TAG'
      const headerWidth = doc.getTextWidth(headerText)
      doc.text(headerText, width / 2 - headerWidth / 2, 40)

      // Body (single column layout)
      const bodyFontSize = 10
      const lineSpacing = 14
      const labelGap = 4
      const marginLeft = 36
      let cursorY = 70

      doc.setFontSize(bodyFontSize)
      const kv = headers.map((h, i) => ({
        label: String(h),
        value: String(row[i] ?? '')
      }))

      kv.forEach((item) => {
        doc.setFont('helvetica', 'bold')
        const labelText = item.label ? `${item.label} :` : ''
        const labelWidth = labelText ? doc.getTextWidth(labelText) : 0
        doc.text(labelText, marginLeft, cursorY)

        doc.setFont('helvetica', 'normal')
        const valueX = marginLeft + labelWidth + labelGap
        const avail = width - marginLeft * 2 - labelWidth - labelGap
        const lines = doc.splitTextToSize(item.value, avail)
        doc.text(lines, valueX, cursorY)

        cursorY += lineSpacing * lines.length
        if (cursorY > height - 60) {
          doc.addPage([width, height], 'landscape')
          cursorY = 70
        }
      })

      const footerText = 'MADE IN PAKISTAN'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const footerWidth = doc.getTextWidth(footerText)
      doc.text(footerText, width / 2 - footerWidth / 2, height - 30)
    })

    doc.save(`${filenameBase || 'output'}.pdf`)
  }

  return (
    <main className="container">
      <h1>Excel → PDF pages</h1>
      <div className="controls">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="info">
          <p>Headers: {headers.length}</p>
          <p>Rows: {rows.length}</p>
        </div>
        <button className="btn" onClick={generatePDF} disabled={!rows.length}>
          Get PDF
        </button>
      </div>
      <p className="sample-note">Get PDF pages from Excel Rows in Single Column.</p>
    </main>
  )
}
