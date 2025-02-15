import React, { useState } from 'react';
import type { NextPage } from 'next';
import TaskPrioritization from '../components/TaskPrioritization';
import FocusMode from '../components/FocusMode';
import Analytics from '../components/Analytics';
import Calendar from '../components/Calendar';

const Home: NextPage = () => {
  const [tasks, setTasks] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <main className="container mx-auto px-8 py-12 max-w-7xl">
        <h1 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Flow<span className="text-indigo-900">Focus</span>
        </h1>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Calendar Column */}
          <div className="col-span-3">
            <Calendar />
          </div>

          {/* Main Content - 2 Columns */}
          <div className="col-span-9 grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
                <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Task Prioritization
                </h2>
                <TaskPrioritization />
              </section>

              <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
                <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
                  <span className="text-2xl">📊</span> Analytics
                </h2>
                <Analytics tasks={tasks} />
              </section>
            </div>

            {/* Right Column */}
            <div>
              <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
                <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
                  <span className="text-2xl">⏱️</span> Focus Mode
                </h2>
                <FocusMode />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;