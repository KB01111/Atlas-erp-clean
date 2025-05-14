import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <h1 className="text-4xl font-bold mb-6">404 - Page Not Found</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
