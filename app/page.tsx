'use client'

import React, { JSX, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

type Row = Array<string | number | null | undefined>

async function fetchImageAsDataUrl(url: string): Promise<string> {
  // fetch image and convert to data URL so jsPDF.addImage accepts it reliably
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch image')
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (!reader.result) return reject(new Error('Failed to convert image'))
      resolve(String(reader.result))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Page(): JSX.Element {
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
    // readAsBinaryString used intentionally per original requirement
    // Note: some browsers may deprecate readAsBinaryString. If you encounter issues,
    // switch to readAsArrayBuffer and XLSX.read(arrayBuffer, { type: 'array' }).
    reader.readAsBinaryString(file)
  }

  const generateQRCodeDataURL = async (data: string) => {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 0,
      scale: 3,
    })
  }

  const generatePDF = async () => {
    if (!rows.length) return
    const width = 6 * 72
    const height = 4 * 72
    const doc = new jsPDF({ unit: 'pt', format: [width, height], orientation: 'landscape' })

    // preload logo data URL once (falls back if not found)
    let logoDataUrl: string | null = null
    try {
      logoDataUrl = await fetchImageAsDataUrl('/logo.png')
    } catch {
      logoDataUrl = null
    }

    for (let pageIndex = 0; pageIndex < rows.length; pageIndex++) {
      if (pageIndex > 0) doc.addPage([width, height], 'landscape')
      const row = rows[pageIndex]

      // Logo (left) - use data URL if available
      const logoW = 50
      const logoH = 50
      if (logoDataUrl) {
        // jsPDF accepts DataURL
        doc.addImage(logoDataUrl, 'PNG', 36, 20, logoW, logoH)
      }

      // Title center
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      const title = 'PALLET TAG'
      const titleW = doc.getTextWidth(title)
      doc.text(title, width / 2 - titleW / 2, 30)

      // Build QR URL payload (point to /tag route with encoded payload)
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-vercel.app'
      const qrPayload = {
        page: pageIndex + 1,
        data: row,
      }
      const qrUrl = `${origin}/tag?d=${encodeURIComponent(JSON.stringify(qrPayload))}`

      // QR image (right)
      const qrDataUrl = await generateQRCodeDataURL(qrUrl)
      const qrSize = 50
      doc.addImage(qrDataUrl, 'PNG', width - qrSize - 36, 20, qrSize, qrSize)

      // Body content (single column)
      const bodyFontSize = 10
      const lineSpacing = 12
      const labelGap = 8
      const marginLeft = 36
      let cursorY = 90
      doc.setFontSize(bodyFontSize)

      const kv = headers.map((h, i) => ({
        label: String(h),
        value: String(row[i] ?? ''),
      }))

      for (const item of kv) {
        doc.setFont('helvetica', 'bold')
        const labelText = item.label ? `${item.label} :` : ''
        const labelWidth = labelText ? doc.getTextWidth(labelText) : 0
        doc.text(labelText, marginLeft, cursorY)

        doc.setFont('helvetica', 'normal')
        const valueX = marginLeft + labelWidth + labelGap
        const avail = width - marginLeft * 2 - labelWidth - labelGap
        const lines = doc.splitTextToSize(item.value, avail)
        doc.text(lines, valueX, cursorY)
        cursorY += lineSpacing * Math.max(1, lines.length)

        if (cursorY > height - 60) {
          // start a new page and re-render header/logo/qr for continuity
          doc.addPage([width, height], 'landscape')
          // optional: re-add logo/title/qr on new page if desired
          if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', 36, 20, logoW, logoH)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.text(title, width / 2 - titleW / 2, 30)
          const newQr = await generateQRCodeDataURL(qrUrl)
          doc.addImage(newQr, 'PNG', width - qrSize - 36, 20, qrSize, qrSize)
          cursorY = 70
        }
      }

      // Footer
      const footerText = 'MADE IN PAKISTAN'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      const footerW = doc.getTextWidth(footerText)
      doc.text(footerText, width / 2 - footerW / 2, height - 30)
    }

    doc.save(`${filenameBase || 'output'}.pdf`)
  }

  return (
    <main className="container">
      <h1>Excel → PALLET TAG PDF (6×4 in)</h1>
      <div className="controls">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="info">
          <p>Headers: {headers.length}</p>
          <p>Rows: {rows.length}</p>
        </div>
        <button className="btn" onClick={generatePDF} disabled={!rows.length}>
          Generate PDF
        </button>
      </div>
      <p className="sample-note">Company logo on left, QR code on right (encodes page data in JSON).</p>
    </main>
  )
}
