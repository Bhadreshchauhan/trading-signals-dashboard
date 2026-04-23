import { supabase, type Position } from '@/lib/supabase'

export const revalidate = 60

export default async function PositionsPage() {
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('is_open', true)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Open Positions</h1>

      {!positions?.length && (
        <p className="text-gray-500">No open positions.</p>
      )}

      <div className="space-y-4">
        {positions?.map((p: Position) => {
          const unrealised = null // live price not available without API call
          return (
            <div key={p.id} className="border border-gray-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{p.symbol}</span>
                <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">OPEN</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <Stat label="Quantity"       value={p.quantity.toString()} />
                <Stat label="Buy Price"      value={`₹${p.buy_price.toFixed(2)}`} />
                <Stat label="Stop Loss"      value={`₹${p.stop_loss.toFixed(2)}`} />
                <Stat label="Position Added" value={p.position_added ? 'Yes' : 'No'} />
                <Stat label="Opened"         value={new Date(p.opened_at).toLocaleDateString('en-IN')} />
                <Stat label="Last Updated"   value={new Date(p.updated_at).toLocaleDateString('en-IN')} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-white">{value}</p>
    </div>
  )
}
