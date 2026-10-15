"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
      <div className="text-center space-y-3 max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-rose-600">Ha ocurrido un error inesperado</h2>
        <p className="text-xs text-slate-500">{error.message || "Error al renderizar el componente"}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl hover:bg-sky-700 transition"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
