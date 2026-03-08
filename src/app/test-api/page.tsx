"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { API_URL } from '@/lib/api';

export default function TestAPIPage() {
  const { user, token } = useAuth();
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, { test, success, data, time: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setResults([]);

    // Test 1: Check API_URL
    addResult('API_URL Configuration', true, { API_URL });

    // Test 2: Check Auth State
    addResult('Auth State', !!token, {
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token?.length || 0,
      userId: user?._id || 'none'
    });

    // Test 3: Test public endpoint (no auth)
    try {
      const res1 = await fetch(`${API_URL}/api/categories`);
      const data1 = await res1.json();
      addResult('Public API (categories)', res1.ok, {
        status: res1.status,
        data: data1
      });
    } catch (error: any) {
      addResult('Public API (categories)', false, { error: error.message });
    }

    // Test 4: Test authenticated endpoint
    if (token) {
      try {
        const res2 = await fetch(`${API_URL}/api/user/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data2 = await res2.json();
        addResult('Authenticated API (favorites)', res2.ok, {
          status: res2.status,
          data: data2
        });
      } catch (error: any) {
        addResult('Authenticated API (favorites)', false, { error: error.message });
      }

      // Test 5: Test stream endpoint
      try {
        const res3 = await fetch(`${API_URL}/api/episodes/699d2f5509fc8de0bcb6dec0/stream`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data3 = await res3.json();
        addResult('Stream API', res3.ok, {
          status: res3.status,
          data: data3
        });
      } catch (error: any) {
        addResult('Stream API', false, { error: error.message });
      }
    } else {
      addResult('Authenticated API', false, { error: 'No token available' });
    }

    // Test 6: Check localStorage
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      addResult('LocalStorage Check', true, {
        hasStoredToken: !!storedToken,
        hasStoredUser: !!storedUser,
        tokenMatch: storedToken === token
      });
    }
  };

  useEffect(() => {
    runTests();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-400 mb-6">API 诊断测试</h1>

        <button
          onClick={runTests}
          className="mb-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
        >
          重新运行测试
        </button>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-red-900/20 border-red-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  {result.success ? '✅' : '❌'} {result.test}
                </h3>
                <span className="text-sm text-gray-400">{result.time}</span>
              </div>
              <pre className="text-sm bg-black/30 p-3 rounded overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            运行测试中...
          </div>
        )}
      </div>
    </div>
  );
}
