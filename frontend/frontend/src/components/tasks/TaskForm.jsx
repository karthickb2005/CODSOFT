import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, X, Plus, Sparkles, Loader2, Brain, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-500' },
];

const difficulties = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'complex', label: 'Complex' },
];

const domains = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'devops', label: 'DevOps' },
  { value: 'design', label: 'Design' },
  { value: 'qa', label: 'QA' },
  { value: 'data', label: 'Data' },
  { value: 'management', label: 'Management' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

const statuses = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export default function TaskForm({
  open,
  onClose,
  onSubmit,
  task = null,
  projects = [],
  members = [],
  isLoading = false,
  onRequestAISuggestion = null
}) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    difficulty: task?.difficulty || 'medium',
    domain: task?.domain || 'other',
    assignee_email: task?.assignee_email || '',
    reviewer_email: task?.reviewer_email || '',
    start_date: task?.start_date || '',
    due_date: task?.due_date || '',
    estimated_hours: task?.estimated_hours || '',
    required_skills: task?.required_skills || [],
    tags: task?.tags || [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [requestingAI, setRequestingAI] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.project_id) {
      alert('Please select a project first.');
      return;
    }
    onSubmit(formData);
  };

  const addSkill = () => {
    if (newSkill && !formData.required_skills.includes(newSkill)) {
      setFormData({ ...formData, required_skills: [...formData.required_skills, newSkill] });
      setNewSkill('');
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const requestAISuggestion = async () => {
    if (!onRequestAISuggestion) return;
    setRequestingAI(true);
    const suggestion = await onRequestAISuggestion(formData);
    setAiSuggestion(suggestion);
    setRequestingAI(false);
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData({
        ...formData,
        assignee_email: aiSuggestion.suggested_assignee || formData.assignee_email,
        due_date: aiSuggestion.suggested_due_date || formData.due_date,
        estimated_hours: aiSuggestion.estimated_hours || formData.estimated_hours,
      });
      setAiSuggestion(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Task Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className="mt-1.5 bg-slate-800 border-slate-700"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
                className="mt-1.5 bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>

            <div>
              <Label>Project</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {projects.map(p => (
                    <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {statuses.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", p.color)} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {difficulties.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Domain</Label>
              <Select
                value={formData.domain}
                onValueChange={(v) => setFormData({ ...formData, domain: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {domains.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="Enter hours (e.g., 5)"
                className="mt-1.5 bg-slate-800 border-slate-700"
              />
            </div>

            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1.5 justify-start bg-slate-800 border-slate-700 text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.start_date ? format(new Date(formData.start_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;
                      const localDate = new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      );
                      setFormData({ ...formData, start_date: localDate });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1.5 justify-start bg-slate-800 border-slate-700 text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.due_date ? format(new Date(formData.due_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;
                      const localDate = new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      );
                      setFormData({ ...formData, due_date: localDate });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* AI Suggestion Section */}
            <div className="col-span-2 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <span className="font-medium text-violet-300">AI Assignment Suggestion</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20"
                  onClick={requestAISuggestion}
                  disabled={requestingAI}
                >
                  {requestingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Get Suggestion
                    </>
                  )}
                </Button>
              </div>

              {aiSuggestion && (
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="text-violet-400">Suggested Assignee:</span> {aiSuggestion.suggested_assignee}
                  </p>
                  {aiSuggestion.reasoning && (
                    <p className="text-slate-400 text-xs">{aiSuggestion.reasoning}</p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={applyAISuggestion}
                  >
                    Apply Suggestion
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Assignee</Label>
              <Select
                value={formData.assignee_email}
                onValueChange={(v) => setFormData({ ...formData, assignee_email: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.map(m => (
                    <SelectItem key={m.user_email} value={m.user_email}>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {m.display_name || m.user_email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reviewer</Label>
              <Select
                value={formData.reviewer_email}
                onValueChange={(v) => setFormData({ ...formData, reviewer_email: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.map(m => (
                    <SelectItem key={m.user_email} value={m.user_email}>
                      {m.display_name || m.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Required Skills</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill..."
                  className="bg-slate-800 border-slate-700"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" variant="outline" onClick={addSkill} className="border-slate-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.required_skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.required_skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                      {skill}
                      <button type="button" onClick={() => setFormData({ ...formData, required_skills: formData.required_skills.filter(s => s !== skill) })} className="ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}