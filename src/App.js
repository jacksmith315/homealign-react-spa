import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import Navigation from './components/layout/Navigation';
import PatientManagement from './components/pages/PatientManagement';
import ClientManagement from './components/pages/ClientManagement';
import ProviderManagement from './components/pages/ProviderManagement';
import ReferralManagement from './components/pages/ReferralManagement';
import ServiceManagement from './components/pages/ServiceManagement';
import './index.css';

// eslint-disable-next-line no-unused-vars
const PlaceholderView = ({ title, description }) => (
  <div className="p-6">
    <div className="text-center py-12">
      <div className="text-6xl text-gray-300 mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-sm text-gray-500">
        This section will be implemented following the same pattern as other management screens.
      </p>
    </div>
  </div>
);

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('patients');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'patients':
        return <PatientManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'providers':
        return <ProviderManagement />;
      case 'referrals':
        return <ReferralManagement />;
      case 'services':
        return <ServiceManagement />;
      default:
        return <PatientManagement />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div>
        {renderCurrentView()}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
