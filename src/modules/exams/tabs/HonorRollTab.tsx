import React, { useState, useEffect } from 'react';
import { 
  Star, Award, Settings, Sparkles, CheckCircle2, 
  Calendar, Filter, UserCheck, ShieldAlert, ArrowRight
} from 'lucide-react';
import { HonorRollConfig, HonorRoll, HonorRollEntry } from '../../../types/database';
import { examsService } from '../../../services/examsService';

interface HonorRollTabProps {
  schoolId: string;
  onGenerateCertificates?: (entries: HonorRollEntry[]) => void;
}

export const HonorRollTab: React.FC<HonorRollTabProps> = ({ schoolId, onGenerateCertificates }) => {
  const [configs, setConfigs] = useState<HonorRollConfig[]>([]);
  const [honorRolls, setHonorRolls] = useState<HonorRoll[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'term' | 'annual'>('term');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  // Mock list of generated entries for display
  const [entries, setEntries] = useState<HonorRollEntry[]>([
    { id: 'hre-1', honor_roll_id: 'hr-1', student_id: 'stu-1', student_name: 'KOUASSI Amenan Grace', registration_number: '2026-STV-0012', class_id: 'c-3a', class_name: '3ème A', average: 17.85, distinction_level: 'Tableau d\'Excellence', rank: 1 },
    { id: 'hre-2', honor_roll_id: 'hr-1', student_id: 'stu-2', student_name: 'DIABATÉ Mohamed Lamine', registration_number: '2026-STV-0045', class_id: 'c-3a', class_name: '3ème A', average: 16.40, distinction_level: 'Tableau d\'Excellence', rank: 2 },
    { id: 'hre-3', honor_roll_id: 'hr-1', student_id: 'stu-3', student_name: 'N\'DRI Jean-Marc', registration_number: '2026-STV-0089', class_id: 'c-3b', class_name: '3ème B', average: 15.20, distinction_level: 'Tableau d\'Honneur avec Félicitations', rank: 3 },
    { id: 'hre-4', honor_roll_id: 'hr-1', student_id: 'stu-4', student_name: 'KONAN Koffi Axel', registration_number: '2026-STV-0110', class_id: 'c-3b', class_name: '3ème B', average: 14.10, distinction_level: 'Tableau d\'Honneur avec Félicitations', rank: 4 },
    { id: 'hre-5', honor_roll_id: 'hr-1', student_id: 'stu-5', student_name: 'YAPO Marie-Michelle', registration_number: '2026-STV-0142', class_id: 'c-3a', class_name: '3ème A', average: 13.25, distinction_level: 'Tableau d\'Honneur avec Encouragements', rank: 5 },
  ]);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    const cfgs = await examsService.getHonorConfigs(schoolId);
    setConfigs(cfgs);
    const hrs = await examsService.getHonorRolls(schoolId);
    setHonorRolls(hrs);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 1000);
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.distinction_level || entry.distinction || 'Distinction';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as { [key: string]: HonorRollEntry[] });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Config Launcher */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Moteur du Tableau d'Honneur Automatisé</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Génération trimestrielle et annuelle basée sur les seuils configurés</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <Settings className="w-4 h-4 text-amber-500" />
            <span>Configurer Seuils</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Génération...' : 'Générer Tableau d\'Honneur'}</span>
          </button>
        </div>
      </div>

      {/* Threshold Config Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {configs.map((cfg) => (
          <div key={cfg.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{cfg.title}</div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              Moyenne ≥ {cfg.min_average.toFixed(2)} / 20
            </div>
            <div className="text-[10px] text-gray-400 font-medium">
              {cfg.max_average ? `Jusqu'à ${cfg.max_average.toFixed(2)}` : 'Jusqu\'à 20.00'}
            </div>
          </div>
        ))}
      </div>

      {/* Distinction Groups */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([distinction, items]) => (
          <div key={distinction} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{distinction}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  {items.length} Récipiendaires
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((entry) => (
                <div key={entry.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-extrabold text-gray-900 dark:text-white text-sm">{entry.student_name}</div>
                    <div className="text-xs text-gray-500 font-medium">{entry.class_name} • <span className="font-mono text-gray-400">{entry.registration_number}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">{(entry.average ?? entry.average_score ?? 0).toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400 font-bold">Rang #{entry.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Configuration des Seuils par l'Établissement</span>
            </h3>
            <p className="text-xs text-slate-400">
              Définissez les moyennes minimales requises pour chaque niveau de distinction du Tableau d'Honneur.
            </p>

            <div className="space-y-3">
              {configs.map((cfg, idx) => (
                <div key={cfg.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-white">{cfg.title}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Min /20 :</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      value={cfg.min_average}
                      onChange={(e) => {
                        const updated = [...configs];
                        updated[idx].min_average = parseFloat(e.target.value) || 0;
                        setConfigs(updated);
                      }}
                      className="w-20 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-bold text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  examsService.saveHonorConfigs(schoolId, configs);
                  setShowConfigModal(false);
                }}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                Enregistrer la Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
