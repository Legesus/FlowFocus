import React, { useState, useEffect } from 'react';

const Calendar = () => {
  const [currentDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    setDaysInMonth(days);
  }, [currentDate]);

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-indigo-50/50">
        <h3 className="text-xl font-semibold mb-4 text-indigo-900 flex items-center gap-2">
          <span className="text-2xl">📅</span> Calendar
        </h3>
        <p className="text-sm text-gray-600 mb-4">Small and compact overview of the whole month</p>
        <div className="grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          {Array.from({ length: daysInMonth[0]?.getDay() || 0 }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {daysInMonth.map((date) => (
            <div
              key={date.toString()}
              className={`h-8 flex items-center justify-center text-sm rounded-full
                ${date.getDate() === currentDate.getDate() 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-indigo-50 text-gray-700'}`}
            >
              {date.getDate()}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tasks Section */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-indigo-50/50">
        <h3 className="text-xl font-semibold mb-4 text-indigo-900 flex items-center gap-2">
          <span className="text-2xl">📝</span> Daily Tasks
        </h3>
        <p className="text-sm text-gray-600 mb-4">List of daily tasks</p>
        <div className="space-y-2">
          <div className="text-center py-4 text-gray-500">
            No tasks scheduled for today
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;