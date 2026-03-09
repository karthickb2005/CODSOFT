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
import { Calendar as CalendarIcon, X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const domains = [
  { value: 'it', label: 'IT' },
  { value: 'core_engineering', label: 'Core Engineering' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'custom', label: 'Custom' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'critical', label: 'Critical', color: 'bg-rose-500' },
];

export default function ProjectForm({
  open,
  onClose,
  onSubmit,
  project = null,
  workspaces = [],
  members = [],
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    workspace_id: project?.workspace_id || '',
    domain: project?.domain || 'it',
    priority: project?.priority || 'medium',
    start_date: project?.start_date || '',
    target_end_date: project?.target_end_date || '',
    leader_email: project?.leader_email || '',
    member_emails: project?.member_emails || [],
    budget: project?.budget || '',
    tags: project?.tags || [],
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleMember = (email) => {
    if (formData.member_emails.includes(email)) {
      setFormData({ ...formData, member_emails: formData.member_emails.filter(e => e !== email) });
    } else {
      setFormData({ ...formData, member_emails: [...formData.member_emails, email] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Project Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className="mt-1.5 bg-slate-800 border-slate-700"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description..."
                className="mt-1.5 bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>

            <div>
              <Label>Workspace</Label>
              <Select
                value={formData.workspace_id}
                onValueChange={(v) => setFormData({ ...formData, workspace_id: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {workspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
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
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
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
              <Label>Target End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1.5 justify-start bg-slate-800 border-slate-700 text-left"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.target_end_date ? format(new Date(formData.target_end_date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={formData.target_end_date ? new Date(formData.target_end_date) : undefined}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;
                      const localDate = new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      );
                      setFormData({ ...formData, target_end_date: localDate });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Project Lead</Label>
              <Select
                value={formData.leader_email}
                onValueChange={(v) => setFormData({ ...formData, leader_email: v })}
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {members.filter(m => m.role === 'team_leader' || m.role === 'admin').map(m => (
                    <SelectItem key={m.user_email} value={m.user_email}>
                      {m.display_name || m.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Team Members</Label>
              <div className="mt-1.5 flex flex-wrap gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700 min-h-[60px]">
                {formData.member_emails.map(email => (
                  <Badge key={email} variant="secondary" className="bg-violet-500/20 text-violet-300">
                    {email.split('@')[0]}
                    <button type="button" onClick={() => toggleMember(email)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {members.filter(m => !formData.member_emails.includes(m.user_email)).slice(0, 10).map(m => (
                  <Badge
                    key={m.user_email}
                    variant="outline"
                    className="cursor-pointer border-slate-600 hover:bg-slate-700"
                    onClick={() => toggleMember(m.user_email)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {m.display_name || m.user_email?.split('@')[0]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <Label>Tags</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="bg-slate-800 border-slate-700"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag} className="border-slate-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-slate-700">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1">
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
              {project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}