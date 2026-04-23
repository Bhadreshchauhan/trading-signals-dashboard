import { supabase, type Signal } from '@/lib/supabase'

const BADGE: Record<Signal['signal_type'], string> = {
  BUY:       'bg-green-900 text-green-300',
  EXIT:      'bg-red-900 text-red-300',
  ADD:       'bg-blue-900 text-blue-300',
  TRAIL:     'bg-yellow-900 text-yellow-300',
  NO_SIGNAL: 'bg-gray-800 text-gray-400',
}

export const revalidate = 60

export default async function SignalsPage() {
  const { data: signals } = await supabase
    .from('signals')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Recent Signals</h1>

      {!signals?.length && (
        <p className="text-gray-500">No signals yet. Run a scan from GitHub Actions or the Settings page.</p>
      )}

      <div className="space-y-3">
        {signals?.map((s: Signal) => (
          <div key={s.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${BADGE[s.signal_type]}`}>
                {s.signal_type}
              </span>
              <span className="font-semibold">{s.symbol}</span>
              <span className="text-gray-400 text-sm ml-auto">
                {new Date(s.scanned_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <Stat label="Price"       value={`₹${s.price?.toFixed(2)}`} />
              <Stat label="Stop Loss"   value={s.stop_loss   ? `₹${s.stop_loss.toFixed(2)}`   : '—'} />
              <Stat label="Weekly RSI"  value={s.weekly_rsi  ? s.weekly_rsi.toFixed(1)         : '—'} />
              <Stat label="Monthly RSI" value={s.monthly_rsi ? s.monthly_rsi.toFixed(1)        : '—'} />
              {s.quantity     && <Stat label="Qty"    value={s.quantity.toString()} />}
              {s.pnl !== null && <Stat label="P&L"    value={`₹${s.pnl?.toFixed(2)}`} highlight={s.pnl >= 0 ? 'green' : 'red'} />}
            </div>

            {s.notes && <p className="text-xs text-gray-500">{s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  const color = highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : 'text-white'
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-medium ${color}`}>{value}</p>
    </div>
  )
}
