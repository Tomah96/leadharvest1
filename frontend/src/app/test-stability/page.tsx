"use client";

export default function TestStabilityPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Frontend Stability Test</h1>
      <p className="text-gray-600">
        If you can see this page without rapid reloading, the frontend is stable.
      </p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p className="text-green-800">✅ Frontend is working correctly!</p>
      </div>
    </div>
  );
}