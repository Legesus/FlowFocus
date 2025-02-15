import { useState } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { useSettings } from '../contexts/SettingsContext';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

export interface Task {
  id: string;
  title: string;
  deadline?: Date;
  description?: string;
  category: 'quick_win' | 'deep_work' | 'low_value';
  estimatedTime: number;
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
    deadline: '',
    description: ''
  });
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const categorizeTask = async (taskTitle: string) => {
    if (!geminiApiKey) {
      throw new Error('Please set your Gemini API key in Settings');
    }

    try {
      console.log('🤖 Initializing Gemini API...');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      // Always use gemini-2.0-flash for text analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      console.log('🔄 Analyzing task with Gemini AI...');
      const prompt = `As an AI task prioritization expert, analyze this task and categorize it. Consider the following criteria:

Task: "${taskTitle}"

Categorize into one of:
- 'quick_win': Simple tasks that take less than 10 minutes and provide immediate value
- 'deep_work': Complex, high-impact tasks requiring focused attention and strategic thinking
- 'low_value': Tasks that could be delegated, automated, or possibly eliminated

Provide a JSON response with:
{
  "category": "category_name",
  "estimatedTime": estimated_minutes_number
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsedResult = JSON.parse(jsonMatch[0]);
      console.log('✅ Task analyzed successfully:', parsedResult);
      return parsedResult;
    } catch (error) {
      console.error('❌ Error analyzing task:', error);
      return { category: 'quick_win', estimatedTime: 5 };
    }
  };

  const generateSubtasks = async (taskTitle: string, description?: string) => {
    if (!geminiApiKey) {
      throw new Error('Please set your Gemini API key in Settings');
    }

    try {
      console.log('🤖 Generating subtasks with Gemini AI...');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      // Always use gemini-2.0-flash for text analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `As an AI task breakdown expert, analyze this task and break it down into smaller subtasks.
      
Task: "${taskTitle}"
${description ? `Description: "${description}"` : ''}

Create 2-4 subtasks that would help complete this task. For each subtask:
1. Provide a clear, actionable description
2. Estimate time needed in minutes
3. Suggest priority (high/medium/low)

Format response as JSON array:
[
  {
    "description": "subtask description",
    "estimatedTime": minutes_number,
    "priority": "high|medium|low"
  }
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const subtasks = JSON.parse(jsonMatch[0]);
      console.log('✅ Subtasks generated successfully:', subtasks);
      return subtasks;
    } catch (error) {
      console.error('❌ Error generating subtasks:', error);
      return [];
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { category, estimatedTime } = await categorizeTask(taskForm.title);
      const subtasks = await generateSubtasks(taskForm.title, taskForm.description);
      
      setTasks([...tasks, {
        id: Date.now().toString(),
        title: taskForm.title,
        deadline: taskForm.deadline ? new Date(taskForm.deadline) : undefined,
        description: taskForm.description,
        category,
        estimatedTime,
        subtasks
      }]);

      setTaskForm({ title: '', deadline: '', description: '' });
      setShowModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to process task');
    } finally {
      setIsSubmitting(false);
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
      const { category, estimatedTime } = await categorizeTask(analysis.title);
      
      setTasks([...tasks, {
        id: Date.now().toString(),
        title: analysis.title,
        deadline: analysis.deadline ? new Date(analysis.deadline) : undefined,
        description: analysis.description,
        category,
        estimatedTime,
        subtasks: analysis.subtasks || []
      }]);

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

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'deep_work': return '🧠';
      case 'quick_win': return '🚀';
      case 'low_value': return '🗑️';
      default: return '📌';
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'deep_work': return 'bg-indigo-50 border-indigo-200';
      case 'quick_win': return 'bg-green-50 border-green-200';
      case 'low_value': return 'bg-gray-50 border-gray-200';
      default: return 'bg-white';
    }
  };

  const exportTaskToPDF = (task: Task) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;

    // Title
    pdf.setFontSize(16);
    pdf.text(task.title, 20, yPosition);
    yPosition += lineHeight * 2;

    // Deadline
    pdf.setFontSize(12);
    if (task.deadline) {
      pdf.text(`Due: ${task.deadline.toLocaleDateString()}`, 20, yPosition);
      yPosition += lineHeight;
    }

    // Estimated Time
    pdf.text(`Estimated Time: ${task.estimatedTime} minutes`, 20, yPosition);
    yPosition += lineHeight;

    // Description
    if (task.description) {
      yPosition += lineHeight;
      pdf.text('Description:', 20, yPosition);
      yPosition += lineHeight;
      const descriptionLines = pdf.splitTextToSize(task.description, 170);
      pdf.text(descriptionLines, 20, yPosition);
      yPosition += lineHeight * descriptionLines.length;
    }

    // Subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      yPosition += lineHeight;
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

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-2"
        >
          <span>📝</span>
          Manual Task
        </button>
        <div className="flex-1 relative">
          <label className={`w-full p-4 rounded-lg bg-white border-2 border-dashed ${
            uploadStatus.status === 'error' ? 'border-red-300 hover:border-red-500' :
            uploadStatus.status === 'processing' ? 'border-yellow-300' :
            uploadStatus.status === 'uploading' ? 'border-blue-300' :
            'border-indigo-300 hover:border-indigo-500'
          } cursor-pointer flex items-center justify-center gap-2 text-indigo-600`}>
            <span>{
              uploadStatus.status === 'uploading' ? '📤' :
              uploadStatus.status === 'processing' ? '🔄' :
              uploadStatus.status === 'error' ? '❌' :
              '➕'
            }</span>
            {uploadStatus.status === 'idle' ? 'Add PDF' : uploadStatus.message}
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
              disabled={uploadStatus.status !== 'idle'}
            />
          </label>
          {uploadStatus.status === 'error' && (
            <p className="absolute w-full text-center text-sm text-red-600 mt-1">
              {uploadStatus.message}
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    rows={3}
                  />
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
        {['deep_work', 'quick_win', 'low_value'].map(category => (
          <div 
            key={category} 
            className={`rounded-xl border p-5 ${getCategoryColor(category)} transition-all hover:shadow-md`}
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <span className="text-lg capitalize">
                  {category.split('_').join(' ')}
                </span>
              </span>
              <span className="text-sm font-normal text-gray-500">
                {tasks.filter(task => task.category === category).length} tasks
              </span>
            </h3>
            <div className="space-y-3">
              {tasks
                .filter(task => task.category === category)
                .map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 bg-white rounded-lg shadow-sm border border-indigo-50 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </p>
                        {task.deadline && (
                          <p className="text-sm text-gray-500 mt-1">
                            Due: {task.deadline.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => exportTaskToPDF(task)}
                        className="ml-2 p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Export as PDF"
                      >
                        📄
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-indigo-400">⏱️</span>
                      <small className="text-indigo-400 font-medium">
                        {task.estimatedTime} mins
                      </small>
                    </div>
                    
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-indigo-100">
                        {task.subtasks.map((subtask, index) => (
                          <div key={index} className="mb-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-gray-400">{String.fromCharCode(97 + index)}.</span>
                              <div className="flex-1">
                                <p className="text-gray-700">{subtask.description}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {subtask.estimatedTime} mins • Priority: {subtask.priority}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              {tasks.filter(task => task.category === category).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No tasks yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a task to get started!</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskPrioritization;