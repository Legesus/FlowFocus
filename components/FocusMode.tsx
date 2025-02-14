import { useState, useEffect } from 'react';

interface FocusModeProps {
  defaultWorkDuration?: number;
  defaultBreakDuration?: number;
}

const FocusMode = ({ 
  defaultWorkDuration = 45,
  defaultBreakDuration = 10 
}: FocusModeProps) => {
  const [timeLeft, setTimeLeft] = useState(defaultWorkDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = () => {
    const message = isWorkTime ? "Time for a break!" : "Back to work!";
    speak(message);
    setIsWorkTime(!isWorkTime);
    setTimeLeft((isWorkTime ? defaultBreakDuration : defaultWorkDuration) * 60);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive) {
      speak(`Starting ${isWorkTime ? 'work' : 'break'} session`);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addBlockedApp = (app: string) => {
    if (!blockedApps.includes(app)) {
      setBlockedApps([...blockedApps, app]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-6">
          <div className="absolute inset-0 bg-indigo-100 rounded-full shadow-inner"></div>
          <div className="absolute inset-4 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-indigo-900 mb-1 font-mono">{formatTime(timeLeft)}</h3>
              <p className="text-indigo-600 font-medium">
                {isWorkTime ? '🎯 Focus Session' : '☕ Break Time'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-x-4">
          <button
            onClick={toggleTimer}
            className={`px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            } shadow-lg`}
          >
            {isActive ? 'Pause' : 'Start Focus'}
          </button>
          
          <button
            onClick={() => setTimeLeft(defaultWorkDuration * 60)}
            className="px-4 py-3 rounded-full font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm">
        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🚫</span> Distraction Blocker
        </h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {blockedApps.map(app => (
            <span key={app} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2">
              {app}
              <button 
                onClick={() => setBlockedApps(blockedApps.filter(a => a !== app))}
                className="text-indigo-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          {blockedApps.length === 0 && (
            <p className="text-indigo-400 text-sm py-2">Add websites or apps to block during focus time</p>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Add app or website to block..."
            className="w-full px-4 py-3 rounded-lg bg-white border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent pr-10 placeholder:text-gray-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addBlockedApp((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
          <span className="absolute right-3 top-3 text-indigo-400">🔒</span>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;