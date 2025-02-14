import React, { useState } from 'react';
import type { NextPage } from 'next';
import TaskPrioritization from '../components/TaskPrioritization';
import FocusMode from '../components/FocusMode';
import Analytics from '../components/Analytics';

const Home: NextPage = () => {
  const [tasks, setTasks] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <main className="container mx-auto px-8 py-12 max-w-6xl">
        <h1 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Flow<span className="text-indigo-900">Focus</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
            <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
              <span className="text-2xl">📋</span> Task Prioritization
            </h2>
            <TaskPrioritization />
          </section>

          <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
            <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
              <span className="text-2xl">⏱️</span> Focus Mode
            </h2>
            <FocusMode />
          </section>

          <section className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-indigo-50/50">
            <h2 className="text-xl font-semibold mb-6 text-indigo-900 flex items-center gap-2">
              <span className="text-2xl">📊</span> Analytics
            </h2>
            <Analytics tasks={tasks} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;