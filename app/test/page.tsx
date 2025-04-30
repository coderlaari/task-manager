"use client";
import React, { useState, useEffect } from "react";
import { createTask } from "../components/CreateTask";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

export default function AddTask() {
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const { user } = useUser();

  const setTaskAsCompleted = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: true })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      alert("Failed to mark task as completed");
    } else {
      getTasks(); // Refresh tasks after updating
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    } else {
      // Refresh the tasks after deleting
      getTasks();
    }
  };

  // Fetch tasks for the logged-in user
  const getTasks = async () => {
    if (!user) return; // Return if no user

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id); // Filter tasks by user_id

    if (error) {
      alert("Error fetching tasks, see console for more info");
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data); // Set fetched tasks in state
    }
  };

  // Fetch tasks when user is available
  useEffect(() => {
    if (user) {
      getTasks(); // Fetch tasks when user is logged in
    }
  }, [user]); // This will re-run when user changes (e.g., after login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!user) {
      alert("User is not logged in");
      return;
    }

    try {
      // Pass user.id to the createTask function
      await createTask(title, user.id);
      alert("Task created!");
      setTitle(""); // Clear title after successful task creation

      // Fetch updated tasks after adding a new task
      getTasks();
    } catch (err) {
      alert("Failed to create task.");
      console.error("Error creating task:", err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-cyan-300 to-purple-400 bg-cover h-screen w-[99wv] text-black">
      <form onSubmit={handleSubmit} className="p-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="border px-2 py-1 text-black rounded-[10px] w-150"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-3 py-1 rounded hover:cursor-pointer"
        >
          Add Task
        </button>
      </form>
      <ul>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <li
              key={task.id}
              className="ml-3 mb-2 p-2 border w-200 rounded-2xl"
            >
              <h3 className="text-lg font-semibold">{task.title}</h3>
              <button
                onClick={() => deleteTask(task.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-gray-500 cursor-pointer transition"
              >
                Delete
              </button>

              <div className="flex">
                <p className="text-sm">
                  {task.completed ? "Completed" : "Not completed"}
                </p>

                <button
                  onClick={() => setTaskAsCompleted(task.id)}
                  className="ml-50 bg-green-400 border-2 text-white px-2 py-2 rounded-lg hover:bg-gray-500a cursor-pointer transition"
                >
                  Set as completed
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Created at: {new Date(task.created_at).toLocaleString()}
              </p>
            </li>
          ))
        ) : (
          <p className="text-4xl px-4">No tasks found.</p>
        )}
      </ul>
    </div>
  );
}
