import React, { useState } from 'react';
import { MessageSquare, Send, Bot, CheckCircle2, Sparkles, Phone, MessageCircle, Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface ParentNotification {
  id: string;
  targetGroup: string;
  channel: 'WhatsApp' | 'SMS';
  content: string;
  date: string;
  status: 'Envoyé' | 'Programmé';
}

export const CommunicationModule: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [targetGroup, setTargetGroup] = useState('3ème 2');
  const [messageContent, setMessageContent] = useState('Chers parents, la réunion de suivi du Trimestre 1 aura lieu ce samedi à 09h00 en salle polyvalente.');
  const [sentSuccess, setSentSuccess] = useState(false);

  const [notificationsHistory, setNotificationsHistory] = useState<ParentNotification[]>([
    {
      id: 'notif-1',
      targetGroup: '3ème 2',
      channel: 'WhatsApp',
      content: 'Chers parents, la réunion de suivi du Trimestre 1 aura lieu ce samedi à 09h00 en salle polyvalente.',
      date: '2026-07-24 08:30',
      status: 'Envoyé'
    },
    {
      id: 'notif-2',
      targetGroup: 'Toutes les classes',
      channel: 'SMS',
      content: 'Rappel: Début des compositions trimestrielles le lundi 05 Janvier à 07h30.',
      date: '2026-07-28 10:00',
      status: 'Programmé'
    }
  ]);

  const [editingNotification, setEditingNotification] = useState<ParentNotification | null>(null);

  // Chatbot simulator state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'user', text: 'Quel est le dernier résultat de mon enfant Awa Fatima ?' },
    { sender: 'bot', text: '🤖 IvoireBot: Awa Fatima DIABATÉ (3ème 2) a obtenu une moyenne générale de 16.45/20 au 1er Trimestre (Rang: 2e sur 42). Félicitations !' },
  ]);
  const [userQuery, setUserQuery] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotif: ParentNotification = {
      id: `notif-${Date.now()}`,
      targetGroup,
      channel: selectedChannel,
      content: messageContent,
      date: new Date().toLocaleString(),
      status: 'Envoyé'
    };
    setNotificationsHistory([newNotif, ...notificationsHistory]);
    supabaseService.saveNotificationLog(newNotif);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleSaveEditNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotification) return;
    setNotificationsHistory(notificationsHistory.map(n => n.id === editingNotification.id ? editingNotification : n));
    setEditingNotification(null);
  };

  const handleDeleteNotif = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette notification ?')) {
      setNotificationsHistory(notificationsHistory.filter(n => n.id !== id));
    }
  };

  const handleAskBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const q = userQuery;
    const newMsgs = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMsgs);
    setUserQuery('');

    setTimeout(() => {
      let botResp = "🤖 IvoireBot: Merci de votre demande. Toutes les données scolaires sont synchronisées en temps réel.";
      if (q.toLowerCase().includes('présent') || q.toLowerCase().includes('absence')) {
        botResp = "🤖 IvoireBot: Awa Fatima était bien Présente aujourd'hui (23/07/2026). Aucun retard enregistré.";
      } else if (q.toLowerCase().includes('payer') || q.toLowerCase().includes('combien')) {
        botResp = "🤖 IvoireBot: Le solde restant pour la scolarité du 2nd Trimestre est de 0 FCFA. Votre compte est à jour !";
      } else if (q.toLowerCase().includes('vacances') || q.toLowerCase().includes('trimestre')) {
        botResp = "🤖 IvoireBot: Le 2nd Trimestre débutera officiellement le Lundi 05 Janvier 2026 à 07h30.";
      }
      setChatMessages([...newMsgs, { sender: 'bot', text: botResp }]);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-emerald-500" />
          <span>Centre de Communication Parents (WhatsApp & SMS)</span>
        </h1>
        <p className="text-xs text-slate-400">Diffusion d'annonces groupées, édition de notifications et Chatbot IA WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dispatcher Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Rédiger / Diffuser une Notification</h3>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Canal d'envoi</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('WhatsApp')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedChannel === 'WhatsApp' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  WhatsApp Business API
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('SMS')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedChannel === 'SMS' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  SMS Direct (Orange/MTN)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Groupe Cible / Destinataires</label>
              <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold">
                <option value="3ème 2">Parents de la classe 3ème 2 (42 destinataires)</option>
                <option value="6ème 1">Parents de la classe 6ème 1 (44 destinataires)</option>
                <option value="Tle A2">Parents de la classe Tle A2 (38 destinataires)</option>
                <option value="Toutes les classes">Tous les Parents de l'établissement (1 850 destinataires)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Contenu du Message</label>
              <textarea
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {sentSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Send className="w-4 h-4" />}
              <span>{sentSuccess ? 'Notification WhatsApp Diffusée !' : `Envoyer via ${selectedChannel}`}</span>
            </button>
          </form>
        </div>

        {/* Right: WhatsApp Chatbot Simulator */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 border border-slate-800">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Simulateur Chatbot WhatsApp Parent</h3>
              <p className="text-[11px] text-emerald-400">Assistant Réponse Automatique IvoireBot 24/7</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-2xl text-xs ${
                  msg.sender === 'user' ? 'bg-emerald-700 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAskBot} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              placeholder="Ex: Mon enfant était-il présent ?..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs">
              Envoyer
            </button>
          </form>
        </div>
      </div>

      {/* Notifications History Table with Edit/Delete */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Historique des Notifications Envoyées & Programmées</h3>
          <span className="text-xs text-slate-400 font-bold">{notificationsHistory.length} Notifications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-400 font-bold border-b">
              <tr>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Groupe Cible</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Date / Heure</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {notificationsHistory.map((notif) => (
                <tr key={notif.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${notif.channel === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-brand-50 text-brand-700'}`}>
                      {notif.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{notif.targetGroup}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{notif.content}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{notif.date}</td>
                  <td className="py-3 px-4 font-bold">
                    <span className={`px-2 py-0.5 rounded-md ${notif.status === 'Envoyé' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {notif.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNotification(notif)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-amber-500"
                        title="Modifier la notification"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotif(notif.id)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 rounded-lg text-rose-500"
                        title="Supprimer la notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Notification Modal */}
      {editingNotification && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier la Notification</span>
              </h3>
              <button onClick={() => setEditingNotification(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEditNotif} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Groupe Cible</label>
                <input 
                  type="text" 
                  value={editingNotification.targetGroup}
                  onChange={(e) => setEditingNotification({...editingNotification, targetGroup: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contenu du Message</label>
                <textarea 
                  rows={4}
                  value={editingNotification.content}
                  onChange={(e) => setEditingNotification({...editingNotification, content: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingNotification(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
