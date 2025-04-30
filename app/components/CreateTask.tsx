import { supabase } from "@/lib/supabaseClient";

export async function createTask(
  title: string,
  user_id: string,
  completed = false
) {
  const { data, error } = await supabase.from("tasks").insert([
    {
      user_id,
      title,
      completed,
      // id and created_at are auto-filled
    },
  ]);

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  return data;
}
