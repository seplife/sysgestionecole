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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-amber-500" />
            <span>Récompenses, Cérémonies & Organisation du Palmarès</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Planification des événements d'excellence et livret officiel du palmarès</p>
        </div>

        <button
          onClick={() => alert('Option d\'exportation du livret du palmarès.')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer Livret du Palmarès</span>
        </button>
      </div>

      {/* Ceremonies List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ceremonies.map((ceremony) => (
          <div key={ceremony.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ceremony.status === 'upcoming' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}>
                  {ceremony.status === 'upcoming' ? '🗓️ À Venir' : '✅ Réalisée'}
                </span>
                <span className="text-xs text-gray-400 font-mono font-bold">{ceremony.time}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{ceremony.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ceremony.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(ceremony.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">{ceremony.location}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Prix à Distribuer</div>
                  <div className="font-black text-amber-600 dark:text-amber-300 text-base">{ceremony.total_awards} Distinctions</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Invités Attendus</div>
                  <div className="font-black text-gray-900 dark:text-white text-base">{ceremony.expected_guests} Personnes</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
              <button
                onClick={() => alert('Génération de la fiche de déroulement de cérémonie.')}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-800 hover:text-white text-gray-700 dark:text-gray-200 font-bold rounded-lg transition-colors text-xs flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Programme & Fiche</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
