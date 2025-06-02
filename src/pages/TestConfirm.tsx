import React from 'react';
import { useSearchParams } from 'react-router-dom';

const TestConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // Get all URL parameters
  const allParams = Object.fromEntries(searchParams.entries());
  
  return (
    <div className="min-h-screen bg-theme-primary p-8">
      <div className="max-w-2xl mx-auto bg-theme-card rounded-lg p-6">
        <h1 className="text-2xl font-bold text-theme-primary mb-4">Email Confirmation Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-theme-primary">Current URL:</h3>
            <p className="text-theme-secondary break-all">{window.location.href}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary">URL Parameters:</h3>
            <pre className="bg-theme-tertiary p-4 rounded text-sm overflow-auto text-theme-secondary">
              {JSON.stringify(allParams, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary">Expected Parameters:</h3>
            <ul className="text-theme-secondary space-y-1">
              <li>• <strong>token_hash</strong> - The confirmation token</li>
              <li>• <strong>type</strong> - Should be "email"</li>
              <li>• <strong>OR access_token + refresh_token</strong> - New format</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary">Current Window Location:</h3>
            <ul className="text-theme-secondary space-y-1">
              <li>• <strong>Origin:</strong> {window.location.origin}</li>
              <li>• <strong>Hostname:</strong> {window.location.hostname}</li>
              <li>• <strong>Port:</strong> {window.location.port}</li>
              <li>• <strong>Protocol:</strong> {window.location.protocol}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConfirm; 