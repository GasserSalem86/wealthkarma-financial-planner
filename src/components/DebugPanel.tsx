import React from 'react';
import { usePlanner } from '../context/PlannerContext';

const DebugPanel: React.FC = () => {
  const { state } = usePlanner();

  const clearData = () => {
    localStorage.removeItem('planner-state');
    window.location.reload();
  };

  const showDebugInfo = () => {
    console.log('Current state:', state);
    console.log('User profile:', state.userProfile);
    console.log('Goals:', state.goals);
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 rounded p-2 text-xs">
      <div className="mb-2 font-bold">Debug Panel</div>
      <div className="space-y-1">
        <button 
          onClick={clearData}
          className="block w-full text-left px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Data
        </button>
        <button 
          onClick={showDebugInfo}
          className="block w-full text-left px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Log State
        </button>
      </div>
      <div className="mt-2 text-xs">
        <div>Profile: {state.userProfile.nationality || 'None'}</div>
        <div>Location: {state.userProfile.location || 'None'}</div>
        <div>Planning: {state.userProfile.planningType || 'None'}</div>
        <div>Family Size: {state.userProfile.familySize || 'None'}</div>
        <div>Current Savings: {state.userProfile.currentSavings || 0}</div>
        <div>Goals: {state.goals.length}</div>
        <div>Leftover Savings: {state.leftoverSavings || 0}</div>
      </div>
    </div>
  );
};

export default DebugPanel; 