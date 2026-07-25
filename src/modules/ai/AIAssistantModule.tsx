import React, { useState } from 'react';
import { Sparkles, Bot, Send, AlertTriangle, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

export const AIAssistantModule: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Bonjour ! Je suis IvoireIA+, l\'assistant intelligent du Groupe Scolaire Saint-Viateur. Comment puis-je vous aider dans l\'analyse des données pédagogiques ou financières aujourd\'hui ?'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = [
    'Quels sont les élèves ayant moins de 10 de moyenne ?',
    'Analyse les résultats de la classe de 3ème 2',
    'Quels élèves risquent l\'échec aux examens du BEPC ?',
    'Quels parents ont des impayés sur le 1er trimestre ?'
  ];

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg = { role: 'user' as const, text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse = "🤖 IvoireIA+: J'ai analysé les données de l'établissement.";
      const lower = queryText.toLowerCase();

      if (lower.includes('moins de 10') || lower.includes('échec')) {
        aiResponse = "📊 **Rapport IvoireIA+ — Élèves en fragilité académique** :\n\n• **Mohamed Lamine TRAORÉ** (6ème 1) : Moyenne T1 = 09.80/20 (Difficultés en Mathématiques et Physique)\n• **Jean-Paul KOUASSI** (4ème 2) : Moyenne T1 = 08.50/20 (+ 5 absences non justifiées)\n\n💡 **Recommandation IA** : Planifier un cours de soutien du samedi matin et notifier les tuteurs via WhatsApp.";
      } else if (lower.includes('3ème 2') || lower.includes('analyse')) {
        aiResponse = "🏆 **Analyse Globale de la 3ème 2 (Trimestre 1)** :\n\n• **Effectif** : 42 élèves (22 Filles, 20 Garçons)\n• **Moyenne de Classe** : 15.10 / 20\n• **Meilleure Moyenne** : 18.16 / 20 (Marc-Aurèle KOFFI)\n• **Taux de Réussite Prédictif BEPC** : 94.2%\n\n✅ La classe fait preuve d'une excellente rigueur en Mathématiques et Physique-Chimie.";
      } else if (lower.includes('impayé') || lower.includes('parents')) {
        aiResponse = "💳 **Synthèse Financière IvoireIA+** :\n\n• 145 élèves présentent un retard partiel de scolarité T1.\n• Montant total des impayés : 18 250 000 FCFA.\n\n📲 **Action suggérée** : Lancer la campagne automatique de relances par SMS et Wave Mobile Money.";
      }

      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
      setIsThinking(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 bg-gradient-to-r from-brand-500 via-indigo-600 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Assistant IA Éducatif "IvoireIA+"</h1>
          <p className="text-xs text-slate-200">Intelligence Artificielle Générative & Analytique Scolaire</p>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuery(prompt)}
            className="bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Window */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs space-y-4 min-h-[350px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white font-medium rounded-br-none shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
                <span>IvoireIA+ analyse la base de données PostgreSQL...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleQuery(inputQuery); }} className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            placeholder="Posez une question en langage naturel (ex: Quels élèves sont souvent absents ?)..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer</span>
          </button>
        </form>
      </div>
    </div>
  );
};
