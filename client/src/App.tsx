import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { DevelopersListPage } from './pages/DevelopersListPage';
import { SkillsListPage } from './pages/SkillsListPage';
import { DeveloperDetailPage } from './pages/DeveloperDetailPage';
import { SkillDetailPage } from './pages/SkillDetailPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-emerald-500 selection:text-white">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/developers" element={<DevelopersListPage />} />
            <Route path="/developers/:name" element={<DeveloperDetailPage />} />
            <Route path="/skills" element={<SkillsListPage />} />
            <Route path="/skills/:name" element={<SkillDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
