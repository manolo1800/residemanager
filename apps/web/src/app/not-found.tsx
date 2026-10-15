export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-sky-600">404</h1>
        <p className="text-sm font-medium text-slate-600">Página no encontrada</p>
        <a
          href="/"
          className="inline-block px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-xl hover:bg-sky-700 transition"
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
}
