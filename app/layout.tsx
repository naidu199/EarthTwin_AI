import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EarthTwin AI – Digital Twin for Sustainable Cities',
  description: 'AI-powered sustainability risk analysis for any city. Analyze water scarcity, air pollution, traffic congestion, and flood risk in real time.',
  keywords: 'AI, sustainability, smart cities, digital twin, risk analysis, SDG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
