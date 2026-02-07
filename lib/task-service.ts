import { TasksType } from "./supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

export const taskService = {
  async getTasksByBoard(
    supabase: SupabaseClient,
    boardId: string,
  ): Promise<TasksType[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
          *, columns!inner(board_id)
        `,
      )
      .eq("columns.board_id", boardId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async createTask(
    supabase: SupabaseClient,
    task: Omit<TasksType, "id" | "created_at" | "updated_at">,
  ): Promise<TasksType> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateTask(
    supabase: SupabaseClient,
    task: Omit<TasksType, "created_at" | "column_id" | "sort_order">,
  ): Promise<TasksType> {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        priority: task.priority,
        due_date: task.due_date,
      })
      .eq("id", task.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async moveTask(
    supabase: SupabaseClient,
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        column_id: newColumnId,
        sort_order: newOrder,
      })
      .eq("id", taskId);
    if (error) throw error;
    return data;
  },
};
