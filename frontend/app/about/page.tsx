export default function About() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mt-8 bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            About This Project
          </h2>

          <p className="mt-3 text-gray-600">
            This application is built using Next.js for the
            frontend and FastAPI for the backend.
          </p>
        </div>
      </div>
    </main>
  );
}
