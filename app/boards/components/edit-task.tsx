import { TasksType } from "@/lib/supabase/models";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useTasks } from "@/lib/hooks/use-tasks";
const EditTask = ({
  task,
  openDialog,
  onOpenChange,
}: {
  task: TasksType;
  openDialog: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { updateTask, loading, error } = useTasks();
  const [taskData, setTaskData] = useState<TasksType>({
    title: task.title,
    assignee: task.assignee,
    column_id: task.column_id,
    created_at: task.created_at,
    description: task.description,
    due_date: task.due_date,
    priority: task.priority,
    id: task.id,
    sort_order: task.sort_order,
  });
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTask = {
      id: taskData.id, 
      title: taskData.title,
      description: taskData.description,
      assignee: taskData.assignee,
      priority: taskData.priority,
      due_date: taskData.due_date,
    };

    await updateTask(updatedTask);
  };

  return (
    <Dialog open={openDialog} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <p className="text-sm text-gray-600">Edit the task</p>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleEditTask}>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              required
              id="title"
              name="title"
              placeholder="Enter Task Title"
              value={taskData.title}
              onChange={(e) => {
                setTaskData((prev: TasksType) => ({
                  ...prev,
                  title: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              cols={5}
              required
              id="description"
              value={taskData.description ?? ""}
              name="description"
              placeholder="Enter Task Description"
              onChange={(e) => {
                setTaskData((prev: TasksType) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Input
              required
              id="assignee"
              value={taskData.assignee ?? ""}
              name="assignee"
              placeholder="Who should do this?"
              onChange={(e) => {
                setTaskData((prev: TasksType) => ({
                  ...prev,
                  assignee: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              name="priority"
              defaultValue={taskData.priority}
              onValueChange={(value) =>
                setTaskData((prev) => ({
                  ...prev,
                  priority: value as TasksType["priority"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high"].map((priority, key) => (
                  <SelectItem key={key} value={priority} className="capitalize">
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              value={taskData.due_date ?? ""}
              type="date"
              id="dueDate"
              name="dueDate"
              onChange={(e) => {
                setTaskData((prev: TasksType) => ({
                  ...prev,
                  due_date: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2 flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant={"outline"}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTask;
