import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/api/base44Client';
import { API_BASE_URL } from '../config/api';
import { io } from 'socket.io-client';
import {
    Activity,
    ShieldAlert,
    Cpu,
    TrendingDown,
    Play,
    Settings,
    Zap,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle
} from 'lucide-react';

const AICommandCenter = () => {
    const [metrics, setMetrics] = useState(null);
    const [simulation, setSimulation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [liveLogs, setLiveLogs] = useState([]);
    const [config, setConfig] = useState({
        chaosMode: false,
        digitalTwinMode: false
    });

    const fetchData = async () => {
        try {
            const metricsRes = await api.get(`/api/system/metrics`);
            const simRes = await api.get(`/api/system/simulation/report`);

            setMetrics(metricsRes.data.data || metricsRes.data);
            setSimulation(simRes.data.data || simRes.data);
            setConfig({
                chaosMode: metricsRes.data.data?.chaosMode === 'true',
                digitalTwinMode: metricsRes.data.data?.digitalTwinMode === 'true'
            });
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch AI metrics:', err);
            toast.error('Failed to connect to AI Command Center backend');
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Polling as fallback (slower when live)

        // WebSocket Integration
        const token = localStorage.getItem('token');
        const socket = io('/', { auth: { token } });

        socket.on('connect', () => {
            setIsLive(true);
            socket.emit('join-ai-ops');
        });

        socket.on('ai_event', (event) => {
            setLiveLogs(prev => [event, ...prev].slice(0, 50));

            // Reactive metrics updates for specific event types
            if (event.type === 'optimizerUpdate') {
                setMetrics(prev => ({
                    ...prev,
                    aiOptimizer: { rankings: event.rankings, stats: event.stats }
                }));
            }
            if (event.type === 'simulationComplete') {
                setSimulation(event.report);
            }
            if (event.type === 'providerBlacklist') {
                setMetrics(prev => ({
                    ...prev,
                    aiGovernance: {
                        ...prev.aiGovernance,
                        providerBlacklist: [...prev.aiGovernance.providerBlacklist, event.provider]
                    }
                }));
            }
        });

        socket.on('disconnect', () => setIsLive(false));

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    const runSimulation = async () => {
        setSimulating(true);
        try {
            const res = await api.post(`/api/system/simulation/run`, { batchSize: 50 });
            setSimulation(res.data.data || res.data);
            toast.success('Simulation executed successfully');
        } catch (err) {
            console.error('Simulation failed:', err);
            toast.error('Simulation execution failed');
        } finally {
            setSimulating(false);
        }
    };

    const toggleMode = async (mode) => {
        const newValue = !config[mode];
        try {
            await api.patch(`/api/system/governance/config`, { [mode]: newValue });
            setConfig(prev => ({ ...prev, [mode]: newValue }));
            toast.success(`${mode} toggled to ${newValue ? 'ON' : 'OFF'}`);
        } catch (err) {
            console.error(`Failed to toggle ${mode}:`, err);
            toast.error(`Failed to toggle ${mode}`);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Initializing AI Command Center...</div>;

    const { aiOptimizer, aiGovernance, aiCostControl } = metrics;

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Cpu className="text-indigo-600" />
                        AI Command Center
                    </h1>
                    <p className="text-slate-500">Autonomous Governance & Real-time Operations Console</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isLive ? 'LIVE Ops' : 'POLLING'}
                    </div>
                    <button
                        onClick={() => toggleMode('chaosMode')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${config.chaosMode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-200 text-slate-600'
                            }`}
                    >
                        <Zap size={18} /> Chaos Mode: {config.chaosMode ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={runSimulation}
                        disabled={simulating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 transition-all"
                    >
                        {simulating ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
                        Run Simulation
                    </button>
                </div>
            </header>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Provider Rankings */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingDown className="text-indigo-500" />
                        Provider Performance & Ranking
                    </h2>
                    <div className="space-y-4">
                        {aiOptimizer.rankings.map((rank, idx) => {
                            const stats = aiOptimizer.stats[rank.provider];
                            const isBlacklisted = aiGovernance.providerBlacklist.includes(rank.provider);

                            return (
                                <div key={rank.provider} className={`p-4 rounded-xl border-2 transition-all ${isBlacklisted ? 'bg-red-50 border-red-100 opacity-70' :
                                    idx === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${isBlacklisted ? 'bg-red-500' : rank.provider === 'gemini' ? 'bg-blue-500' : 'bg-emerald-500'
                                                }`}>
                                                {rank.provider[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                    {rank.provider.toUpperCase()}
                                                    {isBlacklisted && <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded">BLACKLISTED</span>}
                                                    {idx === 0 && !isBlacklisted && <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded">AUTO-RANK: #1</span>}
                                                </h3>
                                                <p className="text-xs text-slate-500">Score: {rank.score} • Adaptive Timeout: {rank.timeout}ms</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-700">Latency: {stats.latency[stats.latency.length - 1] || 0}ms</p>
                                            <p className="text-xs text-slate-500">Success Rate: {((stats.successCount / (stats.totalCount || 1)) * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isBlacklisted ? 'bg-red-400' : 'bg-indigo-500'}`}
                                            style={{ width: `${rank.score * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Governance & Budget */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-rose-500" />
                            Governance & Budget
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600 flex items-center gap-2 text-sm">
                                    <Clock size={16} /> SLA Max Latency
                                </span>
                                <span className="font-mono font-bold">{aiGovernance.activePolicies.maxLatencySLA}ms</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Monthly Budget Usage</span>
                                    <span className="font-bold text-slate-700">{aiCostControl.usagePercent}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${parseFloat(aiCostControl.usagePercent) > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${aiCostControl.usagePercent}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider">
                                    Throttling Grade: {parseFloat(aiCostControl.usagePercent) > 80 ? 'CONSERVE' : 'PERFORMANCE'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Activity className="text-indigo-200" />
                                Latest Simulation
                            </h2>
                            {simulation ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-indigo-300 uppercase">Improvement</p>
                                        <p className="text-xl font-bold">{simulation.improvementScore}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-indigo-300 uppercase">Risk Level</p>
                                        <p className={`text-xl font-bold ${simulation.improvementScore < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {simulation.improvementScore < 80 ? 'HIGH' : 'LOW'}
                                        </p>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-indigo-800">
                                        <p className="text-[10px] text-indigo-300 uppercase mb-1">Provider Spread</p>
                                        <div className="flex gap-2">
                                            {Object.entries(simulation.providerDistribution).map(([p, count]) => (
                                                <div key={p} className="bg-indigo-800 px-2 py-1 rounded text-[10px]">
                                                    {p}: {count}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm italic">No simulation data available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Observability Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="text-slate-500" />
                    Real-time Operations Feed
                </h2>
                <div className="font-mono text-[11px] space-y-2 bg-slate-900 p-4 rounded-lg text-indigo-300 h-64 overflow-y-auto">
                    {liveLogs.length > 0 ? liveLogs.map((log, i) => (
                        <div key={i} className="flex gap-4 border-b border-slate-800 pb-1 last:border-0 hover:bg-slate-800/50">
                            <span className="text-slate-500 w-24">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span className={`w-32 font-bold ${log.type.includes('Error') || log.type.includes('Failure') || log.type.includes('Blacklist') || log.state === 'OPEN' ? 'text-rose-400' :
                                log.type.includes('Update') || log.state === 'HALF_OPEN' ? 'text-indigo-400' : 'text-emerald-400'
                                }`}>
                                {log.type.toUpperCase()}
                            </span>
                            <span className="flex-1 text-slate-300">
                                {log.type === 'policyDecision' ? `Traffic: ${log.decision.trafficClass.toUpperCase()} | RID: ${log.requestId}` :
                                    log.type === 'circuitStateChange' ? `Service: ${log.serviceName} -> ${log.state}` :
                                        log.type === 'providerBlacklist' ? `BLACKLISTED: ${log.provider} (${log.reason})` :
                                            log.type === 'optimizerUpdate' ? `Ranking Recalculated (Top: ${log.rankings[0].provider})` :
                                                log.type === 'simulationComplete' ? `Simulation ${log.requestId || ''} Score: ${log.report.improvementScore}%` :
                                                    JSON.stringify(log.metadata || log)}
                            </span>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                            <Activity className="animate-pulse" />
                            Waiting for live events...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
