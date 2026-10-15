"use client";

import { useState } from "react";
import { Badge } from "@sgc/ui";
import {
  Building2,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  Coins,
  FileSpreadsheet,
  TreePine,
  Car,
  Lock,
  LogIn,
  CheckCircle2,
  AlertCircle,
  FileText,
  Server,
  LayoutDashboard,
  Building,
  Home,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  KeyRound,
  Loader2,
  Search,
  MapPin,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { fetchApi, getApiBaseUrl, setAuthToken, setCurrentUser } from "../lib/api";

export default function LandingPage() {
  // Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateCondoModal, setShowCreateCondoModal] = useState(false);
  const [showResidentRegisterModal, setShowResidentRegisterModal] = useState(false);

  // Resident Register form state
  const [residentFullName, setResidentFullName] = useState("");
  const [residentDocumentType, setResidentDocumentType] = useState<"V" | "E" | "J" | "P">("V");
  const [residentDocumentNumber, setResidentDocumentNumber] = useState("");
  const [residentEmail, setResidentEmail] = useState("");
  const [residentPhone, setResidentPhone] = useState("");
  const [residentPassword, setResidentPassword] = useState("");
  const [residentConfirmPassword, setResidentConfirmPassword] = useState("");
  const [showResidentPassword, setShowResidentPassword] = useState(false);

  // Optional condo linkage during resident registration
  const [residentSearchCondoQuery, setResidentSearchCondoQuery] = useState("");
  const [residentCondoResults, setResidentCondoResults] = useState<any[]>([]);
  const [selectedResidentCondo, setSelectedResidentCondo] = useState<any | null>(null);
  const [residentUnitCode, setResidentUnitCode] = useState("");
  const [isSearchingResidentCondo, setIsSearchingResidentCondo] = useState(false);

  const [residentLoading, setResidentLoading] = useState(false);
  const [residentError, setResidentError] = useState<string | null>(null);
  const [residentSuccess, setResidentSuccess] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Create Condo form state - Admin data
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Email verification state
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "exists" | "available">("idle");
  const [existingPassword, setExistingPassword] = useState("");
  const [showExistingPassword, setShowExistingPassword] = useState(false);

  // Create Condo form state - Condo data
  const [condoCode, setCondoCode] = useState("");
  const [condoName, setCondoName] = useState("");
  const [condoType, setCondoType] = useState<"buildings" | "houses">("buildings");
  const [condoAddress, setCondoAddress] = useState("");
  const [condoCurrency, setCondoCurrency] = useState("USD");
  const [condoLoading, setCondoLoading] = useState(false);
  const [condoError, setCondoError] = useState<string | null>(null);
  const [condoSuccess, setCondoSuccess] = useState<string | null>(null);

  const handleSearchResidentCondo = async (query: string) => {
    setResidentSearchCondoQuery(query);
    if (!query || query.trim().length < 2) {
      setResidentCondoResults([]);
      return;
    }
    try {
      setIsSearchingResidentCondo(true);
      const res = await fetch(`${getApiBaseUrl()}/condominiums/public-search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResidentCondoResults(Array.isArray(data) ? data : []);
    } catch {
      setResidentCondoResults([]);
    } finally {
      setIsSearchingResidentCondo(false);
    }
  };

  const handleRegisterResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setResidentLoading(true);
    setResidentError(null);
    setResidentSuccess(null);

    if (residentPassword !== residentConfirmPassword) {
      setResidentError("Las contraseñas no coinciden.");
      setResidentLoading(false);
      return;
    }
    if (residentPassword.length < 8) {
      setResidentError("La contraseña debe tener al menos 8 caracteres.");
      setResidentLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/register-resident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: residentFullName.trim(),
          documentType: residentDocumentType,
          documentNumber: residentDocumentNumber.trim(),
          email: residentEmail.trim().toLowerCase(),
          phone: residentPhone.trim() || undefined,
          password: residentPassword,
          condominiumId: selectedResidentCondo ? selectedResidentCondo.id : undefined,
          unitCode: residentUnitCode.trim() ? residentUnitCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al registrar la cuenta de residente.");
      }

      setAuthToken(data.tokens.accessToken);
      setCurrentUser(data.user);
      setResidentSuccess("¡Cuenta de residente creada con éxito! Ingresando a tu portal...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      setResidentError(err.message);
    } finally {
      setResidentLoading(false);
    }
  };

  const checkAdminEmail = async (emailToCheck: string) => {
    const trimmed = emailToCheck.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/check-email?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.exists) {
        setEmailStatus("exists");
      } else {
        setEmailStatus("available");
      }
    } catch {
      setEmailStatus("idle");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Credenciales inválidas");
      }
      setAuthToken(data.tokens.accessToken);
      setCurrentUser(data.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCreateCondo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCondoLoading(true);
    setCondoError(null);
    setCondoSuccess(null);

    const email = adminEmail.trim().toLowerCase();
    if (!email) {
      setCondoError("Debe indicar el correo electrónico del administrador principal");
      setCondoLoading(false);
      return;
    }

    try {
      // 1. Si el correo ya existe, iniciar sesión y crear el condominio atado a su usuario
      if (emailStatus === "exists") {
        if (!existingPassword) {
          throw new Error("Debe ingresar la contraseña de su cuenta para iniciar sesión y vincular el nuevo condominio.");
        }

        const loginRes = await fetch(`${getApiBaseUrl()}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: existingPassword }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(loginData.message || "Contraseña incorrecta al autenticar su cuenta registrada.");
        }

        setAuthToken(loginData.tokens.accessToken);
        setCurrentUser(loginData.user);

        // Crear el condominio autenticado dentro del dashboard/tenant
        const condoRes = await fetch(`${getApiBaseUrl()}/condominiums`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginData.tokens.accessToken}`,
          },
          body: JSON.stringify({
            code: condoCode.toUpperCase().trim(),
            name: condoName.trim(),
            type: condoType,
            address: condoAddress.trim(),
            baseCurrency: condoCurrency,
          }),
        });
        const condoData = await condoRes.json();
        if (!condoRes.ok) {
          throw new Error(condoData.message || "Error al crear el condominio con la sesión iniciada.");
        }

        setCondoSuccess(`¡Sesión iniciada con éxito! El condominio '${condoData.name}' ha sido creado y vinculado automáticamente a su correo.`);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
        return;
      }

      // 2. Si el correo NO existe, crear usuario nuevo con sus credenciales y el condominio
      if (!adminFullName.trim()) {
        throw new Error("Debe indicar el nombre completo del administrador principal.");
      }
      if (!adminPassword || adminPassword.length < 8) {
        throw new Error("La contraseña del usuario debe tener al menos 8 caracteres.");
      }

      const registerRes = await fetch(`${getApiBaseUrl()}/auth/register-condominium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: email,
          adminPassword,
          adminFullName: adminFullName.trim(),
          adminPhone: adminPhone.trim() || undefined,
          condoName: condoName.trim(),
          condoCode: condoCode.toUpperCase().trim(),
          condoType,
          condoAddress: condoAddress.trim(),
          baseCurrency: condoCurrency,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.message || "Error al registrar el condominio y el usuario administrador.");
      }

      setAuthToken(registerData.tokens.accessToken);
      setCurrentUser(registerData.user);

      setCondoSuccess(`¡Usuario administrador creado y condominio '${registerData.condominium.name}' registrado exitosamente!`);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      setCondoError(err.message);
    } finally {
      setCondoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-sky-500/30 selection:text-sky-300">
      {/* Background Decorative Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[140px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SGC ResidManager
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  SaaS v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Gestión Integral &bull; Multi-Tenant SPT
              </p>
            </div>
          </Link>

          {/* Quick Menu Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#caracteristicas" className="hover:text-white transition">Características</a>
            <a href="#modulos" className="hover:text-white transition">Módulos</a>
            <a href="#seguridad" className="hover:text-white transition">Seguridad RLS</a>
            <a
              href="http://localhost:3001/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-sky-400 transition flex items-center gap-1 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              API Docs (Scalar)
            </a>
          </nav>

          {/* Primary Action Buttons: RESIDENTE, LOGIN & CREAR CONDOMINIO */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowResidentRegisterModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Soy Residente</span>
            </button>

            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-sky-400" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              onClick={() => setShowCreateCondoModal(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition transform active:scale-95 cursor-pointer"
            >
              <Building className="w-4 h-4" />
              <span>Crear Condominio</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-sky-400 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Plataforma Especializada para Administradoras y Juntas de Condominio
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Control total de tus residencias,{" "}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            en cualquier moneda y escala.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Desde complejos de torres verticales hasta urbanizaciones cerradas de casas. Automatiza alícuotas, cobranza en USD y moneda local, áreas comunes, estacionamientos y portal de residentes en una arquitectura multi-tenant ultrasegura.
        </p>

        {/* Hero CTAs */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setShowResidentRegisterModal(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <User className="w-5 h-5" />
            Registrarme como Residente / Propietario
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => setShowCreateCondoModal(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <Building className="w-5 h-5" />
            Crear mi Primer Condominio
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-bold text-base transition shadow-md"
          >
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            Explorar Panel
          </Link>
        </div>

        {/* Technical Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL 16 con RLS Activo
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> NestJS 10 + Fastify Core
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Next.js 15 App Router
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Contenedorizado en Docker
          </span>
        </div>
      </section>

      {/* SOFTWARE HIGHLIGHTS / PROMOTIONAL METRICS */}
      <section className="relative z-10 border-y border-slate-800 bg-slate-950/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-sky-400">100%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Aislamiento de Datos</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Row-Level Security por Tenant</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-indigo-400">Dual</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Edificios y Casas</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pisos, torres, bloques y etapas</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">USD + VES</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Motor Multimoneda</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Conversión y recargos de mora</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400">&lt; 1 min</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Importador CSV</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Carga masiva de 500+ unidades</p>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES / MODULES */}
      <section id="modulos" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400">Capacidades del Sistema</h2>
          <p className="text-3xl sm:text-4xl font-black text-white">
            Diseñado para cubrir cada detalle de tu administración
          </p>
          <p className="text-sm text-slate-400">
            Una solución integral con arquitectura monolítica modular donde cada dominio opera de forma independiente y segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Estructuras y Propiedades */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 p-8 rounded-3xl border border-slate-700/70 transition shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Estructura Física & Propiedades</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modela cualquier distribución: edificios por pisos y apartamentos, o urbanizaciones por etapas y casas. Asigna alícuotas, metros cuadrados y códigos únicos.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Nomenclatura flexible por residencia
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Importador CSV con validación fila por fila
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Bloqueo seguro de borrado con unidades activas
              </li>
            </ul>
          </div>

          {/* Card 2: Áreas Comunes & Estacionamientos */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 p-8 rounded-3xl border border-slate-700/70 transition shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TreePine className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Áreas Comunes & Puestos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catálogo de instalaciones como piscinas, gimnasios, salones de fiesta y canchas con control de aforo. Asignación de puestos de estacionamiento a residentes o visitantes.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Aforos máximos configurables
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Puestos para residentes con unidad enlazada
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Gestión de puestos para visitantes
              </li>
            </ul>
          </div>

          {/* Card 3: Multimoneda y Cobranza */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 p-8 rounded-3xl border border-slate-700/70 transition shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Motor de Cobranza & Monedas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Adaptado a la economía real. Define moneda base y extranjera, cálculo automático de alícuotas, cuotas ordinarias y extraordinarias, mora fija o porcentual y abonos parciales.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Pagos parciales habilitables
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Tasa impositiva (IVA/impuestos) integrada
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Recargo configurable por días de mora
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* LIVE CTA CARD */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/40 to-slate-900 rounded-3xl p-8 sm:p-12 border border-sky-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Listo para comenzar a gestionar tu condominio?
            </h3>
            <p className="text-sm text-slate-300 max-w-lg">
              Crea tu complejo en menos de dos minutos o accede con las credenciales demo de SuperAdmin para probar el entorno completo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateCondoModal(true)}
              className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition text-center"
            >
              Crear Condominio
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition text-center"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
            <Building2 className="w-4 h-4 text-sky-400" /> SGC ResidManager &bull; Sistema Integral de Gestión de Condominios
          </div>
          <p>
            Construido con NestJS Fastify, PostgreSQL 16 RLS, Next.js 15 App Router y Turborepo.
          </p>
        </div>
      </footer>

      {/* ================= MODAL: INICIAR SESIÓN ================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Iniciar Sesión</h3>
                  <p className="text-xs text-slate-400">Acceso a la plataforma SGC con tus credenciales</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="ej: admin@sgc.app o tu correo registrado"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Ingresa tu contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </div>

              {/* Demo Quick Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail("admin@sgc.app");
                    setLoginPassword("Admin1234*!");
                  }}
                  className="text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  Cargar cuenta Demo SuperAdmin
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowCreateCondoModal(true);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  ¿Crear condominio nuevo?
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR CONDOMINIO ================= */}
      {showCreateCondoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Crear Nuevo Condominio</h3>
                  <p className="text-xs text-slate-400">Sujeto a un Administrador Principal por su correo</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateCondoModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {condoError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {condoError}
              </div>
            )}

            {condoSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {condoSuccess} Redirigiendo al panel...
              </div>
            )}

            <form onSubmit={handleCreateCondo} className="space-y-4 text-xs">
              {/* SECCIÓN 1: ADMINISTRADOR PRINCIPAL POR CORREO */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" /> Administrador Principal
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sujeto a este correo
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Correo del Administrador Principal
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="ej: admin@micondominio.com"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (emailStatus !== "idle") setEmailStatus("idle");
                      }}
                      onBlur={() => checkAdminEmail(adminEmail)}
                      className="w-full pl-9 pr-24 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    
                    <div className="absolute right-2 top-2">
                      {emailStatus === "checking" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 text-[10px] text-slate-300">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verificando
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => checkAdminEmail(adminEmail)}
                          className="px-2 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 hover:text-white"
                        >
                          Verificar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CASO A: SI YA EXISTE EL CORREO */}
                {emailStatus === "exists" && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300 text-xs">
                          El correo ya está registrado en el sistema.
                        </p>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                          Inicia sesión con tu contraseña para que el nuevo condominio se cree y se vincule automáticamente a tu cuenta y administradora.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="block font-semibold text-amber-200 text-[11px] mb-1">
                        Contraseña de tu cuenta existente
                      </label>
                      <div className="relative">
                        <input
                          type={showExistingPassword ? "text" : "password"}
                          required
                          placeholder="Ingresa tu contraseña para vincular"
                          value={existingPassword}
                          onChange={(e) => setExistingPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                        <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-2.5 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowExistingPassword(!showExistingPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        >
                          {showExistingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail(adminEmail);
                          setShowCreateCondoModal(false);
                          setShowLoginModal(true);
                        }}
                        className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
                      >
                        O abrir formulario de inicio de sesión normal
                      </button>
                    </div>
                  </div>
                )}

                {/* CASO B: SI EL CORREO NO EXISTE -> SOLICITA DATOS DE CREACIÓN DE USUARIO */}
                {emailStatus === "available" && (
                  <div className="space-y-3 pt-1 border-t border-slate-800 animate-in fade-in">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Correo disponible. Completa los datos para crear tu usuario administrador:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Nombre y Apellido</label>
                        <input
                          type="text"
                          required
                          placeholder="ej: Carlos Pérez"
                          value={adminFullName}
                          onChange={(e) => setAdminFullName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Teléfono (opcional)</label>
                        <input
                          type="tel"
                          placeholder="ej: +58 412 1234567"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Contraseña de Acceso (mínimo 8 caracteres)
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          required
                          minLength={8}
                          placeholder="Crea una contraseña segura"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: DATOS DEL CONDOMINIO */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Código Único del Condominio</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: RES-AVILA, URB-SOL"
                      value={condoCode}
                      onChange={(e) => setCondoCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Moneda Base</label>
                    <select
                      value={condoCurrency}
                      onChange={(e) => setCondoCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="USD">USD ($) Dólares</option>
                      <option value="VES">VES (Bs) Bolívares</option>
                      <option value="EUR">EUR (€) Euros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre del Condominio</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Residencias Parque Ávila"
                    value={condoName}
                    onChange={(e) => setCondoName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Complejo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCondoType("buildings")}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                        condoType === "buildings"
                          ? "bg-sky-500/10 border-sky-500 text-sky-400"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <Building2 className="w-4 h-4" /> Edificios / Torres
                      </span>
                      <span className="text-[10px] opacity-80">Pisos y apartamentos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCondoType("houses")}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                        condoType === "houses"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <Home className="w-4 h-4" /> Casas / Urbanización
                      </span>
                      <span className="text-[10px] opacity-80">Bloques, etapas y casas</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dirección Completa</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Av. Principal Los Palos Grandes, Sector 2"
                    value={condoAddress}
                    onChange={(e) => setCondoAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCondoModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={condoLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {condoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : emailStatus === "exists" ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión y Crear Condominio</span>
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4" />
                      <span>Crear Administrador y Condominio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE REGISTRO DIRECTO DE RESIDENTE / PROPIETARIO ================= */}
      {showResidentRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Registro de Residente / Propietario</h3>
                  <p className="text-xs text-slate-400">Sin crear condominio &bull; Accede a tu portal personal</p>
                </div>
              </div>
              <button
                onClick={() => setShowResidentRegisterModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                &times;
              </button>
            </div>

            {residentSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{residentSuccess}</span>
              </div>
            )}

            {residentError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{residentError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterResident} className="mt-5 space-y-4 text-xs">
              {/* DATOS PERSONALES */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                  1. Datos de Identidad
                </h4>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: María Carolina Pérez Rodríguez"
                    value={residentFullName}
                    onChange={(e) => setResidentFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tipo Doc. *</label>
                    <select
                      value={residentDocumentType}
                      onChange={(e) => setResidentDocumentType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="V">V - Venezolano</option>
                      <option value="E">E - Extranjero</option>
                      <option value="J">J - Jurídico</option>
                      <option value="P">P - Pasaporte</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1">Número de Identidad / Cédula *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: 18456789"
                      value={residentDocumentNumber}
                      onChange={(e) => setResidentDocumentNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="residente@gmail.com"
                      value={residentEmail}
                      onChange={(e) => setResidentEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Teléfono Móvil (WhatsApp)</label>
                    <input
                      type="tel"
                      placeholder="+58 412 1234567"
                      value={residentPhone}
                      onChange={(e) => setResidentPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* CONTRASEÑA */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  2. Credenciales de Acceso
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Contraseña (Mín. 8 caracteres) *</label>
                    <div className="relative">
                      <input
                        type={showResidentPassword ? "text" : "password"}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={residentPassword}
                        onChange={(e) => setResidentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResidentPassword(!showResidentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showResidentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Confirmar Contraseña *</label>
                    <input
                      type={showResidentPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={residentConfirmPassword}
                      onChange={(e) => setResidentConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* VINCULACIÓN OPCIONAL */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" />
                    3. Vincular Inmueble (Opcional)
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    Puedes hacerlo después
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Buscar Condominio o Residencia
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Escribe el nombre o dirección del condominio..."
                      value={residentSearchCondoQuery}
                      onChange={(e) => handleSearchResidentCondo(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    {isSearchingResidentCondo && (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3 top-3" />
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {residentCondoResults.length > 0 && !selectedResidentCondo && (
                    <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-700/60 shadow-lg">
                      {residentCondoResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedResidentCondo(c);
                            setResidentCondoResults([]);
                            setResidentSearchCondoQuery(c.name);
                          }}
                          className="w-full text-left p-2.5 hover:bg-slate-700/60 transition flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-bold text-white text-xs">{c.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{c.address || "Sin dirección"}</p>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                            {c.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedResidentCondo && (
                    <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-white text-xs">{selectedResidentCondo.name}</p>
                          <p className="text-[10px] text-slate-400">{selectedResidentCondo.address}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResidentCondo(null);
                          setResidentSearchCondoQuery("");
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>

                {selectedResidentCondo && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Código de tu Apartamento / Inmueble
                    </label>
                    <input
                      type="text"
                      placeholder="ej: 4-A, PH-1, Casa 12"
                      value={residentUnitCode}
                      onChange={(e) => setResidentUnitCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Al completar el registro, se enviará automáticamente una solicitud de vinculación a la junta de este condominio.
                    </p>
                  </div>
                )}
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowResidentRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition"
                >
                  ¿Ya tienes cuenta? Iniciar Sesión
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResidentRegisterModal(false)}
                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={residentLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
                  >
                    {residentLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creando cuenta...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Crear Cuenta de Residente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
