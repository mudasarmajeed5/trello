"use client";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBoard } from "@/lib/hooks/use-board";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ColumnWithTasks, TasksType } from "@/lib/supabase/models";
import { SortableTask } from "../components/task";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskOverLay from "../components/task-overlay";
import InviteModal from "../components/invite-modal";
import { DroppableColumn } from "../components/droppable-column";
export type TaskData = {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
};

const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-gray-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-emerald-500",
  ];
  const {
    board,
    updateBoard,
    columns,
    createRealTask,
    setColumns,
    moveTask,
    createColumn,
    updateColumn,
  } = useBoard(id);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(
    null,
  );
  const [filters, setFilters] = useState({
    priority: [] as string[],
    assignee: [] as string[],
    dueDate: null as string | null,
  });
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const [activeTask, setActiveTask] = useState<TasksType | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filteredColumns = columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      //  filter by priority.
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }
      // filter by duedate.
      if (filters.dueDate && task.due_date) {
        const taskDate = new Date(task.due_date).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();
        if (taskDate !== filterDate) {
          return false;
        }
      }

      return true;
    }),
  }));
  const sensor = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const handleFilterChange = (
    type: "priority" | "assignee" | "dueDate",
    value: string | string[] | null,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };
  const clearFilters = () => {
    setFilters({
      priority: [] as string[],
      assignee: [] as string[],
      dueDate: null as string | null,
    });
  };
  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !board) return;
    try {
      await updateBoard(board.id, {
        title: newTitle.trim(),
        color: newColor || board.color,
        description: newDescription,
      });
      setIsEditingTitle(false);
    } catch (error) {}
  };

  async function createTask(taskData: TaskData) {
    const targetColumn = columns[0];
    if (!targetColumn) {
      throw new Error("No Column Available to add Task to...");
    }

    await createRealTask(targetColumn.id, taskData);
  }
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      assignee: (formData.get("assignee") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      priority:
        (formData.get("priority") as "low" | "medium" | "high") || "medium",
    };
    if (taskData.title.trim()) {
      await createTask(taskData);
      const trigger = document.querySelector(
        '[data-state="open"]',
      ) as HTMLElement;
      if (trigger) {
        trigger.click();
      }
    }
  };
  const handleUpdateTask = (updatedtask: Omit<TasksType, "column_id" | "created_at" | "sort_order">) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          task.id === updatedtask.id ? { ...task, ...updatedtask } : task,
        ),
      })),
    );
  };

  const handleDragStart = (e: DragStartEvent) => {
    const taskId = e.active.id.toString();
    const task = columns
      .flatMap((col) => col.tasks)
      .find((task) => task.id == taskId);
    if (task) {
      setActiveTask(task);
    }
  };
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = columns.find((column) =>
      column.tasks.some((task) => task.id === activeId),
    );
    const targetColumn = columns.find((column) =>
      column.tasks.some((task) => task.id === overId),
    );
    if (!sourceColumn || !targetColumn) {
      return;
    }
    if (sourceColumn.id === targetColumn.id) {
      const activeIdx = sourceColumn.tasks.findIndex(
        (task) => task.id === activeId,
      );
      const overIdx = targetColumn.tasks.findIndex(
        (task) => task.id === overId,
      );
      if (activeIdx != overIdx) {
        setColumns((prev: ColumnWithTasks[]) => {
          const newCols = [...prev];
          const column = newCols.find((col) => col.id == sourceColumn.id);
          if (column) {
            const tasks = [...column.tasks];
            const [removed] = tasks.splice(activeIdx, 1);
            tasks.splice(overIdx, 0, removed);
            column.tasks = tasks;
          }
          return newCols;
        });
      }
    }
  };
  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id == overId);
    if (targetColumn) {
      const sourceColumn = columns.find((column) =>
        column.tasks.some((task) => task.id === taskId),
      );
      if (sourceColumn && sourceColumn.id != targetColumn.id) {
        await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
      }
    } else {
      // check if we are dropping on another task.
      const sourceColumn = columns.find((column) =>
        column.tasks.some((task) => task.id === taskId),
      );
      const targetColumn = columns.find((column) =>
        column.tasks.some((task) => task.id === overId),
      );
      if (sourceColumn && targetColumn) {
        const oldIdx = sourceColumn.tasks.findIndex(
          (task) => task.id === taskId,
        );
        const newIdx = targetColumn.tasks.findIndex(
          (task) => task.id === overId,
        );
        if (oldIdx != newIdx) {
          await moveTask(taskId, targetColumn.id, newIdx);
        }
      }
    }
  };

  async function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await createColumn(newColumnTitle.trim());
    setNewColumnTitle("");
    setIsCreatingColumn(false);
  }
  async function handleUpdateColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!editingColumnTitle.trim() || !editingColumn) return;

    await updateColumn(editingColumn.id!, editingColumnTitle.trim());
    setIsEditingColumn(false);
    setEditingColumnTitle("");
    setEditingColumn(null);
  }
  const handleEditColumn = (column: ColumnWithTasks) => {
    setIsEditingColumn(true);
    setEditingColumn(column);
    setEditingColumnTitle(column.title);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          boardTitle={board?.title}
          onFilterClick={() => setIsFilterOpen(true)}
          filterCount={Object.values(filters).reduce(
            (count, v) =>
              count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0),
            0,
          )}
          onEditBoard={() => {
            setIsEditingTitle(true);
            setNewColor(board?.color ?? "");
            setNewTitle(board?.title ?? "");
            setNewDescription(board?.description ?? "");
          }}
        />
        <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
          <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBoard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boardTitle">Board Title</Label>
                <Input
                  id="boardTitle"
                  placeholder="Enter Board Title..."
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardDescription">Board Description</Label>
                <Textarea
                  id="boardDescription"
                  placeholder="Enter Board Description..."
                  cols={5}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardColor">Board Title</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {colors.map((color, idx) => {
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`${color} w-8 h-8 rounded-full ${color === newColor ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                        onClick={() => setNewColor(color)}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsEditingTitle(false)}
                  type="button"
                  variant={"outline"}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
            <DialogHeader>
              <DialogTitle>Filter Tasks</DialogTitle>
              <p className="text-sm text-gray-600">
                Filter Task by priority, assignee, due date
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high"].map((priority, key) => (
                    <Button
                      onClick={() => {
                        const newPriorities = filters.priority.includes(
                          priority,
                        )
                          ? filters.priority.filter((p) => p !== priority)
                          : [...filters.priority, priority];
                        handleFilterChange("priority", newPriorities);
                      }}
                      variant={
                        filters.priority.includes(priority)
                          ? "default"
                          : "outline"
                      }
                      size={"sm"}
                      className="capitalize"
                      key={key}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value || null)
                  }
                  type="date"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={clearFilters}
                  type="button"
                  variant={"outline"}
                >
                  Clear Filter
                </Button>
                <Button type="button" onClick={() => setIsFilterOpen(false)}>
                  Apply Filter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Board Content */}

        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Board Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Tasks: </span>
                {columns.reduce((sum, col) => sum + col.tasks.length, 0)}
              </div>
            </div>
            <div className="flex gap-2">
              <InviteModal />
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1 sm:w-auto">
                    <PlusIcon />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <p className="text-sm text-gray-600">
                      Add a Task to the Board
                    </p>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateTask}>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        required
                        id="title"
                        name="title"
                        placeholder="Enter Task Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        required
                        id="description"
                        name="description"
                        placeholder="Enter Task Description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assignee</Label>
                      <Input
                        required
                        id="assignee"
                        name="assignee"
                        placeholder="Who should do this?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["low", "medium", "high"].map((priority, key) => (
                            <SelectItem
                              key={key}
                              value={priority}
                              className="capitalize"
                            >
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" id="dueDate" name="dueDate" />
                    </div>
                    <div className="space-y-2 flex justify-end space-x-2 pt-4">
                      <Button type="submit">Create Task</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Board Columns */}
          <DndContext
            sensors={sensor}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="
            flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto
            lg:p-6 lg:px-2 lg:-mx-2
            lg:[&::-webkit-scrollbar]:w-1
          lg:[&::-webkit-scrollbar-track]:bg-gray-100
          lg:[&::-webkit-scrollbar-thumb]:bg-gray-300
            lg:[&::-webkit-scrollbar-thumb]:rounded-full
            space-y-4 lg:space-y-0
            "
            >
              {filteredColumns.map((column, key) => (
                <DroppableColumn
                  column={column}
                  key={key}
                  onCreateTask={handleCreateTask}
                  onEditColumn={handleEditColumn}
                >
                  <SortableContext
                    items={column.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {column.tasks.map((task, key) => (
                        <SortableTask onUpdateTask={handleUpdateTask} task={task} key={key} />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              ))}

              <div className="w-full flex shrink-0 lg:w-80">
                <Button
                  onClick={() => setIsCreatingColumn(true)}
                  variant={"outline"}
                  className="w-full h-full min-h-50 border-dashed border-2 text-gray-500 hover:text-gray-700"
                >
                  <PlusIcon />
                  <span>Add Another list</span>
                </Button>
              </div>

              <DragOverlay>
                {activeTask ? <TaskOverLay task={activeTask} /> : null}
              </DragOverlay>
            </div>
          </DndContext>
        </main>
      </div>
      {/* copied dialog add task */}
      <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
        <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Add new column to organize your tasks.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreateColumn} className="space-y-4">
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Enter Column Title"
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsCreatingColumn(false)}
                variant={"outline"}
              >
                Cancel
              </Button>
              <Button type="submit">Create Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent className="w-[95vw] max-w-106.25 mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the title of your column
            </p>
          </DialogHeader>
          <form onSubmit={handleUpdateColumn} className="space-y-4">
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input
                id="columnTitle"
                value={editingColumnTitle}
                onChange={(e) => setEditingColumnTitle(e.target.value)}
                placeholder="Enter Column Title"
                required
              />
            </div>
            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsEditingColumn(false);
                  setEditingColumnTitle("");
                  setEditingColumn(null);
                }}
                variant={"outline"}
              >
                Cancel
              </Button>
              <Button type="submit">Edit Column</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BoardPage;
