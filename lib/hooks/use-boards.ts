import { useUser } from "@clerk/nextjs";
import {
  boardDataService,
  boardService,
} from "../board-services";
import { useEffect, useState } from "react";
import { BoardType, ColumnWithTasks, TasksType } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [totalTasks, setTotalTasks] = useState<
    (BoardType & { tasks: TasksType[] })[]
  >([]);
  const [tasksSum, setTasksSum] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadBoards();
      getTotalTasks();
    }
  }, [user, supabase]);


  useEffect(() => {
    let sum = 0;
    totalTasks.forEach((board) => {
      sum += board.tasks.length;
    });
    setTasksSum(sum);
  }, [totalTasks]);

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

  async function getTotalTasks() {
    if (!user) {
      throw new Error("User not authenticated.");
    }
    try {
      const totalTasksOfAllBoards = await boardDataService.getTotalTasksCount(
        supabase!,
        user.id,
      );
      setTotalTasks(totalTasksOfAllBoards);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create board",
      );
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
  return { boards, loading, error, createBoard, tasksSum };
}
