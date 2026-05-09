import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardStats from './components/DashboardStats';
import Terminal from './components/Terminal';
import HistoryTable from './components/HistoryTable';
import MissionModal from './components/MissionModal';
import { Target, Terminal as TermIcon, Play, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isHunting, setIsHunting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [language, setLanguage] = useState('python');
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [unreadLogs, setUnreadLogs] = useState(0); // badge count for God Mode tab
  const [aiInfo, setAiInfo] = useState({ provider: 'Loading...', model: '' });

  const wsRef = useRef(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((message, type = 'normal') => {
    const id = logIdRef.current++;
    setLogs(prev => [...prev, { id, message, type }]);
    setUnreadLogs(prev => prev + 1);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('devbounty_history');
    if (saved) setHistory(JSON.parse(saved));

    let isClosed = false;

    const connectWs = () => {
      if (isClosed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.DEV ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/logs`;

      let ws;
      try { ws = new WebSocket(wsUrl); }
      catch { setTimeout(connectWs, 3000); return; }

      ws.onopen = () => {
        setWsStatus('online');
        addLog('Agent Online ✅ — Listening for commands.', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;

          if (data.type === 'completion') {
            if (data.status === 'success') {
              setReport(data);
              setHistory(prev => {
                const newHist = [{ repo: data.repo, issue_title: data.issue_title, pr_url: data.pr_url }, ...prev];
                localStorage.setItem('devbounty_history', JSON.stringify(newHist));
                return newHist;
              });
              addLog('🎉 Mission Complete! Report is ready.', 'success');
            } else {
              addLog('Mission failed. See logs.', 'error');
            }
            setIsHunting(false);
          } else if (data.message) {
            addLog(data.message, data.type || 'normal');
          }
        } catch {
          addLog(event.data, 'normal');
        }
      };

      ws.onclose = () => {
        setWsStatus('offline');
        if (!isClosed) setTimeout(connectWs, 2000);
      };

      wsRef.current = ws;
    };

    const fetchStatus = async () => {
      try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
        const res = await fetch(`${baseUrl}/api/status`);
        const data = await res.json();
        setAiInfo(data);
      } catch (err) { console.error("Status fetch failed", err); }
    };

    connectWs();
    fetchStatus();

    // Heartbeat to keep connection alive
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => { 
      isClosed = true; 
      clearInterval(ping);
      wsRef.current?.close(); 
    };
  }, [addLog]);

  // Badge management
  useEffect(() => {
    if (activeTab === 'terminal') setUnreadLogs(0);
  }, [activeTab]);

  const startHunt = async () => {
    setIsHunting(true);
    setLogs([]);
    logIdRef.current = 0;
    setUnreadLogs(0);
    setActiveTab('terminal');

    try {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
      const response = await fetch(`${baseUrl}/api/start-hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, labels: 'bug' })
      });

      const data = await response.json();
      if (data.status !== 'started') {
        setIsHunting(false);
        addLog('Initialization failed.', 'error');
      }
    } catch (err) {
      setIsHunting(false);
      addLog(`Request error: ${err.message}`, 'error');
    }
  };

  const wsIndicator = {
    online:      { color: 'bg-emerald-400', label: 'LIVE' },
    offline:     { color: 'bg-red-500 animate-pulse', label: 'OFFLINE' },
    connecting:  { color: 'bg-yellow-400 animate-pulse', label: 'CONNECTING' },
  }[wsStatus];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <nav className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <Shield className="text-slate-900 h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Dev<span className="text-emerald-400">Bounty</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold opacity-80">Autonomous Agent</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-[10px] font-bold text-slate-400">
                ENGINE: <span className="ml-1 text-emerald-400 uppercase">{aiInfo.provider} {aiInfo.model}</span>
              </div>

              {/* WebSocket status indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${wsIndicator.color}`} />
                <span className="font-mono">{wsIndicator.label}</span>
              </div>

              {/* Tab switcher */}
              <div className="flex items-center space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <Target size={15} className="mr-2" /> Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`relative px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center ${activeTab === 'terminal' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <TermIcon size={15} className="mr-2" /> God Mode
                  {/* Unread badge */}
                  {unreadLogs > 0 && activeTab !== 'terminal' && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadLogs > 9 ? '9+' : unreadLogs}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content — BOTH views are always mounted, just hidden via CSS.
          This means logs never get lost when switching tabs! */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Dashboard */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardStats history={history} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Deploy panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white flex items-center mb-4">
                  <Target className="text-emerald-400 mr-2" size={20} /> Deploy Agent
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 transition-colors focus:outline-none focus:border-emerald-500"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="java">Java</option>
                      <option value="go">Go</option>
                    </select>
                  </div>

                  <button
                    onClick={startHunt}
                    disabled={isHunting}
                    className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95"
                  >
                    {isHunting ? (
                      <><div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-400 rounded-full animate-spin mr-2" /> Hunting...</>
                    ) : (
                      <><Play size={18} className="mr-2" /> Initiate Hunt Sequence</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-white flex items-center mb-4">
                <TermIcon className="text-cyan-400 mr-2" size={20} /> Mission History
              </h3>
              <HistoryTable history={history} />
            </div>
          </div>
        </div>

        {/* God Mode Terminal — always mounted so logs persist */}
        <div className={activeTab === 'terminal' ? 'block' : 'hidden'}>
          <h3 className="text-lg font-bold text-white flex items-center mb-4">
            <TermIcon className="text-violet-400 mr-2" size={20} /> Live Execution Logs
          </h3>
          <Terminal logs={logs} isHunting={isHunting} />
        </div>

      </main>

      <MissionModal report={report} onClose={() => setReport(null)} />
    </div>
  );
}
