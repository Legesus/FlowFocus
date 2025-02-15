import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettings } from '../contexts/SettingsContext';

export interface Task {
  id: string;
  title: string;
  category: 'quick_win' | 'deep_work' | 'low_value';
  estimatedTime: number;
}

const TaskPrioritization = () => {
  const { selectedModel } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { category, estimatedTime } = await categorizeTask(newTask);
    
    setTasks([...tasks, {
      id: Date.now().toString(),
      title: newTask,
      category,
      estimatedTime
    }]);
    setNewTask('');
    setIsSubmitting(false);
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
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl shadow-sm">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full p-4 rounded-lg bg-white shadow-sm border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 text-lg"
            placeholder="What needs to be done?"
            disabled={isSubmitting}
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`mt-4 w-full py-4 px-6 rounded-lg font-medium transition-all
              ${isSubmitting 
                ? 'bg-indigo-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:transform active:scale-[0.98]'} 
              text-white shadow-lg flex items-center justify-center gap-2`}
          >
            <span>{isSubmitting ? '🤔' : '✨'}</span>
            {isSubmitting ? 'Analyzing Task...' : 'Add Task'}
          </button>
        </div>
      </form>

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