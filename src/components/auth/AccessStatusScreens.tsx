import React, { useState } from 'react';
import { ShieldAlert, Clock, CreditCard, Lock, RefreshCw, CheckCircle2, PhoneCall, LogOut, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { AccessCheckResult, SaasPaymentRecord } from '../../types/database';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';

interface AccessStatusScreenProps {
  accessCheck: AccessCheckResult;
}

export const AccessStatusScreen: React.FC<AccessStatusScreenProps> = ({ accessCheck }) => {
  const { logout } = useAuth();
  const { plans, renewSubscription } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState('plan-professionnel');
  const [paymentMethod, setPaymentMethod] = useState<SaasPaymentRecord['payment_method']>('wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await renewSubscription(selectedPlanId, paymentMethod);
      setIsProcessing(false);
      if (result.success) {
        setSuccessMsg(result.message);
        // Recharger la page après 1.5s pour actualiser l'état d'accès
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(result.message || 'Une erreur est survenue. Réessayez.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Erreur inattendue. Veuillez réessayer.');
    }
  };

  const handleSimulateWebhook = async () => {
    setIsProcessing(true);
    const result = await renewSubscription(selectedPlanId, paymentMethod);
    setIsProcessing(false);
    if (result.success) {
      window.location.reload();
    }
  };

  // 1. STATUT PENDING_PAYMENT : En attente de confirmation Webhook
  if (accessCheck.reason === 'PENDING_PAYMENT') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-scaleUp">
          <div className="w-16 h-16 bg-amber-950/80 border border-amber-500/40 rounded-3xl flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="text-center space-y-2">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Statut: pending_payment (Redirection /payment)
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Paiement En Cours de Confirmation</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Votre transaction a été initialisée auprès du prestataire Mobile Money / Carte. Conformément à la politique de sécurité d'IvoireÉcole+, l'accès au Dashboard reste verrouillé tant que le **Webhook officiel du fournisseur** n'a pas confirmé le statut <span className="font-mono text-emerald-400 font-bold">payments.status = 'completed'</span>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
            <div className="font-bold text-amber-400 flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Séquence de Sécurité Backend RLS :</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Client &rarr; Transaction Mobile Money &rarr; Webhook Sécurisé Prestataire &rarr; Backend IvoireÉcole+ &rarr; subscriptions.status = 'active' &rarr; Dashboard Autorisé ✅
            </div>
          </div>

          <div className="p-4 bg-brand-950/40 border border-brand-500/30 rounded-2xl text-center space-y-3">
            <div className="text-xs font-bold text-brand-300">Environnement de Test / Démo :</div>
            <button
              onClick={handleSimulateWebhook}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Simuler Réception Webhook Confirmation (Transition Vers Active)</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Abonnement Expiré, Inexistant ou Inactif (Redirection /subscription/renew ou /pricing)
  if (
    accessCheck.reason === 'SUBSCRIPTION_EXPIRED' || 
    accessCheck.reason === 'SUBSCRIPTION_REQUIRED' || 
    accessCheck.reason === 'SUBSCRIPTION_CANCELLED' ||
    accessCheck.reason === 'SUBSCRIPTION_NOT_ACTIVE'
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn">
        <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5" /> Expiration / Non Activité d'Abonnement IvoireÉcole+
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Abonnement Établissement Requis
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                {accessCheck.message || 'Votre abonnement SaaS est inactif ou expiré. Souscrivez une formule pour accéder au dashboard.'}
              </p>
            </div>

            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter</span>
            </button>
          </div>

          {successMsg ? (
            <div className="bg-emerald-950/80 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-3 animate-scaleUp">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-200">Abonnement Activé & Confirmé !</h3>
              <p className="text-xs text-slate-300">{successMsg}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Accéder au Dashboard d'Établissement</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRenew} className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-300 mb-3 uppercase tracking-wider text-[11px]">1. Choisissez votre Plan d'Abonnement :</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-purple-900/30 border-purple-500 shadow-lg shadow-purple-500/20' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute -top-3 right-3 bg-purple-500 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                            Sélectionné
                          </span>
                        )}
                        <div>
                          <h4 className="font-extrabold text-sm text-white">{p.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.description}</p>
                          <div className="text-lg font-extrabold text-purple-300 mt-2">
                            {p.price.toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-slate-400">{p.currency || 'XOF'} /mois</span>
                          </div>
                          <div className="mt-2 text-[10px] text-slate-300">
                            <span className="font-bold text-purple-200">Élèves : {p.max_students === null ? 'Illimités' : `Jusqu'à ${p.max_students}`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="font-bold text-sm text-slate-300 mb-3 uppercase tracking-wider text-[11px]">2. Moyen de Paiement Mobile Money / Carte :</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
                  {[
                    { id: 'wave', label: 'Wave', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-200' },
                    { id: 'orange_money', label: 'Orange Money', color: 'border-orange-500 bg-orange-950/40 text-orange-200' },
                    { id: 'mtn_momo', label: 'MTN MoMo', color: 'border-yellow-500 bg-yellow-950/40 text-yellow-200' },
                    { id: 'moov_money', label: 'Moov Money', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-200' }
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected ? `${method.color} border-2 shadow-md` : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 text-red-300 text-xs px-4 py-3 rounded-xl animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <div className="text-xs text-slate-400">
                  Confirmation sécurisée backend RLS & API Webhook Mobile Money CI
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !selectedPlanId}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Activation en cours...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Souscrire &amp; Activer l&apos;Abonnement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 3. Établissement Suspendu, Bloqué ou Annulé
  if (accessCheck.reason === 'SCHOOL_SUSPENDED' || accessCheck.reason === 'SCHOOL_BLOCKED' || accessCheck.reason === 'SCHOOL_CANCELLED' || accessCheck.reason === 'SUBSCRIPTION_SUSPENDED') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-scaleUp">
          <div className="w-16 h-16 bg-red-950/80 border border-red-500/40 rounded-3xl flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="bg-red-500/20 text-red-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-widest">
              Accès Établissement Restreint (Redirection /account/blocked)
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-3">Établissement Suspendu / Bloqué</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              {accessCheck.message || 'Cette école est suspendue ou bloquée dans le système. Contactez le support d\'IvoireÉcole+.'}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl text-left border border-slate-700 text-xs space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-purple-400" />
              <span>Assistance IvoireÉcole+ :</span>
            </div>
            <p className="text-slate-400 font-mono text-[11px]">Téléphone : +225 27 22 00 00 00 / WhatsApp : +225 07 00 00 00 00</p>
            <p className="text-slate-400 font-mono text-[11px]">Email : support@ivoireecole.ci</p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Établissement En Attente (SCHOOL_PENDING)
  if (accessCheck.reason === 'SCHOOL_PENDING') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-scaleUp">
          <div className="w-16 h-16 bg-purple-950/80 border border-purple-500/40 rounded-3xl flex items-center justify-center mx-auto text-purple-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest">
              Établissement En Attente de Validation
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-3">Validation en cours</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              {accessCheck.message || 'Cette école est en attente de validation par l\'administrateur.'}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Vérifier Statut</span>
            </button>

            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Générique Accès Refusé (Pas de profil / Pas d'école / Désactivé)
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-scaleUp">
        <div className="w-16 h-16 bg-amber-950/80 border border-amber-500/40 rounded-3xl flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
            {accessCheck.reason || 'Accès Bloqué'}
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-3">Accès au Dashboard Non Autorisé</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {accessCheck.message || 'Vous n\'avez pas les droits nécessaires pour accéder à cet espace d\'établissement.'}
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={logout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Se Déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
