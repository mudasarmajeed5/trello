import { useState } from "react";
import { TasksType } from "../supabase/models";
import { taskService } from "../task-service";
import { useSupabase } from "../supabase/SupabaseProvider";
export function useTasks() {
  const { supabase } = useSupabase();
  const [task, setTask] = useState<TasksType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function updateTask(taskData: Omit<TasksType, "created_at"| "column_id" | "sort_order" >) {
    try {
      setLoading(true);
      setError(null);
      const updatedTask = await taskService.updateTask(supabase!, taskData);
      setTask(updatedTask);
    } catch (e) {
      const error = e as Error;
      setError(error.message ? error.message: "Network Error");
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    error,
    task,
    updateTask,
  };
}
