import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus, Search, Layers, Users, FolderKanban, Edit, Trash2, MoreVertical,
  Building2, Briefcase, Code, LineChart, Megaphone, Users2, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const domainConfig = {
  it: { icon: Code, color: 'bg-blue-500', label: 'IT' },
  core_engineering: { icon: Settings, color: 'bg-emerald-500', label: 'Engineering' },
  business: { icon: Briefcase, color: 'bg-violet-500', label: 'Business' },
  marketing: { icon: Megaphone, color: 'bg-pink-500', label: 'Marketing' },
  hr: { icon: Users2, color: 'bg-amber-500', label: 'HR' },
  finance: { icon: LineChart, color: 'bg-cyan-500', label: 'Finance' },
  operations: { icon: Building2, color: 'bg-orange-500', label: 'Operations' },
  custom: { icon: Layers, color: 'bg-slate-500', label: 'Custom' },
};

export default function Workspaces() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.filter({ is_archived: false }, '-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ is_archived: false }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.TeamMember.filter({ is_active: true }),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data) => base44.entities.Workspace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setShowForm(false);
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workspace.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setEditingWorkspace(null);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id) => base44.entities.Workspace.update(id, { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name?.toLowerCase().includes(search.toLowerCase()) ||
    ws.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getWorkspaceProjects = (wsId) => projects.filter(p => p.workspace_id === wsId);
  const getWorkspaceMembers = (ws) => {
    const memberList = ws.member_emails || [];
    return members.filter(m => memberList.includes(m.user_email));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 mt-1">
            Organize your projects into dedicated workspaces
          </p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-800/50 border-slate-700"
        />
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkspaces.map(workspace => {
          const domain = domainConfig[workspace.domain] || domainConfig.custom;
          const DomainIcon = domain.icon;
          const wsProjects = getWorkspaceProjects(workspace.id);
          const wsMembers = getWorkspaceMembers(workspace);

          return (
            <Card 
              key={workspace.id}
              className="bg-slate-800/50 border-slate-700/50 hover:border-violet-500/50 transition-colors group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-3 rounded-xl", domain.color)}>
                      <DomainIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{workspace.name}</h3>
                      <Badge variant="secondary" className="mt-1 text-[10px] bg-slate-700">
                        {domain.label}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem onClick={() => setEditingWorkspace(workspace)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteWorkspaceMutation.mutate(workspace.id)}
                        className="text-rose-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {workspace.description && (
                  <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                    {workspace.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <FolderKanban className="w-4 h-4" />
                      <span>{wsProjects.length} projects</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{wsMembers.length}</span>
                    </div>
                  </div>

                  {wsMembers.length > 0 && (
                    <div className="flex -space-x-2">
                      {wsMembers.slice(0, 3).map((member, i) => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-slate-800">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[10px]">
                            {member.display_name?.charAt(0) || member.user_email?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {wsMembers.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                          <span className="text-[10px] text-slate-300">+{wsMembers.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredWorkspaces.length === 0 && (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 p-12 text-center">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No workspaces found</h3>
            <p className="text-slate-400 text-sm mb-4">Create your first workspace to organize projects</p>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </Card>
        )}
      </div>

      {/* Workspace Form Dialog */}
      <WorkspaceFormDialog
        open={showForm || !!editingWorkspace}
        onClose={() => { setShowForm(false); setEditingWorkspace(null); }}
        workspace={editingWorkspace}
        organizations={organizations}
        members={members}
        onSubmit={(data) => {
          if (editingWorkspace) {
            updateWorkspaceMutation.mutate({ id: editingWorkspace.id, data });
          } else {
            createWorkspaceMutation.mutate(data);
          }
        }}
        isLoading={createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending}
      />
    </div>
  );
}

function WorkspaceFormDialog({ open, onClose, workspace, organizations, members, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    description: workspace?.description || '',
    organization_id: workspace?.organization_id || '',
    domain: workspace?.domain || 'custom',
    color: workspace?.color || '#8b5cf6',
    member_emails: workspace?.member_emails || [],
    leader_emails: workspace?.leader_emails || [],
  });

  React.useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        description: workspace.description || '',
        organization_id: workspace.organization_id || '',
        domain: workspace.domain || 'custom',
        color: workspace.color || '#8b5cf6',
        member_emails: workspace.member_emails || [],
        leader_emails: workspace.leader_emails || [],
      });
    }
  }, [workspace]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
      <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{workspace ? 'Edit Workspace' : 'Create Workspace'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Workspace Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter workspace name"
              className="mt-1.5 bg-slate-800 border-slate-700"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Workspace description..."
              className="mt-1.5 bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <Label>Domain</Label>
            <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
              <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {Object.entries(domainConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="mt-1.5 flex flex-wrap gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700 min-h-[60px] max-h-32 overflow-y-auto">
              {formData.member_emails.map(email => (
                <Badge key={email} variant="secondary" className="bg-violet-500/20 text-violet-300">
                  {email.split('@')[0]}
                  <button type="button" onClick={() => toggleMember(email)} className="ml-1">×</button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
              {workspace ? 'Update' : 'Create'} Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}