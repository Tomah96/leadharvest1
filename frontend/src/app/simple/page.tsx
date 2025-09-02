export default function SimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Simple Test Page</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        This page has no API calls - just static content to test if the app is working.
      </p>
      
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">✅ If you see this:</h2>
          <p>The frontend is working correctly!</p>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Navigation Links:</h2>
          <ul className="space-y-2">
            <li><a href="/" className="text-primary-600 hover:underline">Home (may have API issues)</a></li>
            <li><a href="/test/gmail" className="text-primary-600 hover:underline">Gmail Test Page</a></li>
            <li><a href="/settings" className="text-primary-600 hover:underline">Settings</a></li>
          </ul>
        </div>
        
        <div className="card bg-yellow-50 dark:bg-yellow-900/20">
          <h2 className="text-xl font-semibold mb-2">⚠️ Known Issues:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Database connection not configured</li>
            <li>API authentication temporarily bypassed</li>
            <li>Some pages may show errors due to missing data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}