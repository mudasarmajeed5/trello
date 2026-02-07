import { Card, CardContent } from "@/components/ui/card";
import { TasksType } from "@/lib/supabase/models";
import { useSortable } from "@dnd-kit/sortable";
import { Dialog as UIDeleteDialog } from "@mudasarmajeed5/dialog";
import { CalendarIcon, Edit2Icon, TrashIcon, UserIcon } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import EditTask from "./edit-task";
import { useTasks } from "@/lib/hooks/use-tasks";
import { toast } from "sonner";
export function SortableTask({
  task,
  onUpdateTask,
  onDeleteTask,
}: {
  task: TasksType;
  onUpdateTask: (
    updatedTask: Omit<TasksType, "column_id" | "created_at" | "sort_order">,
  ) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditingTask, setIsEditingTask] = useState(false);
  const { deleteTask: removeTask, loading, error } = useTasks();
  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const deleteTask = async () => {
    await removeTask(task.id);
    if (!error) {
      onDeleteTask(task.id);
      toast.success("Task deleted.", { position: "bottom-right" });
    }
  };
  function getPriorityColor(priority: "low" | "medium" | "high"): string {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  }
  return (
    <div style={styles} ref={setNodeRef} {...listeners} {...attributes}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Task header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                {task.title}
              </h4>
            </div>
            {/* Task description */}
            <p className="text-xs text-gray-600 line-clamp-2">
              {task.description || "No Description."}
            </p>
            {/* Task MetaData */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                {task.assignee && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <UserIcon className="w-3 h-3" />
                    <span className="truncate">{task.assignee}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center text-xs text-gray-500 space-x-1 sm:space-x-2 min-w-0">
                    <CalendarIcon className="w-3 h-3" />
                    <span className="truncate">
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`}
              />
              <div className="flex items-center space-x-1">
                <UIDeleteDialog
                  title="Delete Task"
                  description="This action is not reversible"
                  onComplete={deleteTask}
                  onCancel={() => {}}
                  variant="light"
                >
                  <Button
                    size={"icon-sm"}
                    className="text-red-600 bg-red-50"
                    variant={"outline"}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </UIDeleteDialog>
                <Button
                  onClick={() => setIsEditingTask(true)}
                  size={"icon-sm"}
                  variant={"outline"}
                  className="text-green-600 bg-green-50"
                >
                  <Edit2Icon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <EditTask
        openDialog={isEditingTask}
        task={task}
        onOpenChange={setIsEditingTask}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
}
