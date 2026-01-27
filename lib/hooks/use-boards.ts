import { useUser } from "@clerk/nextjs";
import { boardDataService, boardService, taskService } from "../services";
import { useEffect, useState } from "react";
import { BoardType, ColumnType, ColumnWithTasks, TasksType } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";
import { TaskData } from "@/app/boards/[id]/page";

export function useBoards() {
  const { user } = useUser();
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user, supabase]);
  async function loadBoards() {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase!, user.id);
      setBoards(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load boards.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function createBoard(boardData: {
    title: string;
    description?: string;
    color?: string;
  }) {
    if (!user) {
      throw new Error("User not authenticated.");
    }
    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumns(
        supabase!,
        {
          ...boardData,
          userId: user?.id,
        },
      );
      setBoards((prev) => [newBoard, ...prev]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create board",
      );
    }
  }
  return { boards, loading, error, createBoard };
}

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId, supabase]);
  async function loadBoard() {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase!,
        boardId,
      );
      setBoard(data.board);
      setColumns(data.columnsWithTasks);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load boards",
      );
    } finally {
      setLoading(false);
    }
  }
  async function updateBoard(boardId: string, updates: Partial<BoardType>) {
    try {
      const updatedBoard = await boardService.updateBoard(
        supabase!,
        boardId,
        updates,
      );
      setBoard(updatedBoard);
      return updateBoard;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update the boards",
      );
    }
  }
  async function createRealTask(columnId: string, taskData: TaskData) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        title: taskData.title,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.dueDate || null,
        column_id: columnId,
        sort_order:
          columns.find((col) => col.id === columnId)?.tasks.length || 0,
        priority: taskData.priority || "medium",
      });
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col,
        ),
      );
      return newTask;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to Add Task",
      );
    }
  }
  async function moveTask(taskId: string, newColumnId: string, newOrder: number){
   try {
    await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);
    setColumns((prev)=>{
      const newColumns = [...prev]; 
      // find and remove the task from old column. 
      let taskToMove: TasksType | null = null; 
      for (const col of newColumns){
        const taskIdx = col.tasks.findIndex((task)=>task.id === taskId); 
        if(taskIdx != -1){
          taskToMove = col.tasks[taskIdx];
          col.tasks.splice(taskIdx, 1); 
          break;
        } 
      }
      if(taskToMove){
        const targetColumn = newColumns.find((col)=>col.id === newColumnId); 
        if(targetColumn){
          targetColumn.tasks.splice(newOrder, 0 , taskToMove); 

        }
      }
      return newColumns
    })
   } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to Move task",
      );
   } 
  }
  return { loading, error, board, columns, updateBoard, createRealTask, setColumns, moveTask };
}
