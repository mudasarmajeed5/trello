export interface BoardType{
    id: string, 
    title: string, 
    description: string | null,
    color: string, 
    user_id: string,
    created_at: string, 
    updated_at: string

}
export interface ColumnType{
    id: string, 
    board_id: string, 
    title: string, 
    sort_order: number, 
    created_at: string,
}
export interface TasksType{
    id: string, 
    column_id: string, 
    title: string, 
    description: string | null, 
    assignee: string | null, 
    due_date: string, 
    priority: "low" | "medium" | "high"
    sort_order: number, 
    created_at: string, 
    updated_at: string,
};
