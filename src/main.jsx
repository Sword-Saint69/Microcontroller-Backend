import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Pulse as Activity, Wind as AirVent, ArrowSquareOut as ArrowUpRight,
  SquaresFour as Boxes, Check, CaretRight as ChevronRight,
  CurrencyDollar as CircleDollarSign, CloudSun, Cpu, Eye, EyeSlash as EyeOff,
  Gauge, Globe as Globe2, Key as KeyRound, GridFour as LayoutDashboard,
  SpinnerGap as LoaderCircle, MapPin, List as Menu, Radio,
  ArrowsClockwise as RefreshCw, FloppyDisk as Save, HardDrives as Server,
  SlidersHorizontal as Settings2, ShieldCheck, TerminalWindow as TerminalSquare,
  X, Lightning as Zap, StackSimple, Wrench, RocketLaunch, Newspaper,
  CalendarDots, MusicNotes, ChartLineUp, Trophy, Quotes, ListChecks,
  Waveform, Cloud, TreeStructure, Trash, Plus, Clock, Circle, CheckCircle,
  Palette, Moon, Monitor, Sparkle, CircleHalf
} from '@phosphor-icons/react'
import * as Dialog from '@radix-ui/react-dialog'
import './styles.css'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'modules', label: 'Data modules', icon: StackSimple },
  { id: 'operations', label: 'Operations', icon: Wrench },
  { id: 'integrations', label: 'Integrations', icon: Boxes },
  { id: 'lab', label: 'API lab', icon: TerminalSquare },
  { id: 'device', label: 'Device setup', icon: Cpu },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const PROVIDERS = [
  { id: 'NASA_API_KEY', name: 'NASA Open APIs', description: 'Astronomy imagery and space data', initials: 'NA', keyed: true },
  { id: 'COINGECKO_API_KEY', name: 'CoinGecko', description: 'Cryptocurrency quotes and market movement', initials: 'CG', keyed: true },
  { id: 'OPENAQ_API_KEY', name: 'OpenAQ', description: 'Observed air-quality station data', initials: 'AQ', keyed: true },
  { id: 'OPEN_METEO', name: 'Open-Meteo', description: 'Weather, forecast and air-quality models', initials: 'OM' },
  { id: 'FRANKFURTER', name: 'Frankfurter', description: 'Reference foreign-exchange rates', initials: 'FR' },
  { id: 'USGS', name: 'USGS Earthquakes', description: 'Recent global seismic activity', initials: 'US' },
]

const QUICK_REQUESTS = [
  { group: 'System', method: 'GET', path: '/health', label: 'Service health' },
  { group: 'Device', method: 'GET', path: '/api/v1/device/dashboard', label: 'Dashboard snapshot' },
  { group: 'Device', method: 'POST', path: '/api/v1/pairing/claim', label: 'Claim a device', body: { claim_code: 'ABC123', device_name: 'Desk display' } },
  { group: 'Device', method: 'POST', path: '/api/v1/device/actions', label: 'Run device action', body: { action_type: 'TASK_TOGGLE', target_id: 'task_id', params: {} }, idempotency: true },
  { group: 'Media', method: 'POST', path: '/api/v1/actions/media', label: 'Update media status', body: { title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', is_playing: true, progress_ms: 60000, duration_ms: 230000 } },
  { group: 'Tasks', method: 'GET', path: '/api/v1/tasks', label: 'List tasks' },
  { group: 'Tasks', method: 'POST', path: '/api/v1/tasks', label: 'Create task', body: { title: 'Review dashboard', priority: 'high', due_time: '18:00' } },
  { group: 'Tasks', method: 'PATCH', path: '/api/v1/tasks/{task_id}/toggle', label: 'Toggle task' },
  { group: 'Tasks', method: 'DELETE', path: '/api/v1/tasks/{task_id}', label: 'Delete task' },
  { group: 'Device', method: 'POST', path: '/api/v1/telemetry', label: 'Submit telemetry', body: { events: [{ type: 'heartbeat', uptime_sec: 3600, free_heap: 182400, rssi: -51 }] } },
  { group: 'Firmware', method: 'GET', path: '/api/v1/firmware/check', label: 'Check firmware' },
  { group: 'Configuration', method: 'GET', path: '/api/v1/configuration', label: 'Read configuration', consoleAuth: true },
  { group: 'Configuration', method: 'PUT', path: '/api/v1/configuration', label: 'Update configuration', consoleAuth: true, body: { DEFAULT_LATITUDE: 20.2961, DEFAULT_LONGITUDE: 85.8245, DEFAULT_COUNTRY_CODE: 'IN' } },
]

const PRODUCTION_API_URL = 'https://mossaic-igyrquia.b4a.run'
const LOCAL_API_URL = 'http://127.0.0.1:8000'

function getInitialApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')
  const savedUrl = localStorage.getItem('mosaic.baseUrl')?.trim().replace(/\/$/, '')
  const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const savedIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(savedUrl || '')

  // A localhost API stored during development is unreachable from a hosted page.
  if (!isLocalPage && savedIsLocal) {
    localStorage.removeItem('mosaic.baseUrl')
  }

  return configuredUrl || (!isLocalPage && savedIsLocal ? PRODUCTION_API_URL : savedUrl) || (isLocalPage ? LOCAL_API_URL : PRODUCTION_API_URL)
}

const initialConnection = {
  baseUrl: getInitialApiUrl(),
  deviceId: localStorage.getItem('mosaic.deviceId') || 'ESP32_S3_TFT_001',
  token: localStorage.getItem('mosaic.token') || 'dev_token_123',
}

function App() {
  const [page, setPage] = useState('overview')
  const [connection, setConnection] = useState(initialConnection)
  const [snapshot, setSnapshot] = useState(null)
  const [config, setConfig] = useState(null)
  const [consoleToken, setConsoleToken] = useState(sessionStorage.getItem('mosaic.consoleToken') || '')
  const [vaultOpen, setVaultOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [appearance, setAppearance] = useState(() => ({
    theme: localStorage.getItem('mosaic.theme') || 'dark',
    accent: localStorage.getItem('mosaic.accent') || 'violet',
    motion: localStorage.getItem('mosaic.motion') || 'full',
  }))

  useEffect(() => {
    document.documentElement.dataset.theme = appearance.theme
    document.documentElement.dataset.accent = appearance.accent
    document.documentElement.dataset.motion = appearance.motion
    Object.entries(appearance).forEach(([key, value]) => localStorage.setItem(`mosaic.${key}`, value))
  }, [appearance])

  function notify(message, type = 'success') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  async function fetchSnapshot() {
    setBusy(true)
    try {
      const response = await fetch(`${connection.baseUrl}/api/v1/device/dashboard`, {
        headers: { Authorization: `Bearer ${connection.token}`, 'X-Device-Id': connection.deviceId },
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'The dashboard request failed')
      setSnapshot(body.data)
      notify('Live snapshot received')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function unlockVault(token) {
    const response = await fetch(`${connection.baseUrl}/api/v1/configuration`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.detail || 'Could not unlock the provider vault')
    setConsoleToken(token)
    sessionStorage.setItem('mosaic.consoleToken', token)
    setConfig(body.data)
    setVaultOpen(false)
    notify('Provider vault unlocked')
  }

  async function saveProviderKeys(values) {
    const response = await fetch(`${connection.baseUrl}/api/v1/configuration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${consoleToken}` },
      body: JSON.stringify(values),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.detail || 'Could not save provider configuration')
    setConfig(body.data)
    notify('Provider configuration saved')
  }

  function navigate(id) {
    setPage(id)
    setSidebarOpen(false)
  }

  const content = {
    overview: <Overview snapshot={snapshot} busy={busy} fetchSnapshot={fetchSnapshot} navigate={navigate} connection={connection} />,
    tasks: <TasksPage connection={connection} notify={notify} />,
    modules: <Modules snapshot={snapshot} busy={busy} fetchSnapshot={fetchSnapshot} />,
    operations: <Operations connection={connection} notify={notify} />,
    integrations: <Integrations config={config} setVaultOpen={setVaultOpen} saveKeys={saveProviderKeys} />,
    lab: <ApiLab connection={connection} />,
    device: <DeviceSetup connection={connection} setConnection={setConnection} config={config} consoleToken={consoleToken} setConfig={setConfig} notify={notify} />,
    appearance: <AppearanceSettings appearance={appearance} setAppearance={setAppearance} notify={notify} />,
  }[page]

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
      <div className="brand"><Logo /><span>Mosaic</span><small>Console</small></div>
      <div className="nav-label">Workspace</div>
      <nav>{NAV.map(({ id, label, icon: Icon }) =>
        <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}>
          <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{page === id && <ChevronRight className="nav-arrow" size={14} />}
        </button>)}</nav>
      <div className="sidebar-device">
        <span className="device-avatar"><Cpu size={16} /></span>
        <div><strong>{connection.deviceId}</strong><span><i /> Ready for requests</span></div>
      </div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left"><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button><span>{NAV.find(x => x.id === page)?.label}</span></div>
        <div className="api-target"><span className="live-dot" /><span>API</span><code>{connection.baseUrl.replace(/^https?:\/\//, '')}</code></div>
      </header>
      <div key={page} className="page-transition">{content}</div>
    </main>
    {vaultOpen && <UnlockDialog onClose={() => setVaultOpen(false)} onUnlock={unlockVault} />}
    {toast && <div className={`toast ${toast.type}`}><span>{toast.type === 'error' ? <X size={15} /> : <Check size={15} />}</span>{toast.message}</div>}
  </div>
}

function Logo() {
  return <span className="logo" aria-hidden="true"><i /><i /><i /><i /></span>
}

function Overview({ snapshot, busy, fetchSnapshot, navigate, connection }) {
  const openTasks = snapshot?.tasks?.filter(task => !task.completed).length ?? 0
  const availableModules = snapshot ? Object.values(snapshot).filter(Boolean).length : 0
  return <Page>
    <div className="overview-heading">
      <div><p className="kicker">Device control center</p><h1>Good {timeGreeting()}.</h1><p className="lead">Here’s what your display is receiving from the backend.</p></div>
      <button className="button primary" onClick={fetchSnapshot} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}{busy ? 'Fetching' : 'Fetch snapshot'}</button>
    </div>

    <div className="overview-grid">
      <section className="device-preview-card">
        <div className="card-bar"><div><span className="live-dot" /> DISPLAY PREVIEW</div><span>{snapshot ? 'Live payload' : 'Sample payload'}</span></div>
        <DisplayPreview snapshot={snapshot} openTasks={openTasks} />
        <div className="preview-meta"><span><Cpu size={14} /> ESP32-S3</span><span><Radio size={14} /> {connection.deviceId}</span><span><Gauge size={14} /> Firmware 1.0.0</span></div>
      </section>

      <section className="status-card">
        <div className="section-title"><div><p className="kicker">System status</p><h2>Backend pulse</h2></div><span className={`health-badge ${snapshot ? 'healthy' : ''}`}>{snapshot ? 'Healthy' : 'Not checked'}</span></div>
        <StatusLine icon={Server} label="API server" value={snapshot ? 'Responding' : 'Awaiting request'} good={!!snapshot} />
        <StatusLine icon={Boxes} label="Data modules" value={snapshot ? `${availableModules} available` : 'Not measured'} />
        <StatusLine icon={MapPin} label="Weather location" value={snapshot?.weather ? 'Live coordinates' : 'Default location'} />
        <StatusLine icon={Activity} label="Last snapshot" value={snapshot ? 'Just now' : 'No requests yet'} />
      </section>
    </div>

    <div className="summary-row">
      <Summary icon={CloudSun} label="Weather" value={snapshot?.weather ? `${Math.round(snapshot.weather.temperature)}°C` : '—'} note={snapshot?.weather?.provider || 'No snapshot'} />
      <Summary icon={AirVent} label="Air quality" value={snapshot?.air_quality?.aqi_category || '—'} note={snapshot?.air_quality ? `PM2.5 ${snapshot.air_quality.pm2_5}` : 'No snapshot'} />
      <Summary icon={CircleDollarSign} label="Bitcoin" value={snapshot?.crypto?.[0] ? `$${Math.round(snapshot.crypto[0].price_usd).toLocaleString()}` : '—'} note="USD market price" />
      <Summary icon={Check} label="Open tasks" value={snapshot ? String(openTasks) : '—'} note="Pending on device" />
    </div>

    <section className="quick-actions">
      <div className="section-title"><div><p className="kicker">Shortcuts</p><h2>Continue working</h2></div></div>
      <div className="action-grid">
        <Action icon={TerminalSquare} title="Test an endpoint" text="Send requests and inspect the complete response." onClick={() => navigate('lab')} />
        <Action icon={KeyRound} title="Configure providers" text="Add optional API keys through the secure vault." onClick={() => navigate('integrations')} />
        <Action icon={Settings2} title="Update device profile" text="Change the API target, identity, and location." onClick={() => navigate('device')} />
      </div>
    </section>
  </Page>
}

function DisplayPreview({ snapshot, openTasks }) {
  const weather = snapshot?.weather
  return <div className="display-frame">
    <div className="display-header"><span>MOSAIC / HOME</span><span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
    <div className="display-main">
      <div><span className="display-label">CURRENT WEATHER</span><strong>{weather ? `${Math.round(weather.temperature)}°` : '28°'}</strong><small>Feels like {weather ? Math.round(weather.apparent_temperature) : 30}° · Humidity {weather?.humidity ?? 76}%</small></div>
      <CloudSun className="weather-icon" size={72} strokeWidth={1.2} />
    </div>
    <div className="display-stats">
      <div><span>AIR QUALITY</span><strong>{snapshot?.air_quality?.aqi_category || 'Good'}</strong></div>
      <div><span>OPEN TASKS</span><strong>{snapshot ? openTasks : 3}</strong></div>
      <div><span>BTC / USD</span><strong>{snapshot?.crypto?.[0] ? `$${Math.round(snapshot.crypto[0].price_usd).toLocaleString()}` : '$67,450'}</strong></div>
    </div>
  </div>
}

function StatusLine({ icon: Icon, label, value, good }) {
  return <div className="status-line"><span className="line-icon"><Icon size={16} /></span><span>{label}</span><strong>{value}</strong>{good && <Check size={14} className="check" />}</div>
}

function Summary({ icon: Icon, label, value, note }) {
  return <article className="summary-card"><span className="summary-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>
}

function Action({ icon: Icon, title, text, onClick }) {
  return <button className="action-card" onClick={onClick}><span><Icon size={18} /></span><div><strong>{title}</strong><p>{text}</p></div><ArrowUpRight size={16} /></button>
}

function TasksPage({ connection, notify }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', priority: 'medium', due_time: '' })

  useEffect(() => { loadTasks() }, [connection.baseUrl])

  async function loadTasks() {
    setLoading(true)
    try {
      const response = await fetch(`${connection.baseUrl}/api/v1/tasks`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Could not load tasks')
      setTasks(body.data || [])
    } catch (error) { notify(error.message, 'error') } finally { setLoading(false) }
  }

  async function createTask(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`${connection.baseUrl}/api/v1/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, title: form.title.trim(), due_time: form.due_time || null }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Could not create task')
      setTasks(current => [body.data, ...current]); setForm({ title: '', priority: 'medium', due_time: '' }); notify('Task added')
    } catch (error) { notify(error.message, 'error') } finally { setSaving(false) }
  }

  async function toggleTask(taskId) {
    try {
      const response = await fetch(`${connection.baseUrl}/api/v1/tasks/${taskId}/toggle`, { method: 'PATCH' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Could not update task')
      setTasks(current => current.map(task => task.id === taskId ? body.data : task))
    } catch (error) { notify(error.message, 'error') }
  }

  async function deleteTask(taskId) {
    try {
      const response = await fetch(`${connection.baseUrl}/api/v1/tasks/${taskId}`, { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Could not delete task')
      setTasks(current => current.filter(task => task.id !== taskId)); notify('Task removed')
    } catch (error) { notify(error.message, 'error') }
  }

  const visibleTasks = tasks.filter(task => filter === 'all' || (filter === 'open' ? !task.completed : task.completed))
  const openCount = tasks.filter(task => !task.completed).length
  return <Page><PageHeader kicker="Personal workspace" title="Tasks" description="Create and manage the task list synchronized with your desk display." action={<button className="button secondary" onClick={loadTasks} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={15} />Refresh</button>} />
    <div className="task-layout"><form className="task-composer" onSubmit={createTask}><div className="composer-heading"><span className="composer-icon"><Plus size={19} /></span><div><h2>Add a task</h2><p>It will appear in the next device snapshot.</p></div></div><label className="field"><span>Task title</span><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="What needs to be done?" maxLength="120" /></label><div className="field-pair"><label className="field"><span>Priority</span><select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="field"><span>Due time</span><input type="time" value={form.due_time} onChange={event => setForm({ ...form, due_time: event.target.value })} /></label></div><button className="button primary" disabled={saving || !form.title.trim()}>{saving ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}Add task</button></form>
      <section className="task-list-panel"><div className="task-list-header"><div><p className="kicker">Task list</p><h2>{openCount} open <span>· {tasks.length} total</span></h2></div><div className="filter-tabs">{['all','open','completed'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="task-list">{loading ? <div className="task-empty"><LoaderCircle className="spin" size={22} /><strong>Loading tasks</strong></div> : visibleTasks.length ? visibleTasks.map(task => <article className={`task-row ${task.completed ? 'completed' : ''}`} key={task.id}><button className="task-check" onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed ? <CheckCircle size={20} weight="fill" /> : <Circle size={20} />}</button><div className="task-copy"><strong>{task.title}</strong><div><span className={`priority ${task.priority}`}>{task.priority}</span>{task.due_time && <span><Clock size={12} />{task.due_time}</span>}<code>{task.id}</code></div></div><button className="task-delete" onClick={() => deleteTask(task.id)} aria-label="Delete task"><Trash size={16} /></button></article>) : <div className="task-empty"><span><ListChecks size={24} /></span><strong>No {filter === 'all' ? '' : filter} tasks</strong><p>{filter === 'completed' ? 'Completed tasks will collect here.' : 'Add a task to send something useful to your display.'}</p></div>}</div>
      </section></div>
  </Page>
}

const MODULES = [
  { key: 'weather', name: 'Weather', description: 'Temperature, rain, humidity and wind', icon: CloudSun, tone: 'blue' },
  { key: 'air_quality', name: 'Air quality', description: 'PM2.5, PM10 and AQI category', icon: AirVent, tone: 'green' },
  { key: 'calendar', name: 'Calendar', description: 'Public holidays and ICS events', icon: CalendarDots, tone: 'violet' },
  { key: 'tasks', name: 'Tasks', description: 'Device task list and completion state', icon: ListChecks, tone: 'amber' },
  { key: 'crypto', name: 'Crypto', description: 'Digital asset prices and daily movement', icon: ChartLineUp, tone: 'violet' },
  { key: 'fx_rates', name: 'FX rates', description: 'Reference foreign-exchange rates', icon: CircleDollarSign, tone: 'green' },
  { key: 'earthquakes', name: 'Earthquakes', description: 'Recent global seismic events', icon: Waveform, tone: 'red' },
  { key: 'news', name: 'News', description: 'Curated headlines from RSS sources', icon: Newspaper, tone: 'blue' },
  { key: 'space_apod', name: 'Space', description: 'NASA astronomy picture of the day', icon: RocketLaunch, tone: 'violet' },
  { key: 'stocks', name: 'Stocks', description: 'Equity quotes and price changes', icon: ChartLineUp, tone: 'green' },
  { key: 'sports', name: 'Sports', description: 'Fixtures, scores and next F1 race', icon: Trophy, tone: 'amber' },
  { key: 'daily_content', name: 'Daily content', description: 'Quote, trivia and word of the day', icon: Quotes, tone: 'amber' },
  { key: 'media_player', name: 'Media player', description: 'Playback state and track metadata', icon: MusicNotes, tone: 'red' },
]

function Modules({ snapshot, busy, fetchSnapshot }) {
  const activeCount = snapshot ? MODULES.filter(item => hasModuleData(snapshot[item.key])).length : 0
  return <Page>
    <PageHeader kicker="Display payload" title="Data modules" description="Inspect every content source included in the aggregated ESP32 dashboard snapshot." action={<button className="button primary" onClick={fetchSnapshot} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}{busy ? 'Refreshing' : 'Refresh modules'}</button>} />
    <div className="module-summary"><div><span className="module-summary-icon"><TreeStructure size={20} weight="duotone" /></span><div><strong>{snapshot ? `${activeCount} of ${MODULES.length} responding` : 'Snapshot not loaded'}</strong><p>{snapshot ? 'Module state is based on the latest aggregated response.' : 'Fetch the dashboard snapshot to inspect live module availability.'}</p></div></div><span className={`health-badge ${snapshot ? 'healthy' : ''}`}>{snapshot ? 'Live snapshot' : 'Waiting'}</span></div>
    <div className="modules-grid">{MODULES.map(item => <ModuleCard key={item.key} module={item} value={snapshot?.[item.key]} loaded={!!snapshot} />)}</div>
  </Page>
}

function hasModuleData(value) {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

function ModuleCard({ module, value, loaded }) {
  const Icon = module.icon
  const available = loaded && hasModuleData(value)
  return <article className="module-card">
    <div className="module-card-head"><span className={`module-icon ${module.tone}`}><Icon size={19} weight="duotone" /></span><span className={`module-state ${available ? 'active' : ''}`}><i />{available ? 'Available' : loaded ? 'No data' : 'Not checked'}</span></div>
    <h3>{module.name}</h3><p>{module.description}</p>
    <div className="module-preview">{modulePreview(module.key, value, loaded)}</div>
  </article>
}

function modulePreview(key, value, loaded) {
  if (!loaded) return <span>Awaiting snapshot</span>
  if (!hasModuleData(value)) return <span>Provider returned no data</span>
  const previews = {
    weather: () => <><strong>{Math.round(value.temperature)}°C</strong><span>{value.humidity}% humidity</span></>,
    air_quality: () => <><strong>{value.aqi_category}</strong><span>PM2.5 {value.pm2_5}</span></>,
    calendar: () => <><strong>{value.length}</strong><span>upcoming events</span></>,
    tasks: () => <><strong>{value.filter(x => !x.completed).length}</strong><span>open tasks</span></>,
    crypto: () => <><strong>{value.length}</strong><span>tracked assets</span></>,
    fx_rates: () => <><strong>{value.length}</strong><span>currency pairs</span></>,
    earthquakes: () => <><strong>{value.length}</strong><span>recent events</span></>,
    news: () => <><strong>{value.length}</strong><span>headlines</span></>,
    space_apod: () => <><strong className="truncate">{value.title}</strong><span>{value.date}</span></>,
    stocks: () => <><strong>{value.length}</strong><span>market quotes</span></>,
    sports: () => <><strong>{value.matches?.length || 0}</strong><span>active fixtures</span></>,
    daily_content: () => <><strong>{value.quote ? 'Ready' : 'Partial'}</strong><span>daily collection</span></>,
    media_player: () => <><strong className="truncate">{value.title || 'Nothing playing'}</strong><span>{value.artist || 'Media source'}</span></>,
  }
  return previews[key]?.() || <span>Available</span>
}

function Operations({ connection, notify }) {
  const [health, setHealth] = useState(null)
  const [firmware, setFirmware] = useState(null)
  const [busy, setBusy] = useState('')
  const [actionType, setActionType] = useState('TASK_TOGGLE')
  const [targetId, setTargetId] = useState('')
  const headers = { Authorization: `Bearer ${connection.token}`, 'X-Device-Id': connection.deviceId }

  async function checkSystem() {
    setBusy('health')
    try { const response = await fetch(`${connection.baseUrl}/health`); const body = await response.json(); if (!response.ok) throw new Error('Health check failed'); setHealth(body); notify('Backend health verified') } catch (error) { notify(error.message, 'error') } finally { setBusy('') }
  }
  async function checkFirmware() {
    setBusy('firmware')
    try { const response = await fetch(`${connection.baseUrl}/api/v1/firmware/check`, { headers }); const body = await response.json(); if (!response.ok) throw new Error(body.detail || 'Firmware check failed'); setFirmware(body.data); notify('Firmware status received') } catch (error) { notify(error.message, 'error') } finally { setBusy('') }
  }
  async function sendTelemetry() {
    setBusy('telemetry')
    const payload = { events: [{ type: 'heartbeat', uptime_sec: Math.floor(performance.now() / 1000), free_heap: 182400, rssi: -51, source: 'mosaic_console' }] }
    try { const response = await fetch(`${connection.baseUrl}/api/v1/telemetry`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) throw new Error(body.detail || 'Telemetry failed'); notify(`${body.data.processed_events} telemetry event submitted`) } catch (error) { notify(error.message, 'error') } finally { setBusy('') }
  }
  async function executeAction(event) {
    event.preventDefault(); if (!targetId.trim()) return notify('Enter a target ID', 'error')
    setBusy('action')
    try { const response = await fetch(`${connection.baseUrl}/api/v1/device/actions`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'X-Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ action_type: actionType, target_id: targetId.trim(), params: {} }) }); const body = await response.json(); if (!response.ok) throw new Error(body.detail || 'Device action failed'); notify(`Action ${body.data.status.toLowerCase()}`) } catch (error) { notify(error.message, 'error') } finally { setBusy('') }
  }

  return <Page><PageHeader kicker="Device control" title="Operations" description="Run focused checks and send operational commands without opening the full API workbench." />
    <div className="operations-grid">
      <OperationCard icon={Activity} title="Service health" description="Verify that the public API process is reachable." status={health ? health.status : 'Not checked'} active={health?.status === 'healthy'}><button className="button secondary" onClick={checkSystem} disabled={!!busy}>{busy === 'health' && <LoaderCircle className="spin" size={15} />}Run health check</button></OperationCard>
      <OperationCard icon={RocketLaunch} title="Firmware channel" description="Compare the current and latest published versions." status={firmware ? `v${firmware.current_version}` : 'Not checked'} active={!!firmware}><button className="button secondary" onClick={checkFirmware} disabled={!!busy}>{busy === 'firmware' && <LoaderCircle className="spin" size={15} />}Check firmware</button></OperationCard>
      <OperationCard icon={Waveform} title="Telemetry pipeline" description="Submit a sample device heartbeat to the ingestion route." status="Ready" active><button className="button secondary" onClick={sendTelemetry} disabled={!!busy}>{busy === 'telemetry' && <LoaderCircle className="spin" size={15} />}Send heartbeat</button></OperationCard>
    </div>
    <section className="command-panel"><div className="command-intro"><span className="command-icon"><Wrench size={20} weight="duotone" /></span><p className="kicker">Remote command</p><h2>Execute device action</h2><p>Send an idempotent action to the configured device. Task actions currently map to the backend task service.</p></div><form className="command-form" onSubmit={executeAction}><label className="field"><span>Action type</span><select value={actionType} onChange={event => setActionType(event.target.value)}><option>TASK_TOGGLE</option><option>TASK_COMPLETE</option><option>REFRESH_DISPLAY</option><option>REBOOT_DEVICE</option></select></label><label className="field"><span>Target ID</span><input value={targetId} onChange={event => setTargetId(event.target.value)} placeholder="task or device target ID" /></label><button className="button primary" disabled={!!busy}>{busy === 'action' ? <LoaderCircle className="spin" size={16} /> : <Zap size={16} />}Execute action</button></form></section>
  </Page>
}

function OperationCard({ icon: Icon, title, description, status, active, children }) {
  return <article className="operation-card"><div className="operation-head"><span><Icon size={19} weight="duotone" /></span><span className={`module-state ${active ? 'active' : ''}`}><i />{status}</span></div><h3>{title}</h3><p>{description}</p><div className="operation-action">{children}</div></article>
}

function Integrations({ config, setVaultOpen, saveKeys }) {
  return <Page>
    <PageHeader kicker="Data providers" title="Integrations" description="Manage the services that feed your display. Core providers work without credentials." action={<button className="button primary" onClick={() => setVaultOpen(true)}><ShieldCheck size={16} />{config ? 'Refresh vault' : 'Unlock vault'}</button>} />
    <div className="callout"><Zap size={18} /><div><strong>Keyless by default</strong><p>Weather, exchange rates, earthquakes, holidays, and several content sources work without registration.</p></div></div>
    <div className="provider-list">
      {PROVIDERS.map(provider => {
        const providerConfig = config?.providers?.[provider.id]
        const active = !provider.keyed || providerConfig?.configured
        return <article className="provider-row" key={provider.id}>
          <span className="provider-logo">{provider.initials}</span>
          <div className="provider-copy"><strong>{provider.name}</strong><span>{provider.description}</span></div>
          <code>{providerConfig?.masked_value || (!provider.keyed ? 'No key required' : 'Optional')}</code>
          <span className={`provider-state ${active ? 'active' : ''}`}><i />{!provider.keyed ? 'Keyless' : active ? 'Configured' : 'Not configured'}</span>
        </article>
      })}
    </div>
    <ProviderVault config={config} saveKeys={saveKeys} setVaultOpen={setVaultOpen} />
  </Page>
}

function ProviderVault({ config, saveKeys, setVaultOpen }) {
  const [visible, setVisible] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const payload = Object.fromEntries(Object.entries(data).filter(([, value]) => value))
    setSaving(true); setError('')
    try { await saveKeys(payload); event.currentTarget.reset() } catch (error) { setError(error.message) } finally { setSaving(false) }
  }
  if (!config) return <section className="vault-empty"><span><KeyRound size={21} /></span><div><strong>Provider vault is locked</strong><p>Unlock it to view configuration status or update optional keys.</p></div><button className="button secondary" onClick={() => setVaultOpen(true)}>Unlock vault</button></section>
  return <section className="vault-section"><div className="section-title"><div><p className="kicker">Secure runtime config</p><h2>Provider keys</h2></div><span className="session-badge"><ShieldCheck size={13} /> Unlocked for this tab</span></div>
    <form className="key-form" onSubmit={submit}>{PROVIDERS.filter(x => x.keyed).map(provider =>
      <label className="field" key={provider.id}><span>{provider.name}</span><div className="password-field"><input name={provider.id} type={visible[provider.id] ? 'text' : 'password'} placeholder={config.providers?.[provider.id]?.masked_value || 'Enter API key'} autoComplete="off" /><button type="button" onClick={() => setVisible(v => ({ ...v, [provider.id]: !v[provider.id] }))}>{visible[provider.id] ? <EyeOff size={15} /> : <Eye size={15} />}</button></div><small>Leave empty to keep the current value.</small></label>)}
      {error && <div className="form-error key-form-error">{error}</div>}
      <div className="form-footer"><span>Secrets are encrypted in transit when the backend uses HTTPS.</span><button className="button primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Save changes</button></div>
    </form>
  </section>
}

function UnlockDialog({ onClose, onUnlock }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await onUnlock(token) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  return <Dialog.Root open onOpenChange={open => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="modal-backdrop" /><Dialog.Content className="modal">
    <form onSubmit={submit}><div className="modal-icon"><KeyRound size={20} weight="duotone" /></div><Dialog.Close className="modal-close" type="button"><X size={18} /></Dialog.Close>
    <Dialog.Title>Unlock provider vault</Dialog.Title><Dialog.Description>Enter the backend <code>SECRET_KEY</code>. It remains in this browser tab and is not written to local storage.</Dialog.Description>
    <label className="field"><span>Console access key</span><input autoFocus type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Enter SECRET_KEY" /></label>
    {error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><Dialog.Close type="button" className="button secondary">Cancel</Dialog.Close><button className="button primary" disabled={!token || busy}>{busy && <LoaderCircle className="spin" size={16} />}Unlock</button></div></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>
}

function ApiLab({ connection }) {
  const [request, setRequest] = useState(QUICK_REQUESTS[1])
  const [authToken, setAuthToken] = useState(connection.token)
  const [deviceId, setDeviceId] = useState(connection.deviceId)
  const [bodyText, setBodyText] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  function selectRequest(item) {
    setRequest({ ...item })
    setBodyText(item.body ? JSON.stringify(item.body, null, 2) : '')
    setResult(null)
  }
  async function send() {
    setBusy(true); const start = performance.now()
    try {
      let parsedBody
      if (bodyText.trim() && !['GET', 'HEAD'].includes(request.method)) {
        try { parsedBody = JSON.parse(bodyText) } catch { throw new Error('Request body is not valid JSON') }
      }
      const headers = { Authorization: `Bearer ${authToken}`, 'X-Device-Id': deviceId }
      if (parsedBody !== undefined) headers['Content-Type'] = 'application/json'
      if (request.idempotency) headers['X-Idempotency-Key'] = crypto.randomUUID()
      const response = await fetch(`${connection.baseUrl}${request.path}`, { method: request.method, headers, body: parsedBody === undefined ? undefined : JSON.stringify(parsedBody) })
      const body = await response.json(); setResult({ status: `${response.status} ${response.statusText}`, time: Math.round(performance.now() - start), body, ok: response.ok })
    } catch (error) { setResult({ status: 'Network error', time: Math.round(performance.now() - start), body: { error: error.message }, ok: false }) } finally { setBusy(false) }
  }
  return <Page><PageHeader kicker="Developer tools" title="API lab" description="Send focused requests to your backend and inspect the exact response payload." />
    <div className="lab-shell"><aside className="request-sidebar"><div className="request-catalog-title"><span className="subheading">Endpoint catalog</span><b>{QUICK_REQUESTS.length}</b></div>{QUICK_REQUESTS.map((item, index) => <React.Fragment key={`${item.method}-${item.path}`}>{(index === 0 || QUICK_REQUESTS[index - 1].group !== item.group) && <span className="endpoint-group">{item.group}</span>}<button className={request.path === item.path && request.method === item.method ? 'selected' : ''} onClick={() => selectRequest(item)}><span className={`method-tag ${item.method.toLowerCase()}`}>{item.method}</span><div><strong>{item.label}</strong><code>{item.path}</code></div></button></React.Fragment>)}</aside>
      <section className="request-workspace"><div className="request-builder"><select value={request.method} onChange={e => setRequest(r => ({ ...r, method: e.target.value }))}><option>GET</option><option>POST</option><option>PATCH</option><option>DELETE</option></select><input value={request.path} onChange={e => setRequest(r => ({ ...r, path: e.target.value }))} /><button className="button primary" onClick={send} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <ArrowUpRight size={16} />}Send</button></div>
        <div className="request-config">
          <div className="request-section"><p className="subheading">Request headers</p><div className="request-field-grid"><label>Bearer token<input type="password" value={authToken} onChange={e => setAuthToken(e.target.value)} placeholder={request.consoleAuth ? 'Enter backend SECRET_KEY' : 'Device access token'} /></label><label>X-Device-Id<input value={deviceId} onChange={e => setDeviceId(e.target.value)} /></label></div>{request.idempotency && <div className="generated-header"><KeyRound size={13} /> X-Idempotency-Key will be generated automatically.</div>}{request.consoleAuth && <div className="generated-header warning"><ShieldCheck size={13} /> This endpoint expects the backend SECRET_KEY, not the device token.</div>}</div>
          <div className={`request-section body-section ${['GET', 'HEAD'].includes(request.method) ? 'disabled' : ''}`}><div className="body-title"><p className="subheading">JSON body</p>{bodyText && <button onClick={() => setBodyText('')}>Clear</button>}</div><textarea value={bodyText} onChange={e => setBodyText(e.target.value)} disabled={['GET', 'HEAD'].includes(request.method)} spellCheck="false" placeholder={['GET', 'HEAD'].includes(request.method) ? 'This method does not send a body.' : '{\n  "key": "value"\n}'} /></div>
        </div>
        <div className="response-heading"><span>Response</span><div>{result && <><span>{result.time} ms</span><strong className={result.ok ? 'success' : 'failure'}>{result.status}</strong></>}</div></div>
        <pre className="response-code">{JSON.stringify(result?.body || { message: 'Send a request to see the response.' }, null, 2)}</pre>
      </section></div>
  </Page>
}

const THEMES = [
  { id: 'dark', name: 'Graphite', description: 'Balanced dark surfaces with soft contrast', icon: CircleHalf },
  { id: 'midnight', name: 'Midnight', description: 'Cool navy layers for low-light rooms', icon: Moon },
  { id: 'oled', name: 'OLED black', description: 'True black canvas with crisp separation', icon: Monitor },
]

function AppearanceSettings({ appearance, setAppearance, notify }) {
  function choose(key, value) {
    setAppearance(current => ({ ...current, [key]: value }))
    notify(`${key === 'motion' ? 'Motion' : key === 'accent' ? 'Accent' : 'Theme'} updated`)
  }
  return <Page><PageHeader kicker="Personalization" title="Appearance" description="Tune Mosaic for your workspace. Preferences are stored in this browser." />
    <section className="appearance-section"><div className="appearance-heading"><span><Palette size={20} weight="duotone" /></span><div><h2>Interface theme</h2><p>Choose the surface treatment used throughout the console.</p></div></div><div className="theme-grid">{THEMES.map(({ id, name, description, icon: Icon }) => <button key={id} className={`theme-option ${appearance.theme === id ? 'selected' : ''}`} onClick={() => choose('theme', id)}><div className={`theme-preview ${id}`}><span /><span /><span /><i /></div><div className="theme-copy"><span className="theme-radio">{appearance.theme === id && <Check size={12} weight="bold" />}</span><div><strong>{name}</strong><p>{description}</p></div><Icon size={17} /></div></button>)}</div></section>
    <div className="appearance-split"><section className="appearance-section compact"><div className="appearance-heading"><span><Sparkle size={20} weight="duotone" /></span><div><h2>Accent color</h2><p>Used for actions, focus and selected states.</p></div></div><div className="accent-options">{[['violet','#7c6df2'],['blue','#438bd6'],['green','#36a965'],['amber','#c78b32']].map(([id,color]) => <button key={id} aria-label={`${id} accent`} className={appearance.accent === id ? 'selected' : ''} style={{ '--swatch': color }} onClick={() => choose('accent', id)}>{appearance.accent === id && <Check size={14} weight="bold" />}</button>)}</div></section>
      <section className="appearance-section compact"><div className="appearance-heading"><span><Sparkle size={20} weight="duotone" /></span><div><h2>Interface motion</h2><p>Control transitions and staged content entry.</p></div></div><div className="motion-control"><button className={appearance.motion === 'full' ? 'active' : ''} onClick={() => choose('motion','full')}>Full motion</button><button className={appearance.motion === 'reduced' ? 'active' : ''} onClick={() => choose('motion','reduced')}>Reduced</button></div></section></div>
    <section className="motion-demo"><div><span className="demo-orbit"><i /></span><div><strong>Motion preview</strong><p>Navigation and content use short, purposeful transitions.</p></div></div><span className="session-badge">{appearance.motion === 'full' ? 'Animations on' : 'Reduced motion'}</span></section>
  </Page>
}

function DeviceSetup({ connection, setConnection, config, consoleToken, setConfig, notify }) {
  const defaults = config?.defaults || { DEFAULT_LATITUDE: 20.2961, DEFAULT_LONGITUDE: 85.8245, DEFAULT_COUNTRY_CODE: 'IN' }
  const [form, setForm] = useState({ ...connection, latitude: defaults.DEFAULT_LATITUDE, longitude: defaults.DEFAULT_LONGITUDE, country: defaults.DEFAULT_COUNTRY_CODE })
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }) }
  async function submit(event) {
    event.preventDefault(); const next = { baseUrl: form.baseUrl.replace(/\/$/, ''), deviceId: form.deviceId, token: form.token }; setConnection(next)
    Object.entries(next).forEach(([key, value]) => localStorage.setItem(`mosaic.${key}`, value))
    if (consoleToken) {
      try { const response = await fetch(`${next.baseUrl}/api/v1/configuration`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${consoleToken}` }, body: JSON.stringify({ DEFAULT_LATITUDE: Number(form.latitude), DEFAULT_LONGITUDE: Number(form.longitude), DEFAULT_COUNTRY_CODE: form.country.toUpperCase() }) }); if (response.ok) setConfig((await response.json()).data) } catch { /* connection settings remain saved locally */ }
    }
    notify('Device profile saved')
  }
  return <Page><PageHeader kicker="Hardware profile" title="Device setup" description="Configure the connection used by this browser and the location defaults used by the API." />
    <form className="settings-form" onSubmit={submit}>
      <SettingsSection number="01" icon={Server} title="API connection" description="The backend address and device identity sent with requests.">
        <Field label="Backend URL"><input name="baseUrl" value={form.baseUrl} onChange={update} /></Field>
        <Field label="Device ID"><input name="deviceId" value={form.deviceId} onChange={update} /></Field>
        <Field label="Device access token"><input name="token" type="password" value={form.token} onChange={update} /></Field>
      </SettingsSection>
      <SettingsSection number="02" icon={Globe2} title="Default location" description="Coordinates used by weather, air quality, and calendar services.">
        <div className="field-pair"><Field label="Latitude"><input name="latitude" type="number" step="any" value={form.latitude} onChange={update} /></Field><Field label="Longitude"><input name="longitude" type="number" step="any" value={form.longitude} onChange={update} /></Field></div>
        <Field label="Country code"><input name="country" maxLength="2" value={form.country} onChange={update} /></Field>
        {!consoleToken && <div className="inline-note"><KeyRound size={15} /> Unlock the provider vault to save location defaults to the backend.</div>}
      </SettingsSection>
      <div className="save-bar"><div><ShieldCheck size={16} /><span>Connection credentials remain in this browser.</span></div><button className="button primary"><Save size={16} />Save device profile</button></div>
    </form>
  </Page>
}

function SettingsSection({ number, icon: Icon, title, description, children }) {
  return <section className="settings-section"><div className="settings-intro"><span className="section-number">{number}</span><span className="settings-icon"><Icon size={18} /></span><h2>{title}</h2><p>{description}</p></div><div className="settings-fields">{children}</div></section>
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function Page({ children }) { return <div className="page">{children}</div> }
function PageHeader({ kicker, title, description, action }) { return <div className="page-header"><div><p className="kicker">{kicker}</p><h1>{title}</h1><p className="lead">{description}</p></div>{action}</div> }
function timeGreeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening' }

createRoot(document.getElementById('app')).render(<React.StrictMode><App /></React.StrictMode>)
