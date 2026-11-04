import { useEffect, useState } from 'react'
import TabBar from './components/TabBar'
import InstallBanner from './components/InstallBanner'
import CreateTab from './tabs/CreateTab'
import HistoryTab from './tabs/HistoryTab'
import AccountsTab from './tabs/AccountsTab'

export type TabId = 'create' | 'history' | 'accounts'
const TAB_IDS: TabId[] = ['create', 'history', 'accounts']
const fromHash = (): TabId => (TAB_IDS.find((t) => `#${t}` === location.hash) ?? 'create')

export default function App() {
  const [tab, setTabState] = useState<TabId>(fromHash)
  const [scriptText, setScriptText] = useState('')
  const setTab = (t: TabId) => { setTabState(t); history.replaceState(null, '', t === 'create' ? location.pathname + location.search : `#${t}`); scrollTo(0, 0) }

  useEffect(() => {
    navigator.storage?.persist?.()
  }, [])

  return (
    <div
      className="mx-auto min-h-full max-w-xl px-4"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <InstallBanner />
      {/* stays mounted so an in-flight generation survives tab switches */}
      <div hidden={tab !== 'create'} className="screen">
        <CreateTab active={tab === 'create'} scriptText={scriptText} setScriptText={setScriptText} onGoAccounts={() => setTab('accounts')} />
      </div>
      {tab === 'history' && <div className="screen"><HistoryTab setScriptText={setScriptText} onReuse={() => setTab('create')} /></div>}
      {tab === 'accounts' && <div className="screen"><AccountsTab /></div>}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
