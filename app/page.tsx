'use client'

import React, { JSX, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'

type Row = Array<string | number | null | undefined>

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch image')
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Page(): JSX.Element {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [filenameBase, setFilenameBase] = useState<string>('output')
  const [displayOption, setDisplayOption] = useState<'logo' | 'qr' | 'both'>('both')

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

  const generateQRCodeDataURL = async (data: string) => {
    return await QRCode.toDataURL(data, { errorCorrectionLevel: 'M', margin: 0, scale: 4 })
  }

  const triggerConfetti = () => {
    const duration = 2 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        }
      })
    }, 200)
  }

  const generatePDF = async () => {
    if (!rows.length) return
    const width = 6 * 72
    const height = 4 * 72
    const doc = new jsPDF({ unit: 'pt', format: [width, height], orientation: 'landscape' })

    let logoDataUrl: string | null = null
    if (displayOption === 'logo' || displayOption === 'both') {
      try {
        logoDataUrl = await fetchImageAsDataUrl('/logo.png')
      } catch {
        logoDataUrl = null
      }
    }

    for (let pageIndex = 0; pageIndex < rows.length; pageIndex++) {
      if (pageIndex > 0) doc.addPage([width, height], 'landscape')
      const row = rows[pageIndex]

      // Logo
      if (displayOption === 'logo' || displayOption === 'both') {
        const logoW = 60
        const logoH = 60
        if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', 36, 20, logoW, logoH)
      }

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      const title = 'PALLET TAG'
      const titleW = doc.getTextWidth(title)
      doc.text(title, width / 2 - titleW / 2, 30)

      // QR
      if (displayOption === 'qr' || displayOption === 'both') {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-vercel.app'
        const qrPayload = { page: pageIndex + 1, data: row }
        const qrUrl = `${origin}/tag?d=${encodeURIComponent(JSON.stringify(qrPayload))}`
        const qrDataUrl = await generateQRCodeDataURL(qrUrl)
        const qrSize = 80
        doc.addImage(qrDataUrl, 'PNG', width - qrSize - 36, 20, qrSize, qrSize)
      }

      // Body
      const bodyFontSize = 12
      const lineSpacing = 13
      const labelGap = 6
      const marginLeft = 20
      let cursorY = 90
      doc.setFontSize(bodyFontSize)

      const kv = headers.map((h, i) => ({
        label: h || '',
        value: String(row[i] ?? '')
      })).filter(item => item.label || item.value)

      const mainFields = kv.slice(0, -4)
      const lastFour = kv.slice(-4)

      for (const item of mainFields) {
        if (!item) continue
        const labelText = item.label ? `${item.label} :` : ''
        const labelWidth = labelText ? doc.getTextWidth(labelText) : 0
        doc.text(labelText, marginLeft, cursorY)

        doc.setFont('helvetica', 'normal')
        const valueX = marginLeft + labelWidth + labelGap
        const avail = width - marginLeft * 2 - labelWidth - labelGap
        const lines = doc.splitTextToSize(item.value || '', avail)
        doc.text(lines, valueX, cursorY)
        cursorY += lineSpacing * Math.max(1, lines.length)

        if (cursorY > height - 120) break
      }

      // ===== 2×2 Grid for Last Four Columns (Left column wider) =====
      if (lastFour.length) {
        const gridTop = height - 100
        const gridLeft = marginLeft
        const totalWidth = width - marginLeft * 2
        const leftColWidth = totalWidth * 0.6 // wider left column (60%)
        const rightColWidth = totalWidth * 0.4 // narrower right column (40%)
        const rowHeight = 25
        const labelGap = 4

        for (let i = 0; i < lastFour.length; i++) {
          const item = lastFour[i]
          if (!item) continue

          const isLeftCol = i % 2 === 0
          const colX = isLeftCol ? gridLeft : gridLeft + leftColWidth
          const colWidth = isLeftCol ? leftColWidth : rightColWidth
          const rowY = gridTop + Math.floor(i / 2) * rowHeight

          // Label
          const labelText = `${item.label}:`
          const labelWidth = doc.getTextWidth(labelText)
          doc.text(labelText, colX, rowY)

          // Value
          doc.setFont('helvetica', 'normal')
          const valueX = colX + labelWidth + labelGap
          const maxValueWidth = colWidth - labelWidth - labelGap - 10
          const lines = doc.splitTextToSize(String(item.value ?? ''), maxValueWidth)
          doc.text(lines, valueX, rowY)
        }
      }


      const footerText = 'MADE IN PAKISTAN'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      const footerW = doc.getTextWidth(footerText)
      doc.text(footerText, width / 2 - footerW / 2, height - 25)
    }

    doc.save(`${filenameBase || 'output'}.pdf`)
    triggerConfetti()
  }

  return (
    <main className="container">
      <h1>Excel → PDF (6×4 in)</h1>

      <div className="controls">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} />
        <select
          className="dropdown"
          value={displayOption}
          onChange={(e) => setDisplayOption(e.target.value as 'logo' | 'qr' | 'both')}
        >
          <option value="logo">Add Logo</option>
          <option value="qr">Add QR Code</option>
          <option value="both">Add Both</option>
        </select>

        <button className="btn" onClick={generatePDF} disabled={!rows.length}>
          Generate PDF
        </button>
      </div>

      <div className="info">
        <p>Headers: {headers.length}</p>
        <p>Rows: {rows.length}</p>
      </div>

      <p className="sample-note">Get Excel rows into pdf pages for proper data visualization      </p>
    </main>
  )
}
