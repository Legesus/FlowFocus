import { useState } from 'react';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { useSettings } from '../contexts/SettingsContext';
import * as pdfjsLib from 'pdfjs-dist';

export interface Task {
  id: string;
  title: string;
  deadline?: Date;
  description?: string;
  category: 'quick_win' | 'deep_work' | 'low_value';
  estimatedTime: number;
}

const TaskPrioritization = () => {
  const { selectedModel } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    deadline: '',
    description: ''
  });

  const categorizeTask = async (taskTitle: string) => {
    try {
      console.log('🤖 Initializing Gemini API...');
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: selectedModel });

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

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const analyzePdfContent = async (text: string, file: File) => {
    try {
      console.log('🤖 Initializing Gemini API for PDF analysis...');
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

      const prompt = `Analyze this PDF content and extract:
1. Task title/name
2. Deadline (if any)
3. Description or key details

Please format your response as JSON:
{
  "title": "extracted title",
  "deadline": "YYYY-MM-DD" or null,
  "description": "extracted description"
}`;

      const imageData = await file.arrayBuffer();
      const response = await model.generateContent([
        prompt,
        text,
        {
          inlineData: {
            data: Buffer.from(imageData).toString('base64'),
            mimeType: 'application/pdf'
          }
        }
      ]);
      
      const result = await response.response;
      const responseText = result.text();
      
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('❌ Error analyzing PDF:', error);
      throw error;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { category, estimatedTime } = await categorizeTask(taskForm.title);
    
    setTasks([...tasks, {
      id: Date.now().toString(),
      title: taskForm.title,
      deadline: taskForm.deadline ? new Date(taskForm.deadline) : undefined,
      description: taskForm.description,
      category,
      estimatedTime
    }]);

    setTaskForm({ title: '', deadline: '', description: '' });
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const text = await extractTextFromPdf(file);
      const analysis = await analyzePdfContent(text, file);
      
      const { category, estimatedTime } = await categorizeTask(analysis.title);
      
      setTasks([...tasks, {
        id: Date.now().toString(),
        title: analysis.title,
        deadline: analysis.deadline ? new Date(analysis.deadline) : undefined,
        description: analysis.description,
        category,
        estimatedTime
      }]);

    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again or add task manually.');
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
        <label className="flex-1 p-4 rounded-lg bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 cursor-pointer flex items-center justify-center gap-2 text-indigo-600">
          <span>➕</span>
          Add PDF
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
        </label>
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
                    <p className="text-gray-800 font-medium group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-indigo-400">⏱️</span>
                      <small className="text-indigo-400 font-medium">
                        {task.estimatedTime} mins
                      </small>
                    </div>
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