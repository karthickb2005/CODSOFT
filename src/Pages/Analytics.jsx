import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Target, Clock,
  CheckCircle2, AlertTriangle, Activity, Zap, Loader2, RefreshCw, BarChart
} from 'lucide-react';
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch, isRefetching } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: () => base44.integrations.Analytics.summary(),
  });

  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  useEffect(() => {
    if (analyticsError || tasksError) {
      toast.error('Failed to load analytics data');
    }
  }, [analyticsError, tasksError]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Analytics refreshed');
    } catch (err) {
      toast.error('Failed to refresh analytics');
    }
  };

  if (analyticsLoading || tasksLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (analyticsError || tasksError) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Card className="max-w-md border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Analytics Unavailable</h3>
            <p className="text-slate-400 mb-6">Failed to load workspace analytics. The server may be in API-only mode.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { monthlyThroughput = [], priorityDist = [], userProductivity = [] } = analytics || {};

  // Local calculations for real-time vibe
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueCount = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;

  const chartData = monthlyThroughput.map(d => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d._id - 1],
    total: d.count,
    completed: d.completed
  }));

  const pieData = priorityDist.map((d, i) => ({
    name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    value: d.count,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Workspace Analytics</h1>
            <p className="text-slate-400">Detailed performance metrics and task throughput</p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          className="border-slate-700 hover:bg-slate-800 text-slate-300 transition-all"
        >
          {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="h-24 w-24 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Global Completion</p>
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-4xl font-bold text-white">{completionRate}%</h2>
            <Badge className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              Optimal
            </Badge>
          </div>
          <Progress value={completionRate} className="h-2 bg-slate-800" />
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="h-24 w-24 text-red-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Risk Factor (Overdue)</p>
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-4xl font-bold text-white">{overdueCount}</h2>
            <span className="text-xs text-red-400 mb-2 font-mono uppercase tracking-widest">Urgent Attention</span>
          </div>
          <p className="text-xs text-slate-500">Tasks exceeding their established deadlines</p>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="h-24 w-24 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Total Impact</p>
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-4xl font-bold text-white">{totalTasks}</h2>
            <span className="text-xs text-blue-400 mb-2 font-mono uppercase tracking-widest">Active Entities</span>
          </div>
          <p className="text-xs text-slate-500">Total volume of managed tasks in system</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Throughput Chart */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Monthly Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorDone)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-slate-400 text-sm font-medium ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Productivity (Lower Section) */}
      {userProductivity.length > 0 && (
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Leadership Board (Productivity)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {userProductivity.map((user, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{user._id || 'Unassigned'}</span>
                    </div>
                    <span className="text-xs text-slate-500">{user.completed} / {user.total} tasks</span>
                  </div>
                  <Progress value={(user.completed / user.total) * 100} className="h-1.5 bg-slate-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
