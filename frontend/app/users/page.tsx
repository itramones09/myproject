"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("${process.env.NEXT_PUBLIC_API_URL}/users");

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Could not connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold">
        Users
      </h1>

      {loading && (
        <p className="mt-6">Loading users...</p>
      )}

      {error && (
        <p className="mt-6 text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {user.name}
              </h2>

              <p className="text-gray-600">
                {user.email}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
