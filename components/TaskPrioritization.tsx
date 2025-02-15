import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettings } from '../contexts/SettingsContext';
import { useModal } from '../contexts/ModalContext';
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
  const { showModal, hideModal } = useModal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    subtasks: Array<{
      description: string;
      estimatedTime: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  }>({
    title: '',
    subtasks: [{ description: '', estimatedTime: 0, priority: 'medium' }]
  });
  const [priorityAllocation, setPriorityAllocation] = useState<'balanced' | 'timeWeighted' | 'sequential'>('balanced');
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'error';
    message?: string;
  }>({ status: 'idle' });

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
    hideModal();
  };

  const allocatePriorities = (subtasks: Task['subtasks'], method: string): Task['subtasks'] => {
    switch (method) {
      case 'timeWeighted':
        return subtasks.map(task => ({
          ...task,
          priority: task.estimatedTime > 30 ? 'high' as const : 
                   task.estimatedTime > 15 ? 'medium' as const : 
                   'low' as const
        }));
      
      case 'sequential':
        return subtasks.map((task, index) => ({
          ...task,
          priority: index % 3 === 0 ? 'high' as const : 
                   index % 3 === 1 ? 'medium' as const : 
                   'low' as const
        }));
      
      case 'balanced':
      default:
        return subtasks.map((task, index) => ({
          ...task,
          priority: index < subtasks.length / 3 ? 'high' as const : 
                   index < (subtasks.length * 2) / 3 ? 'medium' as const : 
                   'low' as const
        }));
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!geminiApiKey) {
      setUploadStatus({
        status: 'error',
        message: 'Please set your Gemini API key in Settings'
      });
      if (e.target) e.target.value = '';
      return;
    }

    if (selectedModel !== 'gemini-2.0-flash') {
      setUploadStatus({
        status: 'error',
        message: 'Please select Gemini Pro Vision model in Settings for PDF processing'
      });
      if (e.target) e.target.value = '';
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadStatus({ status: 'uploading', message: 'Uploading PDF...' });
      
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('apiKey', geminiApiKey);
      formData.append('model', selectedModel);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to process PDF');
      }

      setUploadStatus({ status: 'processing', message: 'Analyzing content...' });
      const analysis = await response.json();
      
      // Set the form data with PDF analysis and show modal
      setTaskForm({
        title: analysis.title || 'PDF Task',
        subtasks: analysis.subtasks?.map((st: any) => ({
          description: st.description,
          estimatedTime: st.estimatedTime || 0,
          priority: st.priority || 'medium'
        })) || []
      });
      
      showPdfTaskModal(); // This will now use the global modal
      setUploadStatus({ status: 'idle' });

    } catch (error) {
      console.error('Error processing PDF:', error);
      setUploadStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to process PDF' 
      });
      setTimeout(() => setUploadStatus({ status: 'idle' }), 3000);
    } finally {
      setIsSubmitting(false);
      if (e.target) e.target.value = ''; // Reset file input
    }
  };

  const handlePdfSubmit = (e: React.FormEvent) => {
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
    hideModal();
  };

  const exportTaskToPDF = (task: Task) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;

    // Title
    pdf.setFontSize(16);
    pdf.text(task.title, 20, yPosition);
    yPosition += lineHeight * 2;

    // Total Time
    pdf.setFontSize(12);
    pdf.text(`Total Estimated Time: ${task.totalEstimatedTime} minutes`, 20, yPosition);
    yPosition += lineHeight * 2;

    // Subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      pdf.text('Subtasks:', 20, yPosition);
      yPosition += lineHeight;

      task.subtasks.forEach((subtask, index) => {
        const letter = String.fromCharCode(97 + index);
        const subtaskText = `${letter}. ${subtask.description}`;
        const subtaskLines = pdf.splitTextToSize(subtaskText, 160);
        pdf.text(subtaskLines, 20, yPosition);
        yPosition += lineHeight * subtaskLines.length;
        
        pdf.setFontSize(10);
        pdf.text(`    • ${subtask.estimatedTime} mins | Priority: ${subtask.priority}`, 20, yPosition);
        pdf.setFontSize(12);
        yPosition += lineHeight;
      });
    }

    // Save the PDF
    pdf.save(`task-${task.id}.pdf`);
  };

  const showManualTaskModal = () => {
    showModal(
      <>
        <h3 id="modal-title" className="text-xl font-semibold mb-4">Add New Task</h3>
        <form onSubmit={handleManualSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="manual-task-title" className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
              <input
                id="manual-task-title"
                name="taskTitle"
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
                    <div>
                      <label htmlFor={`manual-subtask-desc-${index}`} className="sr-only">
                        Subtask {index + 1} description
                      </label>
                      <input
                        id={`manual-subtask-desc-${index}`}
                        name={`subtaskDescription${index}`}
                        type="text"
                        value={subtask.description}
                        onChange={(e) => handleSubtaskChange(index, 'description', e.target.value)}
                        placeholder="Subtask description"
                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div>
                        <label htmlFor={`manual-subtask-time-${index}`} className="sr-only">
                          Estimated time for subtask {index + 1}
                        </label>
                        <input
                          id={`manual-subtask-time-${index}`}
                          name={`subtaskTime${index}`}
                          type="number"
                          value={subtask.estimatedTime}
                          onChange={(e) => handleSubtaskChange(index, 'estimatedTime', parseInt(e.target.value) || 0)}
                          placeholder="Minutes"
                          className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`manual-subtask-priority-${index}`} className="sr-only">
                          Priority for subtask {index + 1}
                        </label>
                        <select
                          id={`manual-subtask-priority-${index}`}
                          name={`subtaskPriority${index}`}
                          value={subtask.priority}
                          onChange={(e) => handleSubtaskChange(index, 'priority', e.target.value as 'high' | 'medium' | 'low')}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label={`Remove subtask ${index + 1}`}
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </>
    );
  };

  const showPdfTaskModal = () => {
    showModal(
      <>
        <h3 id="modal-title" className="text-xl font-semibold mb-4">Review PDF Task</h3>
        <form onSubmit={handlePdfSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-task-title" className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
              <input
                id="pdf-task-title"
                name="pdfTaskTitle"
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="priority-allocation" className="block text-sm font-medium text-gray-700 mb-1">Priority Allocation</label>
              <select
                id="priority-allocation"
                name="priorityAllocation"
                value={priorityAllocation}
                onChange={(e) => {
                  setPriorityAllocation(e.target.value as typeof priorityAllocation);
                  const updatedSubtasks = allocatePriorities(taskForm.subtasks, e.target.value);
                  setTaskForm({ ...taskForm, subtasks: updatedSubtasks });
                }}
                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              >
                <option value="balanced">Balanced Distribution</option>
                <option value="timeWeighted">Time-based Priority</option>
                <option value="sequential">Sequential Distribution</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Subtasks from PDF</label>
              {taskForm.subtasks.map((subtask, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <div>
                      <label htmlFor={`pdf-subtask-desc-${index}`} className="sr-only">
                        Subtask {index + 1} description
                      </label>
                      <input
                        id={`pdf-subtask-desc-${index}`}
                        name={`pdfSubtaskDescription${index}`}
                        type="text"
                        value={subtask.description}
                        onChange={(e) => handleSubtaskChange(index, 'description', e.target.value)}
                        placeholder="Subtask description"
                        className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div>
                        <label htmlFor={`pdf-subtask-time-${index}`} className="sr-only">
                          Estimated time for subtask {index + 1}
                        </label>
                        <input
                          id={`pdf-subtask-time-${index}`}
                          name={`pdfSubtaskTime${index}`}
                          type="number"
                          value={subtask.estimatedTime}
                          onChange={(e) => handleSubtaskChange(index, 'estimatedTime', parseInt(e.target.value) || 0)}
                          placeholder="Minutes"
                          className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`pdf-subtask-priority-${index}`} className="sr-only">
                          Priority for subtask {index + 1}
                        </label>
                        <select
                          id={`pdf-subtask-priority-${index}`}
                          name={`pdfSubtaskPriority${index}`}
                          value={subtask.priority}
                          onChange={(e) => handleSubtaskChange(index, 'priority', e.target.value as 'high' | 'medium' | 'low')}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label={`Remove subtask ${index + 1}`}
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={showManualTaskModal}
          aria-label="Add manual task"
          className="flex-1 p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">📝</span>
          Manual Task
        </button>
        <div className="flex-1 relative">
          <label 
            htmlFor="pdf-upload"
            className={`w-full p-4 rounded-lg bg-white border-2 border-dashed ${
              uploadStatus.status === 'error' ? 'border-red-300 hover:border-red-500' :
              uploadStatus.status === 'processing' ? 'border-yellow-300' :
              uploadStatus.status === 'uploading' ? 'border-blue-300' :
              'border-indigo-300 hover:border-indigo-500'
            } cursor-pointer flex items-center justify-center gap-2 text-indigo-600`}
          >
            <span aria-hidden="true">{
              uploadStatus.status === 'uploading' ? '📤' :
              uploadStatus.status === 'processing' ? '🔄' :
              uploadStatus.status === 'error' ? '❌' :
              '➕'
            }</span>
            <span>{uploadStatus.status === 'idle' ? 'Add PDF' : uploadStatus.message}</span>
            <input
              id="pdf-upload"
              name="pdfUpload"
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
              disabled={uploadStatus.status !== 'idle'}
              aria-label="Upload PDF file"
            />
          </label>
          {uploadStatus.status === 'error' && (
            <p className="absolute w-full text-center text-sm text-red-600 mt-1" role="alert">
              {uploadStatus.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task: Task) => (
          <div 
            key={task.id} 
            className="p-4 bg-white rounded-lg shadow-sm border border-indigo-50 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-gray-800 font-medium">
                  {task.title}
                  <span className="ml-2 text-sm text-gray-500">
                    (Total: {task.totalEstimatedTime} mins)
                  </span>
                </h3>
              </div>
              <button
                onClick={() => exportTaskToPDF(task)}
                aria-label={`Export ${task.title} to PDF`}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <span aria-hidden="true">📄</span> Export to PDF
              </button>
            </div>
            
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-3 space-y-2" role="list" aria-label={`Subtasks for ${task.title}`}>
                {task.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg" role="listitem">
                    <span className="text-gray-400" aria-hidden="true">{index + 1}.</span>
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
          <div className="text-center py-8" role="status">
            <p className="text-gray-400">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Add a task to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPrioritization;