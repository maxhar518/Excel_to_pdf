# 📦 Excel to PDF Generator (Next.js + TypeScript)

This project is a **Next.js 13+ (App Router)** application that converts Excel files (`.xlsx`, `.xls`) into **6×4 inch PDF Pages** using `jsPDF` and `xlsx`.

Each Excel row becomes a formatted **page**, following the layout from real-world packaging labels:

- **Centered header:** “PALLET TAG”  
- **Key–Value pairs:** One per line, auto-detected from Excel headers  
- **Single column layout** with compact 10pt Helvetica text  
- **Centered footer:** “MADE IN PAKISTAN” (no line above footer)

---

## 🚀 Live Tool
This generator will be available online at:  
👉 **[https://excel-to-pdf-lac.vercel.app/](https://excel-to-pdf-lac.vercel.app/)**

---

## 🧩 Features

- Built with **Next.js 13+ (App Router)**
- Client-side Excel parsing with **xlsx**
- PDF generation with **jsPDF**
- Auto-detects headers and rows dynamically
- Creates one PALLET TAG (6×4 inch, landscape) per Excel row
- Uses **Helvetica (bold/regular)** font for accurate label look

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-------------|----------|
| **Next.js 13+ (App Router)** | Web framework |
| **TypeScript** | Type safety |
| **xlsx** | Parse Excel data |
| **jsPDF** | Generate PDF documents |
| **React Hooks** | Manage state and file input |

---