import React, { useState } from 'react';
import { 
  Lock, User, Eye, EyeOff, ShieldCheck, School as SchoolIcon, 
  Sparkles, CheckCircle2, ArrowRight, AlertCircle, KeyRound, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { UserRole } from '../../types/database';

import { OnboardingWizardModule } from './OnboardingWizardModule';

export const LoginModule: React.FC = () => {
  const { login } = useAuth();
  const { currentSchool, schools, setCurrentSchool } = useTenant();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    { role: 'directeur' as UserRole, label: 'Directeur Général', email: 'directeur@saintviateur.ci', pass: 'admin123', icon: '👨‍💼', desc: 'Gestion complète établissement' },
    { role: 'super_admin' as UserRole, label: 'Super Admin SaaS', email: 'superadmin@ivoireecole.ci', pass: 'super123', icon: '⚡', desc: 'Gestion multi-écoles centralisée' },
    { role: 'enseignant' as UserRole, label: 'Enseignant', email: 'y.kouadio@saintviateur.ci', pass: 'prof123', icon: '👨‍🏫', desc: 'Saisie notes & appels' },
    { role: 'parent' as UserRole, label: 'Parent d\'Élève', email: 'parent@saintviateur.ci', pass: 'parent123', icon: '👨‍👩‍👧', desc: 'Paiements & suivi enfant' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Identifiants incorrects. Veuillez réessayer.');
      }
    } catch {
      setErrorMsg('Erreur lors de la connexion. Veuillez contacter l\'administration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (account: typeof demoAccounts[0]) => {
    setUsername(account.email);
    setPassword(account.pass);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(account.email, account.pass);
    } finally {
      setIsLoading(false);
    }
  };

  if (showOnboarding) {
    return <OnboardingWizardModule onComplete={() => setShowOnboarding(false)} onCancel={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl z-10">
        
        {/* Left Side: SaaS Branding & Info */}
        <div className="bg-gradient-to-br from-brand-900/90 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 p-0.5 shadow-lg shadow-brand-500/30 flex items-center justify-center">
                <img 
                  src={currentSchool.logo_url || '/images/logoecole.png'} 
                  alt="Logo Établissement"
                  className="w-full h-full object-contain bg-slate-900 rounded-xl p-1" 
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1">
                  IvoireÉcole<span className="text-ivory-orange">+</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Plateforme SaaS de Gestion Scolaire
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-brand-400">
                  <Building2 className="w-4 h-4" />
                  <span>Établissement Sélectionné</span>
                </div>
                <div className="text-sm font-extrabold text-white">{currentSchool.name}</div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Code MENA: <span className="font-mono text-brand-300 font-bold">{currentSchool.registration_number}</span></span>
                  <span>{currentSchool.city}</span>
                </div>
              </div>

              {/* CTA Créer mon établissement */}
              <div className="bg-gradient-to-r from-brand-950 to-indigo-950 p-4 rounded-2xl border border-brand-500/30 space-y-2">
                <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Nouveau Responsable d'École ?</span>
                </div>
                <p className="text-[11px] text-slate-300">Lancez l’activation SaaS complète de votre établissement en 5 étapes simples.</p>
                <button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Créer Mon Établissement</span>
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Accès Sécurisé par Identifiant Unique</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Isolation des Données & Espace Sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Conforme aux normes MENA & RGPD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Version SaaS v2.5 Multi-Tenants</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Serveur Sécurisé Active
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-500" />
              <span>Connexion Sécurisée</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Saisissez votre nom d'utilisateur / e-mail et votre mot de passe pour accéder à votre espace.</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* School Selector Dropdown on Login */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Établissement / École Client</label>
              <select
                value={currentSchool.id}
                onChange={(e) => {
                  const selected = schools.find(s => s.id === e.target.value);
                  if (selected) setCurrentSchool(selected);
                }}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-bold focus:border-brand-500 outline-none"
              >
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Username / Email Field */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Identifiant Unique / E-mail *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="nom.utilisateur@ecole.ci ou e-mail"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-brand-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Mot de Passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-brand-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-0"
                />
                <span className="text-slate-400 text-xs">Rester connecté</span>
              </label>

              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Pour réinitialiser votre mot de passe, veuillez contacter l'administrateur de votre établissement."); }} className="text-xs text-brand-400 hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se Connecter à la Plateforme</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Connexion Rapide Démo (1-Clic) :</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-brand-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="font-bold text-slate-200 group-hover:text-brand-300 flex items-center gap-1">
                    <span>{acc.icon}</span>
                    <span>{acc.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
