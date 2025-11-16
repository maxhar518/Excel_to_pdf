import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
export const metadata = {
  title: 'Excel to PDF',
  description: 'Get Excel rows into pdf pages for proper data visualization',
  icons: '/logo.png'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}
        <Analytics />
      </body>
    </html>
  )
}
