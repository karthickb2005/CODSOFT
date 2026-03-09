import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44, api } from '@/api/base44Client';
import { API_BASE_URL } from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, LayoutGrid, List, Kanban, Calendar, Filter,
  AlertTriangle, CheckCircle2, Clock, Loader2, Brain, Sparkles, Video
} from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import TaskForm from '@/components/tasks/TaskForm';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import TaskItem from '@/components/dashboard/TaskItem';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const meetLink = params.get("meetLink");

    if (meetLink) {
      console.log("Meet link detected:", meetLink);

      // Open meeting
      window.open(meetLink, "_blank");

      // Share to chat if project context is available
      const lastProjectId = localStorage.getItem('lastProjectId');
      if (lastProjectId) {
        const token = localStorage.getItem('token');
        const socket = io(API_BASE_URL.replace('/api', ''), {
          auth: { token },
          transports: ['websocket']
        });
        socket.emit('sendMessage', {
          projectId: lastProjectId,
          message: `📹 Google Meet: ${meetLink}`
        });
        setTimeout(() => socket.disconnect(), 2000);
      }

      // Clean URL to stop infinite reload
      window.history.replaceState({}, document.title, "/tasks");
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ is_archived: false }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true }),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskToDelete(null);
    },
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === 'all' || t.project_id === projectFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const handleCreateTask = (data) => {
    const project = projects.find(p => p.id === data.project_id);
    createTaskMutation.mutate({
      ...data,
      workspace_id: project?.workspace_id,
      organization_id: project?.organization_id,
      estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : undefined,
    });
  };

  const handleUpdateTask = (data) => {
    updateTaskMutation.mutate({
      id: editingTask.id,
      data: {
        ...data,
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : undefined,
      },
    });
  };

  const handleTaskMove = (taskId, newStatus) => {
    const completedDate = newStatus === 'done' ? new Date().toISOString().split('T')[0] : null;
    updateTaskMutation.mutate({
      id: taskId,
      data: {
        status: newStatus,
        completed_date: completedDate,
      },
    });
  };

  const requestAISuggestion = async (taskData) => {
    setAiLoading(true);

    const prompt = `
      Analyze this task and suggest the best team member to assign it to.
      
      Task Details:
      - Title: ${taskData.title}
      - Description: ${taskData.description || 'No description'}
      - Domain: ${taskData.domain}
      - Difficulty: ${taskData.difficulty}
      - Priority: ${taskData.priority}
      - Required Skills: ${taskData.required_skills?.join(', ') || 'None specified'}
      - Estimated Hours: ${taskData.estimated_hours || 'Not specified'}
      
      Available Team Members:
      ${members.map(m => `
        - ${m.display_name || m.user_email}: 
          Skills: ${m.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'Not specified'}
          Workload: ${m.current_workload || 0}%
          Domains: ${m.domains?.join(', ') || 'Not specified'}
      `).join('\n')}
      
      Based on skills match, workload balance, and domain expertise, suggest the best assignee.
    `;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggested_assignee: { type: 'string', description: 'Email of suggested assignee' },
          confidence_score: { type: 'number', description: 'Confidence 0-1' },
          reasoning: { type: 'string', description: 'Why this person' },
          estimated_hours: { type: 'number', description: 'Estimated hours to complete' },
          suggested_due_date: { type: 'string', description: 'Suggested due date YYYY-MM-DD' },
        },
      },
    });

    setAiLoading(false);
    return result;
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.due_date && t.status !== 'done' && isBefore(new Date(t.due_date), new Date())).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">
            {taskStats.total} tasks • {taskStats.completed} completed • {taskStats.overdue} overdue
          </p>
        </div>
        <div className="flex items-center gap-3">

          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
            className={view === 'kanban' ? 'bg-slate-700' : ''}
          >
            <Kanban className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className={view === 'list' ? 'bg-slate-700' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
            className={view === 'grid' ? 'bg-slate-700' : ''}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task Views */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskClick={setSelectedTask}
          onTaskEdit={setEditingTask}
          onTaskDelete={setTaskToDelete}
        />
      ) : view === 'list' ? (
        <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Task</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Priority</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Assignee</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Due Date</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Project</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const isOverdue = task.due_date && task.status !== 'done' && isBefore(new Date(task.due_date), new Date());
                  const project = projects.find(p => p.id === task.project_id);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => setEditingTask(task)}
                    >
                      <td className="p-4">
                        <p className="font-medium text-white">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-slate-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={cn(
                          "text-xs",
                          task.status === 'done' && "bg-emerald-500/20 text-emerald-400",
                          task.status === 'in_progress' && "bg-amber-500/20 text-amber-400",
                          task.status === 'todo' && "bg-blue-500/20 text-blue-400",
                          task.status === 'review' && "bg-purple-500/20 text-purple-400",
                          task.status === 'backlog' && "bg-slate-500/20 text-slate-400",
                        )}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          task.priority === 'urgent' && "border-rose-500/50 text-rose-400",
                          task.priority === 'high' && "border-amber-500/50 text-amber-400",
                          task.priority === 'medium' && "border-blue-500/50 text-blue-400",
                          task.priority === 'low' && "border-slate-500/50 text-slate-400",
                        )}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-300">
                          {task.assignee_email?.split('@')[0] || 'Unassigned'}
                        </span>
                      </td>
                      <td className="p-4">
                        {task.due_date ? (
                          <span className={cn(
                            "text-sm",
                            isOverdue ? "text-rose-400" : "text-slate-300"
                          )}>
                            {format(new Date(task.due_date), 'MMM d')}
                            {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-400">{project?.name || '-'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onClick={() => setEditingTask(task)}
            />
          ))}
          {filteredTasks.length === 0 && (
            <Card className="col-span-full bg-slate-800/50 border-slate-700/50 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No tasks found</h3>
              <p className="text-slate-400 text-sm">Create a new task to get started</p>
            </Card>
          )}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm
        open={showForm || !!editingTask}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        projects={projects}
        members={members}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
        onRequestAISuggestion={requestAISuggestion}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleteTaskMutation.mutate(taskToDelete?.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}