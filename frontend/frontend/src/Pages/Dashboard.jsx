import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { api, base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderKanban, ListTodo, Users, TrendingUp, Clock, AlertTriangle,
  CheckCircle2, Sparkles, Brain, ArrowRight, Plus, Calendar, Target,
  Zap, BarChart3, Activity
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

import StatsCard from '@/components/dashboard/StatsCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import TaskItem from '@/components/dashboard/TaskItem';
import AIInsightCard from '@/components/dashboard/AIInsightCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import ProgressChart from '@/components/charts/ProgressChart';
import WorkloadChart from '@/components/charts/WorkloadChart';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalTasks: 0,
    myTasks: 0,
    teamMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: user, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teamMember } = useQuery({
    queryKey: ['teamMember', user?.email],
    queryFn: () => base44.entities.TeamMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    select: (data) => data?.[0],
  });

  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ is_archived: false }, '-created_date', 50),
  });

  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true }),
  });

  const { data: aiInsights = [] } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: () => base44.entities.AIAnalysis.filter({ is_applied: false }, '-created_date', 10),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 20),
  });

  const isAnyError = authError || projectsError || tasksError;

  useEffect(() => {
    if (isAnyError) {
      toast.error('Failed to load dashboard data');
    }
  }, [isAnyError]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      console.log("[PHASE3_FETCH_START] Fetching stats from backend...");
      try {
        const response = await api.get('/api/dashboard/stats');
        if (response.data.success) {
          setStats(response.data);
          console.log("[PHASE3_FETCH_SUCCESS] Dashboard stats received");
        }
      } catch (error) {
        console.error("[PHASE3_FETCH_ERROR] Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Calculate stats
  const myTasks = tasks.filter(t => t.assignee_email === user?.email);
  const myPendingTasks = myTasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status));
  const overdueTasksCount = tasks.filter(t =>
    t.due_date && t.status !== 'done' && isBefore(new Date(t.due_date), new Date())
  ).length;

  const taskStats = {
    completed: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    review: tasks.filter(t => t.status === 'review').length,
    backlog: tasks.filter(t => t.status === 'backlog').length,
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const atRiskProjects = projects.filter(p => p.health_status === 'at_risk' || p.health_status === 'critical');

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const thisWeekTasks = tasks.filter(t =>
    t.due_date && isWithinInterval(new Date(t.due_date), { start: weekStart, end: weekEnd })
  );

  const upcomingTasks = tasks
    .filter(t => t.assignee_email === user?.email && t.status !== 'done' && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Calendar className="w-4 h-4 mr-2" />
            {format(new Date(), 'MMM d, yyyy')}
          </Button>
          <Link to={createPageUrl('Tasks') + '?new=true'}>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Projects"
          value={loading ? <Skeleton className="h-9 w-20 bg-slate-700" /> : stats.activeProjects}
          icon={FolderKanban}
          iconColor="violet"
          change={12}
          changeType="increase"
        />
        <StatsCard
          title="Total Tasks"
          value={loading ? <Skeleton className="h-9 w-16 bg-slate-700" /> : stats.totalTasks}
          icon={ListTodo}
          iconColor="blue"
          subtitle={`${taskStats.completed} completed`}
        />
        <StatsCard
          title="My Tasks"
          value={loading ? <Skeleton className="h-9 w-14 bg-slate-700" /> : stats.myTasks}
          icon={Target}
          iconColor="emerald"
          subtitle="Pending tasks"
        />
        <StatsCard
          title="Team Members"
          value={loading ? <Skeleton className="h-9 w-12 bg-slate-700" /> : stats.teamMembers}
          icon={Users}
          iconColor="amber"
          subtitle={`${members.filter(m => m.burnout_risk === 'low').length} healthy`}
        />
      </div>

      {/* AI Insights Banner */}
      {aiInsights.length > 0 && (
        <Card className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {aiInsights.length} AI recommendation{aiInsights.length > 1 ? 's' : ''} available
                </p>
                <p className="text-xs text-violet-300/80">
                  TaskPilot AI has identified optimization opportunities for your workflow
                </p>
              </div>
              <Link to={createPageUrl('AIInsights')}>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Tasks Section */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                My Upcoming Tasks
              </CardTitle>
              <Link to={createPageUrl('Tasks')}>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map(task => (
                    <TaskItem key={task.id} task={task} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-400">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-violet-400" />
                Active Projects
              </h2>
              <Link to={createPageUrl('Projects')}>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.slice(0, 4).map(project => (
                <Link key={project.id} to={createPageUrl('Projects') + `?id=${project.id}`}>
                  <ProjectCard project={project} />
                </Link>
              ))}
              {activeProjects.length === 0 && (
                <Card className="col-span-2 bg-slate-800/50 border-slate-700/50 p-8 text-center">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No active projects</p>
                  <Link to={createPageUrl('Projects') + '?new=true'}>
                    <Button size="sm" className="mt-4 bg-violet-600 hover:bg-violet-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>

          {/* Risk Alerts */}
          {(overdueTasksCount > 0 || atRiskProjects.length > 0) && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {overdueTasksCount > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400" />
                      <span className="text-sm text-slate-300">{overdueTasksCount} overdue task{overdueTasksCount > 1 ? 's' : ''}</span>
                    </div>
                    <Link to={createPageUrl('Tasks') + '?filter=overdue'}>
                      <Button size="sm" variant="ghost" className="text-rose-400">View</Button>
                    </Link>
                  </div>
                )}
                {atRiskProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-slate-300">{project.name} is at risk</span>
                    </div>
                    <Link to={createPageUrl('Projects') + `?id=${project.id}`}>
                      <Button size="sm" variant="ghost" className="text-amber-400">View</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Charts & Activity */}
        <div className="space-y-6">
          {/* Task Distribution */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ProgressChart data={taskStats} />
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-48">
                <WorkloadChart members={members} />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                <ActivityFeed activities={activities} maxItems={10} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}