import { Card, CardContent } from "@/components/ui/card";
import { TasksType } from "@/lib/supabase/models";
import { CalendarIcon, UserIcon } from "lucide-react";
const TaskOverLay = ({ task }: { task: TasksType }) => {
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskOverLay;
