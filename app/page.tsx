"use client";

import { RedirectToSignIn, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { createTask } from "./components/CreateTask";
import { supabase } from "@/lib/supabaseClient";
import Swal from "sweetalert2";
import { Analytics } from "@vercel/analytics/next";

export default function Home() {
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
      Swal.fire({
        title: "An error occured",
        text: "Unexpected error occured while marking task as completed",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    } else {
      getTasks(); // Refresh tasks after updating
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
      Swal.fire({
        title: "An error occured",
        text: "Unexpected error occured while deleting task",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
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
      Swal.fire({
        title: "An error occured",
        text: "Unexpected error occured while fetching tasks",
        icon: "error",
        confirmButtonText: "Continue",
        confirmButtonColor: "#3085d6",
      });
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

    // If title is empty or just spaces, return early
    if (!title.trim()) return;

    // If no user is logged in, show a message
    if (!user) {
      Swal.fire({
        title: "Login required",
        text: "You need to login before creating a task",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      // Check if title is too long and show a warning
      if (title.length > 20) {
        console.warn("Too long task title!");
        Swal.fire({
          title: "Title is too long!",
          text: "Please try to shorten the title.",
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
      } else {
        // If title length is okay, create the task
        await createTask(title, user.id);

        // Show success notification
        Swal.fire({
          title: "Task Created!",
          text: "Your task has been created successfully.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        // Clear the title input
        setTitle("");

        // Fetch updated tasks
        getTasks();
      }
    } catch (err) {
      // If task creation fails, show an error message
      Swal.fire({
        title: "An error occured",
        text: "Unexpected error happened while creating task, page loading recommended.",
        icon: "error",
        confirmButtonText: "Continue",
        confirmButtonColor: "#3085d6",
      });
      console.error("Error creating task:", err);
    }
  };

  return (
    <div>
      <SignedIn>
        <div className="bg-gradient-to-br from-blue-300 to-lime-600 bg-cover h-screen w-[99wv] text-black p-5">
          <h1 className="text-3xl text-center">Welcome to Task Manager</h1>

          <form onSubmit={handleSubmit} className="p-4 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="border px-2 py-1 text-black rounded-[10px] w-150"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-gray-500 cursor-pointer transition"
            >
              Add Task
            </button>
          </form>
          <ul className="grid grid-cols-3 gap-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className="ml-3 mb-2 p-2 border w-95 h-50 rounded-2xl bg-gradient-to-r from-rose-200 to-sky-100"
                >
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-gray-500 cursor-pointer transition"
                  >
                    Delete
                  </button>

                  <p className="text-2xl">
                    {task.completed ? "Completed" : "Not completed"}
                  </p>

                  <button
                    onClick={() => setTaskAsCompleted(task.id)}
                    className="bg-green-400 text-white px-2 py-2 rounded-lg hover:bg-gray-500 cursor-pointer transition"
                  >
                    Set as completed
                  </button>
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
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <Analytics />
    </div>
  );
}
