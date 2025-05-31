import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlannerProvider } from './context/PlannerContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import FinancialGoalsPlanner from './components/FinancialGoalsPlanner';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen app-background">
          <Router>
            <CurrencyProvider>
              <PlannerProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/plan" element={<FinancialGoalsPlanner />} />
                  <Route path="/plan/:step" element={<FinancialGoalsPlanner />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </PlannerProvider>
            </CurrencyProvider>
          </Router>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;