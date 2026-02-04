import { useState } from "react";
import { TasksType } from "../supabase/models";

export function useTasks(){
    const [task, setTask] = useState<TasksType | null>(null);
    
}