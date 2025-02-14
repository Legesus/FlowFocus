import { useState, useEffect } from 'react';
import { Task } from './TaskPrioritization';

interface FocusStreak {
  date: string;
  minutesFocused: number;
}

interface AnalyticsProps {
  tasks: Task[];
}

const Analytics = ({ tasks }: AnalyticsProps) => {
  const [focusStreaks, setFocusStreaks] = useState<FocusStreak[]>([]);
  const [personalizedTip, setPersonalizedTip] = useState<string>('');

  useEffect(() => {
    // Simulate loading focus streak data
    // In a real app, this would come from a database
    setFocusStreaks([
      { date: '2024-01-01', minutesFocused: 240 },
      { date: '2024-01-02', minutesFocused: 180 },
      { date: '2024-01-03', minutesFocused: 210 },
    ]);

    analyzeFocusPatterns();
  }, []);

  const analyzeFocusPatterns = () => {
    // In a real app, this would analyze actual user data
    const timeOfDay = new Date().getHours();
    if (timeOfDay >= 13 && timeOfDay <= 14) {
      setPersonalizedTip("You're most distracted after lunch—schedule breaks!");
    }
  };

  const calculateTaskStats = () => {
    const highValueTime = tasks
      .filter(task => task.category === 'deep_work')
      .reduce((acc, task) => acc + task.estimatedTime, 0);

    const lowValueTime = tasks
      .filter(task => task.category === 'low_value')
      .reduce((acc, task) => acc + task.estimatedTime, 0);

    return { highValueTime, lowValueTime };
  };

  const { highValueTime, lowValueTime } = calculateTaskStats();
  const currentStreak = focusStreaks.length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 text-indigo-900">Focus Stats</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🧠</span>
              <p className="text-sm text-gray-600">Deep Work</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{highValueTime} mins</p>
            <div className="mt-2 text-xs text-indigo-400 font-medium">
              {highValueTime > 180 ? '🎯 Crushing it!' : 'Keep pushing!'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <p className="text-sm text-gray-600">Quick Wins</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.category === 'quick_win').length}
            </p>
            <div className="mt-2 text-xs text-green-400 font-medium">
              Tasks completed today
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-green-800">Focus Streak</h3>
          <span className="text-3xl">🔥</span>
        </div>
        <div className="flex items-end gap-2 h-24 mb-2">
          {focusStreaks.map((streak, i) => (
            <div
              key={streak.date}
              className="flex-1 bg-green-200 rounded-t-lg relative group hover:bg-green-300 transition-colors"
              style={{
                height: `${(streak.minutesFocused / 480) * 100}%`,
              }}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {streak.minutesFocused} mins
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>{currentStreak} Day Streak!</span>
          <span>{focusStreaks.reduce((acc, curr) => acc + curr.minutesFocused, 0)} Total mins</span>
        </div>
      </div>

      {personalizedTip && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-lg mb-2 text-amber-900">Daily Insight</h3>
              <p className="text-amber-800">{personalizedTip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;