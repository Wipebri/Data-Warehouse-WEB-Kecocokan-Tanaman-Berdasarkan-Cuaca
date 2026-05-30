import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/landing/Hero';
import HowItWorks from './components/landing/HowItWorks';
import Features from './components/landing/Features';
import AgroInsights from './components/landing/AgroInsights';
import Cta from './components/landing/Cta';
import CropAnalysisPage from './components/analysis/CropAnalysisPage';
import HistoricalDataPage from './components/weather/HistoricalDataPage';
import ReportsPage from './components/reports/ReportsPage';
import AdminPage from './components/admin/AdminPage';
import ProtectedPage from './components/common/ProtectedPage';
import Toast from './components/common/Toast';
import type { PageKey } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('beranda');

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if ((u.role === 'admin' || u.role === 'superadmin') && activePage !== 'admin' && activePage !== 'admin-dw') {
        setActivePage('admin')
      }
    } catch { /* ignore */ }
  }, [activePage])

  const renderPage = () => {
    switch (activePage) {
      case 'beranda':
        return (
          <>
            <Hero onNavigate={setActivePage} />
            <HowItWorks />
            <Features onNavigate={setActivePage} />
            <AgroInsights />
            <Cta onNavigate={setActivePage} />
          </>
        );
      case 'analisis-tanaman':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <CropAnalysisPage />
          </ProtectedPage>
        );
      case 'cuaca':
        return <Weather />;
      case 'historis':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <HistoricalDataPage />
          </ProtectedPage>
        );
      case 'laporan':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <ReportsPage />
          </ProtectedPage>
        );
      case 'admin':
      case 'admin-dw':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <AdminPage onNavigate={setActivePage} />
          </ProtectedPage>
        );
      case 'login':
        return <LoginPage onNavigate={(p) => setActivePage(p as PageKey)} />;
      case 'register':
        return <RegisterPage onNavigate={(p) => setActivePage(p as PageKey)} />;
      default:
        return (
          <>
            <Hero onNavigate={setActivePage} />
            <HowItWorks />
            <Features onNavigate={setActivePage} />
            <AgroInsights />
            <Cta onNavigate={setActivePage} />
          </>
        );
    }
  };

  const hideShell = activePage === 'login' || activePage === 'register' || activePage === 'admin' || activePage === 'admin-dw'
  const userJson = localStorage.getItem('user')
  const authKey = userJson ? 'auth-y' : 'auth-n'
  const toastKey = localStorage.getItem('toast') || ''

  return (
    <div className="min-h-screen font-sans bg-[#f6f6ee]">
      {toastKey && <Toast key={toastKey} />}
      {!hideShell && <Navbar key={authKey} activePage={activePage} onNavigate={setActivePage} />}
      {renderPage()}
      {!hideShell && <Footer />}
    </div>
  );
}
