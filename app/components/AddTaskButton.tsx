"use client";
import React from "react";

interface AddTaskButtonProps {
  label?: string;
  onClick?: () => void;
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({ label = "Add Task", onClick }) => {
  return (
    <button
      onClick={onClick}
      className="mt-4 w-full bg-gray-100 cursor-pointer text-gray-800 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition"
    >
      <span className="text-xl font-bold">+</span>
      {label}
    </button>
  );
};

export default AddTaskButton;
