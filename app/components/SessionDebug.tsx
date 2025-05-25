'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const [serverSession, setServerSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServerSession() {
      try {
        const response = await fetch('/api/debug/session');
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        setServerSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchServerSession();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg my-4 text-xs">
      <h3 className="font-bold mb-2">Session Debug (Client)</h3>
      <div>
        <p><strong>Status:</strong> {status}</p>
        <pre className="bg-white p-2 rounded overflow-auto max-h-40 my-2">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <h3 className="font-bold mb-2 mt-4">Session Debug (Server)</h3>
      {loading ? (
        <p>Loading server session...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <pre className="bg-white p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(serverSession, null, 2)}
        </pre>
      )}
    </div>
  );
}