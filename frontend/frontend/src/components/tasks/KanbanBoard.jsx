import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, AlertTriangle, MoreVertical } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

const priorityColors = {
  low: 'border-l-slate-500',
  medium: 'border-l-blue-500',
  high: 'border-l-amber-500',
  urgent: 'border-l-rose-500',
};

export default function KanbanBoard({ tasks = [], onTaskMove, onTaskClick, onTaskEdit, onTaskDelete }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    if (result.source.droppableId !== newStatus) {
      onTaskMove?.(taskId, newStatus);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={cn("w-2 h-2 rounded-full", column.color)} />
              <h3 className="font-medium text-white">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-300 text-xs">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "space-y-3 p-2 rounded-xl min-h-[200px] transition-colors",
                    snapshot.isDraggingOver ? "bg-violet-500/10" : "bg-slate-800/30"
                  )}
                >
                  {getTasksByStatus(column.id).map((task, index) => {
                    const isOverdue = task.due_date && task.status !== 'done' && isBefore(new Date(task.due_date), new Date());
                    
                    return (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "p-3 bg-slate-800 border-slate-700 border-l-2 cursor-pointer transition-all",
                              priorityColors[task.priority],
                              snapshot.isDragging && "shadow-xl rotate-2 scale-105",
                              "hover:border-slate-600"
                            )}
                            onClick={() => onTaskClick?.(task)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-medium text-white line-clamp-2">
                                {task.title}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskEdit?.(task); }}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); onTaskDelete?.(task); }}
                                    className="text-rose-400"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.due_date && (
                                  <div className={cn(
                                    "flex items-center gap-1 text-[10px]",
                                    isOverdue ? "text-rose-400" : "text-slate-500"
                                  )}>
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </div>
                                )}
                                {task.estimated_hours && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {task.estimated_hours}h
                                  </div>
                                )}
                              </div>
                              
                              {task.assignee_email && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[8px]">
                                    {task.assignee_email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            
                            {task.ai_schedule?.delay_risk > 50 && (
                              <div className="mt-2 pt-2 border-t border-slate-700">
                                <div className="flex items-center gap-1 text-[10px] text-amber-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  {task.ai_schedule.delay_risk}% delay risk
                                </div>
                              </div>
                            )}
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}