import "./globals.css";

export const metadata = {
  title: 'Excel to PALLET TAG PDF',
  description: 'Generate 6x4 inch PALLET TAG PDFs from Excel'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
