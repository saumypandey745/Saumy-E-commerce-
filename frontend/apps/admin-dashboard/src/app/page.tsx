"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Users, Store, ShieldAlert, Cpu, Database, Server, Settings, Search, AlertOctagon } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('global');
  
  const [systemHealth, setSystemHealth] = useState({
    cpu: '0%',
    memory: '0 GB / 0 GB',
    active_pods: 0,
    errors_1h: 0,
    api_latency: '0ms'
  });
  
  const [businessStats, setBusinessStats] = useState({ revenue_today: 0, active_users: 0, pending_kyc: 0, api_calls: 0 });
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>('');

  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/stream`;
    const sse = new EventSource(sseUrl);
    
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT') return;
      
      setSystemHealth(data.systemHealth);
      setBusinessStats(data.business);
      setContainers(data.containers || []);
      
      if (data.security_events && data.security_events.length > 0) {
        setSecurityEvents(prev => [...data.security_events, ...prev].slice(0, 10)); // keep last 10
      }
    };

    return () => sse.close();
  }, []);

  const fetchLogs = async (name: string) => {
    setSelectedContainer(name);
    setContainerLogs('Loading logs...');
    try {
      const logsUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/containers/${name}/logs`;
      const res = await fetch(logsUrl);
      const text = await res.text();
      setContainerLogs(text);
    } catch (e) {
      setContainerLogs('Failed to fetch logs.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Today's Revenue" value={`$${businessStats.revenue_today.toLocaleString()}`} isPositive />
              <StatCard title="Active Users" value={businessStats.active_users.toLocaleString()} isPositive />
              <StatCard title="API Traffic" value={businessStats.api_calls.toLocaleString()} isPositive />
              <StatCard title="Pending KYC" value={businessStats.pending_kyc} isAlert icon={AlertOctagon} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Security Alerts */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  {/* @ts-ignore */}
                  <ShieldAlert className="text-red-500" size={20} />
                  <h3 className="font-bold text-gray-900">Security & Fraud Alerts</h3>
                </div>
                <ul className="space-y-3">
                  {securityEvents.length === 0 ? (
                    <li className="text-sm text-gray-500">No recent security alerts.</li>
                  ) : (
                    securityEvents.map((evt, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-mono text-xs">{evt.data.type}: {evt.data.ip} - {evt.data.path}</span>
                        <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Investigate</button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* System Health */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm text-slate-300">
                <div className="flex items-center gap-2 mb-4">
                  {/* @ts-ignore */}
                  <Activity className="text-emerald-400" size={20} />
                  <h3 className="font-bold text-white">Live Cluster Health</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">API Latency</p>
                    <p className="text-lg font-mono text-emerald-400">{systemHealth.api_latency}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Error Rate (1h)</p>
                    <p className="text-lg font-mono text-white">{systemHealth.errors_1h}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Kubernetes Pods</p>
                    <p className="text-lg font-mono text-white">{systemHealth.active_pods} Active</p>
                  </div>
                  <div>
                    <p className="text-slate-500">CPU Usage</p>
                    <p className="text-lg font-mono text-white">{systemHealth.cpu}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">User Management Interface - Fetching Data...</div>;
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold">System Health Exports</h2>
              <div className="flex gap-4">
                <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/reports/system?format=pdf`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-red-600 text-white rounded font-semibold text-sm hover:bg-red-700">Export PDF</a>
                <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitoring/reports/system?format=csv`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm hover:bg-green-700">Export CSV</a>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              Additional Analytics features coming soon.
            </div>
          </div>
        );
      case 'sellers':
        return <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center text-gray-500">Seller KYC Approval Interface - 142 Pending</div>;
      case 'devops':
        return <div className="bg-slate-900 p-8 rounded-xl text-center text-emerald-400 font-mono">Connecting to Kubernetes Prometheus...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="font-bold text-white text-lg tracking-tight">System<span className="text-indigo-400">Control</span></span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Command Center</p>
          <SidebarButton active={activeTab === 'global'} onClick={() => setActiveTab('global')} icon={Activity} label="Global Dashboard" />
          <SidebarButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="User Management" />
          <SidebarButton active={activeTab === 'sellers'} onClick={() => setActiveTab('sellers')} icon={Store} label="Seller Approvals" />
          
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">DevOps & Security</p>
          <SidebarButton active={activeTab === 'devops'} onClick={() => setActiveTab('devops')} icon={Server} label="System Monitoring" />
          <SidebarButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={ShieldAlert} label="Security Center" />
          <SidebarButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Database} label="Audit Logs" />
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Role: SUPER_ADMIN</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </aside>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg w-96">
            {/* @ts-ignore */}
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Search users, orders, logs..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-4">
            {/* @ts-ignore */}
            <button className="text-gray-500 hover:text-gray-900"><Settings size={20} /></button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">SA</div>
          </div>
        </header>
        
        <div className="p-8 overflow-y-auto h-full bg-gray-50">
          {renderContent()}

          {/* Container List for Ops View - quick hack for visibility on global tab */}
          {activeTab === 'global' && containers.length > 0 && (
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Kubernetes Pod Status (Live)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {containers.map(c => (
                  <div key={c.name} className="p-4 border rounded shadow-sm text-sm">
                    <div className="font-bold text-indigo-700">{c.name}</div>
                    <div>State: {c.state} ({c.status})</div>
                    <div>CPU: {c.cpu} | Mem: {c.mem}</div>
                    <button onClick={() => fetchLogs(c.name)} className="mt-2 text-xs bg-gray-800 text-white px-2 py-1 rounded">View Logs</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Log Viewer Modal */}
        {selectedContainer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-6 rounded-lg w-[800px] h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Logs: {selectedContainer}</h3>
                <button onClick={() => setSelectedContainer(null)} className="text-white font-bold">X</button>
              </div>
              <pre className="text-green-400 font-mono text-xs overflow-y-auto flex-1 bg-black p-4 rounded border border-gray-700">
                {containerLogs}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function StatCard({ title, value, isAlert = false, trend, isPositive, icon: Icon }: any) {
  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm ${isAlert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start">
        <h3 className={`text-sm font-medium ${isAlert ? 'text-red-700' : 'text-gray-500'}`}>{title}</h3>
        {Icon && <Icon size={18} className="text-red-500" />}
      </div>
      <p className={`text-3xl font-bold mt-2 ${isAlert ? 'text-red-900' : 'text-gray-900'}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend} from last month
        </p>
      )}
    </div>
  );
}
