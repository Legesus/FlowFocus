import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettings } from '../contexts/SettingsContext';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

export interface Task {
  id: string;
  title: string;
  totalEstimatedTime: number;
  subtasks: Array<{
    description: string;
    estimatedTime: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const TaskPrioritization = () => {
  const { selectedModel, geminiApiKey } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    subtasks: [{ description: '', estimatedTime: 0, priority: 'medium' as const }]
  });

  const calculateTotalTime = (subtasks: Task['subtasks']) => {
    return subtasks.reduce((acc, subtask) => acc + subtask.estimatedTime, 0);
  };

  const handleAddSubtask = () => {
    setTaskForm({
      ...taskForm,
      subtasks: [...taskForm.subtasks, { description: '', estimatedTime: 0, priority: 'medium' }]
    });
  };

  const handleRemoveSubtask = (index: number) => {
    setTaskForm({
      ...taskForm,
      subtasks: taskForm.subtasks.filter((_, i) => i !== index)
    });
  };

  const handleSubtaskChange = (index: number, field: string, value: string | number) => {
    const newSubtasks = [...taskForm.subtasks];
    newSubtasks[index] = {
      ...newSubtasks[index],
      [field]: value
    };
    setTaskForm({
      ...taskForm,
      subtasks: newSubtasks
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || isSubmitting) return;

    const totalTime = calculateTotalTime(taskForm.subtasks);
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskForm.title,
      totalEstimatedTime: totalTime,
      subtasks: taskForm.subtasks
    };

    setTasks([...tasks, newTask]);
    setTaskForm({ title: '', subtasks: [{ description: '', estimatedTime: 0, priority: 'medium' }] });
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-2"
        >
          <span>📝</span>
          Add Task
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Subtasks</label>
                  {taskForm.subtasks.map((subtask, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={subtask.description}
                          onChange={(e) => handleSubtaskChange(index, 'description', e.target.value)}
                          placeholder="Subtask description"
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={subtask.estimatedTime}
                            onChange={(e) => handleSubtaskChange(index, 'estimatedTime', parseInt(e.target.value) || 0)}
                            placeholder="Minutes"
                            className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          />
                          <select
                            value={subtask.priority}
                            onChange={(e) => handleSubtaskChange(index, 'priority', e.target.value as 'high' | 'medium' | 'low')}
                            className="flex-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="w-full p-2 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    + Add Subtask
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                >
                  {isSubmitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task: Task) => (
          <div 
            key={task.id} 
            className="p-4 bg-white rounded-lg shadow-sm border border-indigo-50 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-800 font-medium">
                  {task.title}
                  <span className="ml-2 text-sm text-gray-500">
                    (Total: {task.totalEstimatedTime} mins)
                  </span>
                </p>
              </div>
            </div>
            
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="text-gray-700">{subtask.description}</p>
                      <p className="text-gray-500 text-sm">
                        {subtask.estimatedTime} mins • Priority: {subtask.priority}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Add a task to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPrioritization;