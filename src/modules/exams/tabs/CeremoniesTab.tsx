import React, { useState } from 'react';
import { 
  Trophy, Gift, Calendar, MapPin, Users, Award, 
  Sparkles, Printer, CheckCircle, Clock, Plus, BookOpen
} from 'lucide-react';

interface CeremoniesTabProps {
  schoolId: string;
}

export const CeremoniesTab: React.FC<CeremoniesTabProps> = ({ schoolId }) => {
  const [ceremonies] = useState([
    {
      id: 'cer-1',
      title: 'Grande Cérémonie du Palmarès & Remise des Prix 2026',
      date: '2026-07-10',
      time: '09:00 - 13:00',
      location: 'Grand Amphithéâtre Saint-Viateur Palmeraie',
      status: 'upcoming',
      total_awards: 45,
      expected_guests: 350,
      description: 'Célébration annuelle de l\'excellence académique, remise des bourses d\'études et certificats d\'honneur sous le haut patronnage du MENA.'
    },
    {
      id: 'cer-2',
      title: 'Célébration des Majors du BEPC & BAC Blanc N°1',
      date: '2026-03-05',
      time: '10:00 - 11:30',
      location: 'Cour d\'Honneur de l\'Établissement',
      status: 'completed',
      total_awards: 18,
      expected_guests: 200,
      description: 'Remise officielle des attestations de réussite et récompenses de la première session d\'examens blancs.'
    }
  ]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>Récompenses, Cérémonies & Organisation du Palmarès</span>
          </h2>
          <p className="text-xs text-slate-400">Planification des événements d'excellence et livret officiel du palmarès</p>
        </div>

        <button
          onClick={() => alert('Option d\'exportation du livret du palmarès.')}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/20 flex items-center space-x-2 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer Livret du Palmarès</span>
        </button>
      </div>

      {/* Ceremonies List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ceremonies.map((ceremony) => (
          <div key={ceremony.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ceremony.status === 'upcoming' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {ceremony.status === 'upcoming' ? '🗓️ À Venir' : '✅ Réalisée'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{ceremony.time}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-white">{ceremony.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ceremony.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  <span>{new Date(ceremony.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="truncate">{ceremony.location}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Prix à Distribuer</div>
                  <div className="font-black text-amber-300 text-base">{ceremony.total_awards} Distinctions</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Invités Attendus</div>
                  <div className="font-black text-brand-300 text-base">{ceremony.expected_guests} Personnes</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => alert(`Téléchargement de l'ordre du jour pour ${ceremony.title}`)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Ordre du Jour & Programme</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
