import type { Task } from "../types";
import { supabase } from "./supabase";

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

function client() {
  if (!supabase) throw new Error("Supabase не настроен");
  return supabase;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    completed: row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function toRow(task: Task, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    date: task.date,
    completed: task.completed,
    completed_at: task.completedAt,
    created_at: task.createdAt,
  };
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await client()
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as TaskRow[]).map(toTask);
}

export async function insertTasks(tasks: Task[], userId: string): Promise<void> {
  if (!tasks.length) return;
  const { error } = await client()
    .from("tasks")
    .upsert(tasks.map((task) => toRow(task, userId)), { onConflict: "id" });
  if (error) throw error;
}

export async function updateTaskRemote(
  id: string,
  patch: Partial<Pick<Task, "title" | "date" | "completed" | "completedAt">>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.completed !== undefined) row.completed = patch.completed;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;

  if (Object.keys(row).length === 0) return;

  const { error } = await client().from("tasks").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTaskRemote(id: string): Promise<void> {
  const { error } = await client().from("tasks").delete().eq("id", id);
  if (error) throw error;
}
