'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Config = Record<string, string>

export default function SettingsPage() {
  const [config, setConfig]   = useState<Config>({})
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.from('config').select('key, value').then(({ data }) => {
      if (data) setConfig(Object.fromEntries(data.map(r => [r.key, r.value])))
    })
  }, [])

  const set = (key: string, value: string) => setConfig(prev => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    setMessage('')
    const rows = Object.entries(config).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('config').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    setMessage(error ? `Error: ${error.message}` : 'Saved.')
  }

  const triggerScan = async () => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
    const repo  = process.env.NEXT_PUBLIC_GITHUB_REPO  // e.g. "username/trading-signals-dashboard"
    if (!token || !repo) {
      setMessage('GitHub token or repo not configured in env vars.')
      return
    }
    setMessage('Triggering scan...')
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/scan.yml/dispatches`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: 'main' }),
      }
    )
    setMessage(res.ok ? 'Scan triggered. Check GitHub Actions for progress.' : `GitHub API error: ${res.status}`)
  }

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Dhan Credentials</h2>
        <Field label="Client ID"     value={config.dhan_client_id    ?? ''} onChange={v => set('dhan_client_id', v)} />
        <Field label="Access Token"  value={config.dhan_access_token ?? ''} onChange={v => set('dhan_access_token', v)} type="password"
               hint="Paste fresh token from Dhan portal daily before Friday scan" />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Strategy Config</h2>
        <Field label="Symbol (display)"  value={config.symbol      ?? ''} onChange={v => set('symbol', v)}      hint="e.g. RELIANCE" />
        <Field label="Dhan Security ID"  value={config.security_id ?? ''} onChange={v => set('security_id', v)} hint="Find in Dhan security master CSV" />
        <Field label="Risk Per Trade (₹)" value={config.risk_per_trade ?? ''} onChange={v => set('risk_per_trade', v)} />
      </section>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button onClick={triggerScan}
          className="border border-gray-700 text-sm px-4 py-2 rounded hover:border-gray-500">
          Run Scan Now
        </button>
      </div>

      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      />
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  )
}
