import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trading Signals Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-mono">
        <nav className="border-b border-gray-800 px-6 py-4 flex gap-6 items-center">
          <span className="font-semibold text-white">Trading Signals</span>
          <a href="/"          className="text-sm text-gray-400 hover:text-white">Signals</a>
          <a href="/positions" className="text-sm text-gray-400 hover:text-white">Positions</a>
          <a href="/settings"  className="text-sm text-gray-400 hover:text-white">Settings</a>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
