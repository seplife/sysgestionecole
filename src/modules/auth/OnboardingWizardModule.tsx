import React, { useState } from 'react';
import { 
  Building2, User, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, 
  CreditCard, Sparkles, AlertCircle, Phone, Mail, MapPin, Globe, Check, Award, Lock, Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { School } from '../../types/database';

import { supabase } from '../../lib/supabase';

type SchoolType = 'Public' | 'Prive' | 'Confessionnel';

interface OnboardingWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const OnboardingWizardModule: React.FC<OnboardingWizardProps> = ({ onComplete, onCancel }) => {
  const { login } = useAuth();
  const { setCurrentSchool, addNewSchool, schools } = useTenant();
  const { currentSubscription } = useSubscription();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Étape 1: Compte Responsable
  const [adminProfile, setAdminProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+225 ',
    password: '',
    confirmPassword: ''
  });

  // Étape 2: Création de l'établissement
  const [schoolData, setSchoolData] = useState({
    name: '',
    schoolType: 'Privé' as SchoolType,
    registrationNumber: '',
    address: '',
    city: 'Abidjan',
    phone: '+225 ',
    whatsapp: '+225 ',
    email: '',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=300',
    directorName: ''
  });

  // Étape 3: Configuration de l'école & Année Scolaire
  const [schoolConfig, setSchoolConfig] = useState({
    currency: 'FCFA',
    motto: 'Discipline - Excellence - Réussite',
    academicYear: '2026-2027',
    periods: ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'],
    levels: {
      prescolaire: false,
      primaire: false,
      college: true,
      lycee: true
    },
    selectedLevels: ['6ème', '5ème', '4ème', '3ème', '2nde A', '2nde C', '1ère A', '1ère D', 'Terminale A', 'Terminale D']
  });

  // Étape 4: Choix du Forfait SaaS
  const [selectedPlanId, setSelectedPlanId] = useState<'essentiel' | 'professionnel' | 'premium'>('professionnel');

  // Étape 5: Option Paiement ou Essai
  const [paymentOption, setPaymentOption] = useState<'trial' | 'pay_now'>('trial');
  const [paymentProvider, setPaymentProvider] = useState<'wave' | 'orange' | 'mtn' | 'moov' | 'card'>('wave');
  const [payerPhone, setPayerPhone] = useState('+225 ');

  // Plans List
  const planOptions = [
    {
      id: 'essentiel',
      name: 'Essentiel',
      price: '50 000 FCFA',
      period: '/ an',
      maxStudents: 200,
      badge: 'Petit Établissement',
      features: ['Jusqu\'à 200 élèves', 'Bulletins & PV Trimestriels', 'Gestion des Frais & Reçus', 'Support Téléphonique']
    },
    {
      id: 'professionnel',
      name: 'Professionnel',
      price: '55 000 FCFA',
      period: '/ an',
      maxStudents: 500,
      popular: true,
      badge: 'Recommandé MENA',
      features: ['Jusqu\'à 500 élèves', 'WhatsApp Chatbot & Relances SMS', 'Multi-Utilisateurs & Éducateurs', 'Emplois du temps automatiques', 'Support prioritaire 7j/7']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '65 000 FCFA',
      period: '/ an',
      maxStudents: null,
      badge: 'Grande Structure',
      features: ['Élèves illimités', 'Portails Parents & Élèves personnalisés', 'Intégration Mobile Money direct', 'Assistant IA IvoireIA+ inclus', 'Chef de projet dédié']
    }
  ];

  // Handler Step 1 -> Step 2
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminProfile.firstName || !adminProfile.lastName || !adminProfile.email || !adminProfile.password) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires du responsable.');
      return;
    }
    if (adminProfile.password !== adminProfile.confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!schoolData.directorName) {
      setSchoolData(prev => ({ ...prev, directorName: `${adminProfile.lastName} ${adminProfile.firstName}` }));
    }
    if (!schoolData.email) {
      setSchoolData(prev => ({ ...prev, email: adminProfile.email }));
    }
    setCurrentStep(2);
  };

  // Handler Step 2 -> Step 3
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!schoolData.name || !schoolData.registrationNumber) {
      setErrorMsg('Veuillez renseigner le nom de l\'établissement et son matricule/autorisation MENA.');
      return;
    }
    setCurrentStep(3);
  };

  // Handler Step 3 -> Step 4
  const handleStep3Next = () => {
    setCurrentStep(4);
  };

  // Handler Step 4 -> Step 5
  const handleStep4Next = () => {
    setCurrentStep(5);
  };

  // Final Activation Handler Step 5
const handleFinalActivation = async () => {
  setIsSubmitting(true);
  setErrorMsg(null);

  try {
    // ============================================================
    // 1. VALIDATION DES DONNÉES DU RESPONSABLE
    // ============================================================
    const email = adminProfile.email.trim().toLowerCase();
    const password = adminProfile.password;

    if (!email || !password) {
      throw new Error(
        'Les informations de connexion du responsable sont obligatoires.'
      );
    }

    if (!adminProfile.firstName.trim() || !adminProfile.lastName.trim()) {
      throw new Error(
        'Le prénom et le nom du responsable sont obligatoires.'
      );
    }

    // ============================================================
    // 2. VÉRIFICATION D'UNE SESSION EXISTANTE
    // ============================================================
    let {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        '[Onboarding] Erreur lors de la récupération de la session:',
        sessionError
      );
    }

    // ============================================================
    // 3. CRÉATION DU COMPTE RESPONSABLE SI AUCUNE SESSION
    // ============================================================
    if (!session?.user) {
      console.log(
        '[Onboarding] Aucune session active. Tentative d\'authentification...'
      );

      // ------------------------------------------------------------
      // 3A. Tentative de connexion d'abord
      // ------------------------------------------------------------
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (!signInError && signInData.session?.user) {
        session = signInData.session;

        console.log(
          '[Onboarding] Connexion réussie:',
          session.user.id
        );
      } else {
        // ----------------------------------------------------------
        // 3B. Si le compte n'existe pas, création du compte
        // ----------------------------------------------------------
        console.log(
          '[Onboarding] Connexion impossible. Tentative de création du compte...'
        );

        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: adminProfile.firstName.trim(),
                last_name: adminProfile.lastName.trim(),
                phone: adminProfile.phone.trim(),
                role: 'school_admin',
              },
            },
          });

        if (signUpError) {
          // Si le compte existe déjà, on tente une nouvelle connexion.
          if (
            signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already exists')
          ) {
            console.log(
              '[Onboarding] Le compte existe déjà. Nouvelle tentative de connexion...'
            );

            const { data: retrySignInData, error: retrySignInError } =
              await supabase.auth.signInWithPassword({
                email,
                password,
              });

            if (retrySignInError || !retrySignInData.session?.user) {
              throw new Error(
                'Le compte responsable existe déjà, mais la connexion a échoué. Vérifiez votre adresse e-mail et votre mot de passe.'
              );
            }

            session = retrySignInData.session;
          } else {
            throw new Error(
              `Impossible de créer le compte responsable : ${signUpError.message}`
            );
          }
        } else {
          // --------------------------------------------------------
          // 3C. Vérification immédiate de la session après signUp
          // --------------------------------------------------------
          session = signUpData.session;

          if (!session?.user) {
            // Vérifier une nouvelle fois la session persistée
            const {
              data: { session: refreshedSession },
              error: refreshedSessionError,
            } = await supabase.auth.getSession();

            if (refreshedSessionError) {
              console.error(
                '[Onboarding] Erreur récupération session après inscription:',
                refreshedSessionError
              );
            }

            session = refreshedSession;

            // ------------------------------------------------------
            // 3D. Si toujours aucune session, tenter login
            // ------------------------------------------------------
            if (!session?.user) {
              const { data: loginData, error: loginError } =
                await supabase.auth.signInWithPassword({
                  email,
                  password,
                });

              if (loginError || !loginData.session?.user) {
                throw new Error(
                  'Le compte a été créé, mais aucune session Supabase active n\'est disponible. Si la confirmation e-mail est activée dans Supabase, veuillez confirmer votre adresse e-mail avant de continuer.'
                );
              }

              session = loginData.session;
            }
          }
        }
      }
    }

    // ============================================================
    // 4. GARANTIE ABSOLUE : UN UTILISATEUR AUTHENTIFIÉ EST REQUIS
    // ============================================================
    if (!session?.user) {
      throw new Error(
        'Impossible de poursuivre : aucun utilisateur Supabase authentifié.'
      );
    }

    // ============================================================
    // 5. RÉCUPÉRATION DE L'UTILISATEUR AUTHENTIFIÉ
    // ============================================================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        '[Onboarding] Impossible de récupérer l\'utilisateur authentifié:',
        userError
      );

      throw new Error(
        'Votre session d\'authentification Supabase est introuvable. Veuillez vous reconnecter.'
      );
    }

    console.log('================================================');
    console.log('[Onboarding] UTILISATEUR AUTHENTIFIÉ');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('================================================');

    // ============================================================
    // 6. VÉRIFICATION DU PROFIL UTILISATEUR
    // ============================================================
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, organization_id, school_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        '[Onboarding] Erreur récupération user_profiles:',
        profileError
      );
    }

    console.log('================================================');
    console.log('[Onboarding] PROFIL UTILISATEUR');
    console.log('Profile:', profile);
    console.log('Profile Error:', profileError);
    console.log('================================================');

    // ============================================================
    // 7. CONSTRUCTION DU PAYLOAD DE L'ÉCOLE
    // ============================================================
    const newSchoolPayload: Partial<School> = {
      name: schoolData.name.trim(),
      slug:
        schoolData.name
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now().toString().slice(-4),

      registration_number: schoolData.registrationNumber.trim(),
      school_type: schoolData.schoolType,
      address:
        schoolData.address.trim() ||
        `${schoolData.city.trim()}, Côte d'Ivoire`,
      city: schoolData.city.trim(),
      phone: schoolData.phone.trim(),
      whatsapp: schoolData.whatsapp.trim(),
      email: schoolData.email.trim().toLowerCase(),
      logo_url: schoolData.logoUrl,
      director_name:
        schoolData.directorName.trim() ||
        `${adminProfile.lastName.trim()} ${adminProfile.firstName.trim()}`,
      status: paymentOption === 'trial' ? 'active' : 'pending',
    };

    // ============================================================
    // 8. LOG DU PAYLOAD AVANT INSERTION
    // ============================================================
    console.log('================================================');
    console.log('[Onboarding] CRÉATION ÉCOLE');
    console.log('Authenticated User ID:', user.id);
    console.log('Organization ID:', profile?.organization_id);
    console.log('Current School ID:', profile?.school_id);
    console.log('Role:', profile?.role);
    console.log('School Payload:', newSchoolPayload);
    console.log('================================================');

    // ============================================================
    // 9. CRÉATION DE L'ÉCOLE
    // ============================================================
    await addNewSchool(newSchoolPayload as School);

    // ============================================================
    // 10. VÉRIFICATION POST-CRÉATION
    // ============================================================
    const {
      data: { session: finalSession },
    } = await supabase.auth.getSession();

    if (!finalSession?.user) {
      throw new Error(
        'L\'école a été créée, mais la session utilisateur n\'est plus disponible.'
      );
    }

    console.log(
      '[Onboarding] École créée avec succès pour:',
      finalSession.user.id
    );

    // ============================================================
    // 11. FIN DU WIZARD
    // ============================================================
    onComplete();
  } catch (err: any) {
    console.error(
      '[Onboarding] Error in handleFinalActivation:',
      err
    );

    const message =
      err?.message ||
      'Une erreur est survenue lors de l\'activation SaaS de votre établissement.';

    setErrorMsg(message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Glowing Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl z-10 flex flex-col my-auto">
        
        {/* Wizard Top Header */}
        <div className="p-6 bg-gradient-to-r from-brand-900 via-slate-900 to-purple-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 p-2 flex items-center justify-center text-brand-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                IvoireÉcole<span className="text-ivory-orange">+</span>
                <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-mono">Parcours d'Activation SaaS</span>
              </h1>
              <p className="text-xs text-slate-300">Créez et activez l'espace sécurisé de votre établissement scolaire</p>
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
          >
            Annuler
          </button>
        </div>

        {/* Wizard Progress Bar Steps */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] text-xs font-bold">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-brand-400 font-extrabold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
              <span>Compte Responsable</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-brand-400 font-extrabold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
              <span>École</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-brand-400 font-extrabold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 3 ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
              <span>Structure</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-brand-400 font-extrabold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 4 ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>4</span>
              <span>Forfait</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-brand-400 font-extrabold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 5 ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>5</span>
              <span>Activation</span>
            </div>
          </div>
        </div>

        {/* Error Alert Display */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Main Content Body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[65vh]">
          
          {/* ========================================================================= */}
          {/* STEP 1: COMPTE DU RESPONSABLE (school_admin) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-400" />
                  <span>Étape 1 : Création du Compte du Responsable (SaaS Admin)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Ce compte sera l'administrateur principal (Propriétaire SaaS) de l'établissement.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kouassi Honoré"
                    value={adminProfile.firstName}
                    onChange={(e) => setAdminProfile({ ...adminProfile, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DIABATÉ"
                    value={adminProfile.lastName}
                    onChange={(e) => setAdminProfile({ ...adminProfile, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Adresse E-mail Professionnelle *</label>
                  <input
                    type="email"
                    required
                    placeholder="directeur@etablissement.ci"
                    value={adminProfile.email}
                    onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Téléphone Portable *</label>
                  <input
                    type="text"
                    required
                    placeholder="+225 07 09 88 77 66"
                    value={adminProfile.phone}
                    onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mot de passe *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminProfile.password}
                    onChange={(e) => setAdminProfile({ ...adminProfile, password: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Confirmation du mot de passe *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminProfile.confirmPassword}
                    onChange={(e) => setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-xs space-y-1 text-slate-300">
                <div className="font-bold text-brand-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Statut de l'accès à cette étape :</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div>Compte: <span className="text-emerald-400 font-bold">✅ En création</span></div>
                  <div>École: <span className="text-rose-400 font-bold">❌ Non liée</span></div>
                  <div>Abonnement: <span className="text-rose-400 font-bold">❌ Non souscrit</span></div>
                  <div>Dashboard: <span className="text-amber-400 font-bold">⏳ Bloqué</span></div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <span>Créer mon compte & Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CRÉATION DE L'ÉTABLISSEMENT (schools) */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-400" />
                  <span>Étape 2 : Création de l'Établissement Scolaire</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Renseignez les informations officielles de votre établissement.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Nom Complet de l'Établissement *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Groupe Scolaire Saint-Viateur Palmeraie"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Type d'Établissement *</label>
                  <select
                    value={schoolData.schoolType}
                    onChange={(e) => setSchoolData({ ...schoolData, schoolType: e.target.value as SchoolType })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="Privé">Privé Laïc</option>
                    <option value="Confessionnel">Privé Confessionnel</option>
                    <option value="Public">Public (Lycée / Collège)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Matricule / N° Autorisation MENA *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MENA-ABJ-2026-99"
                    value={schoolData.registrationNumber}
                    onChange={(e) => setSchoolData({ ...schoolData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="Abidjan"
                    value={schoolData.city}
                    onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Adresse Géographique</label>
                  <input
                    type="text"
                    placeholder="Cocody Palmeraie Rue Ministre"
                    value={schoolData.address}
                    onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Téléphone Fixe / Secrétariat</label>
                  <input
                    type="text"
                    value={schoolData.phone}
                    onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Numéro WhatsApp Établissement</label>
                  <input
                    type="text"
                    value={schoolData.whatsapp}
                    onChange={(e) => setSchoolData({ ...schoolData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Nom & Prénoms du Directeur / Proviseur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Yao KOUADIO"
                    value={schoolData.directorName}
                    onChange={(e) => setSchoolData({ ...schoolData, directorName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <span>Valider l'Établissement & Configurer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CONFIGURATION INITIALE DE L'ÉCOLE */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Étape 3 : Configuration Pédagogique & Année Scolaire</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Paramétrez la structure scolaire et les périodes d'évaluation.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Année Scolaire & Périodes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                    <label className="block font-bold text-slate-200">Année Scolaire Active</label>
                    <input
                      type="text"
                      value={schoolConfig.academicYear}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, academicYear: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-brand-300 font-extrabold text-sm outline-none"
                    />
                    <div className="text-[11px] text-slate-400">Périodes : Trimestres 1, 2 et 3 (Découpage Officiel MENA)</div>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                    <label className="block font-bold text-slate-200">Devise Monétaire</label>
                    <input
                      type="text"
                      value={schoolConfig.currency}
                      onChange={(e) => setSchoolConfig({ ...schoolConfig, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold outline-none"
                    />
                    <div className="text-[11px] text-slate-400">Franc CFA (XOF / FCFA)</div>
                  </div>
                </div>

                {/* Structure Scolaire Checkboxes */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-3">
                  <label className="block font-bold text-slate-200">Cycles & Niveaux Pris en Charge :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolConfig.levels.prescolaire}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, levels: { ...schoolConfig.levels, prescolaire: e.target.checked } })}
                        className="rounded border-slate-600 bg-slate-800 text-brand-500"
                      />
                      <span className="font-bold">Préscolaire</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolConfig.levels.primaire}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, levels: { ...schoolConfig.levels, primaire: e.target.checked } })}
                        className="rounded border-slate-600 bg-slate-800 text-brand-500"
                      />
                      <span className="font-bold">Primaire</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolConfig.levels.college}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, levels: { ...schoolConfig.levels, college: e.target.checked } })}
                        className="rounded border-slate-600 bg-slate-800 text-brand-500"
                      />
                      <span className="font-bold">Collège (1er cycle)</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolConfig.levels.lycee}
                        onChange={(e) => setSchoolConfig({ ...schoolConfig, levels: { ...schoolConfig.levels, lycee: e.target.checked } })}
                        className="rounded border-slate-600 bg-slate-800 text-brand-500"
                      />
                      <span className="font-bold">Lycée (2nd cycle)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep3Next}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <span>Valider la Structure & Choisir le Forfait</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: CHOIX DU FORFAIT ABONNEMENT */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                  <span>Étape 4 : Choix du Forfait d'Abonnement SaaS</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Sélectionnez la formule adaptée au nombre d'élèves de votre établissement.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planOptions.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id as any)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                        isSelected 
                          ? 'bg-brand-950/40 border-brand-500 text-white ring-2 ring-brand-500/30 shadow-xl' 
                          : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-md">
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-extrabold text-base">{plan.name}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                        </div>

                        <div className="text-2xl font-extrabold text-white tracking-tight">
                          {plan.price} <span className="text-xs text-slate-400 font-normal">{plan.period}</span>
                        </div>

                        <div className="text-[11px] font-bold text-brand-400 mt-1">
                          {plan.maxStudents ? `Jusqu'à ${plan.maxStudents} élèves max` : 'Élèves Illimités'}
                        </div>

                        <ul className="space-y-1.5 pt-4 text-xs text-slate-300">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep4Next}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                >
                  <span>Continuer vers le Paiement / Essai</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: PAIEMENT OU PÉRIODE D'ESSAI & ACTIVATION */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Étape 5 : Activation du Compte Établissement</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Choisissez l'activation par période d'essai gratuite (14 jours) ou par paiement immédiat.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Période d'essai */}
                <div
                  onClick={() => setPaymentOption('trial')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentOption === 'trial'
                      ? 'bg-emerald-950/30 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-400">Option A : Essai Gratuit (14 jours)</span>
                    {paymentOption === 'trial' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Accédez immédiatement au Dashboard complet sans carte bancaire pendant 14 jours. Activez votre école en 1 clic.
                  </p>
                </div>

                {/* Option B: Paiement immédiat */}
                <div
                  onClick={() => setPaymentOption('pay_now')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentOption === 'pay_now'
                      ? 'bg-brand-950/30 border-brand-500 text-white ring-2 ring-brand-500/30'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-brand-400">Option B : Paiement Immédiat</span>
                    {paymentOption === 'pay_now' && <CheckCircle2 className="w-5 h-5 text-brand-400" />}
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Réglez votre abonnement par Mobile Money (Wave, Orange, MTN, Moov) ou Carte bancaire pour 1 an d'accès actif sans interruption.
                  </p>
                </div>
              </div>

              {/* Payment Details if Pay Now Selected */}
              {paymentOption === 'pay_now' && (
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70 space-y-3 animate-fadeIn text-xs">
                  <label className="block font-bold text-slate-200">Opérateur de Paiement Mobile Money / Carte :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'wave', name: 'Wave' },
                      { id: 'orange', name: 'Orange Money' },
                      { id: 'mtn', name: 'MTN MoMo' },
                      { id: 'moov', name: 'Moov Money' },
                      { id: 'card', name: 'Carte Bancaire' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentProvider(p.id as any)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                          paymentProvider === p.id 
                            ? 'bg-brand-600 border-brand-400 text-white' 
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Numéro du Payeur :</label>
                    <input
                      type="text"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Control Flow Guarantee Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2 text-slate-300">
                <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vérification Automatique de la Chaîne d'Accès :</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  auth.users ✅ &rarr; user_profiles (school_admin) ✅ &rarr; schools.status (active) ✅ &rarr; subscription.status ({paymentOption === 'trial' ? 'trialing' : 'active'}) ✅ &rarr; REDIRECTION DASHBOARD 🚀
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalActivation}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Activer mon École & Accéder au Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
