import React, { useState, useEffect } from 'react';
import { 
  Trophy, Medal, Award, TrendingUp, Filter, Search, 
  BarChart2, PieChart, CheckCircle2, XCircle, UserCheck, Star
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { Exam, ExamResult } from '../../../types/database';
import { examsService } from '../../../services/examsService';

interface RankingsTabProps {
  schoolId: string;
  exams: Exam[];
  selectedExam: Exam | null;
  onSelectExam: (exam: Exam) => void;
}

export const RankingsTab: React.FC<RankingsTabProps> = ({
  schoolId,
  exams,
  selectedExam,
  onSelectExam
}) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'class' | 'level' | 'school' | 'cycle' | 'series'>('class');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedExam) return;
    loadResults(selectedExam.id);
  }, [selectedExam]);

  const loadResults = async (examId: string) => {
    setLoading(true);
    try {
      const data = await examsService.getExamResults(examId, schoolId);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMentionBadge = (mention: string) => {
    switch (mention) {
      case 'Très Bien':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">⭐ Très Bien</span>;
      case 'Bien':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Bien</span>;
      case 'Assez Bien':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Assez Bien</span>;
      case 'Passable':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Passable</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Ajourné</span>;
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-400/30">1er</span>;
    if (rank === 2) return <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">2e</span>;
    if (rank === 3) return <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">3e</span>;
    return <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">{rank}</span>;
  };

  // Stats computation
  const totalCandidates = results.length;
  const totalAdmis = results.filter(r => r.result_status === 'ADMIS').length;
  const successRate = totalCandidates > 0 ? ((totalAdmis / totalCandidates) * 100).toFixed(1) : '0';
  const averages = results.map(r => r.average);
  const maxAverage = averages.length > 0 ? Math.max(...averages).toFixed(2) : '0.00';
  const minAverage = averages.length > 0 ? Math.min(...averages).toFixed(2) : '0.00';
  const globalAverage = averages.length > 0 ? (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(2) : '0.00';

  // Chart data
  const pieData = [
    { name: 'Admis (≥10)', value: totalAdmis, color: '#10b981' },
    { name: 'Refusés (<10)', value: totalCandidates - totalAdmis, color: '#f43f5e' }
  ];

  const mentionsCount = {
    'Très Bien': results.filter(r => r.mention === 'Très Bien').length,
    'Bien': results.filter(r => r.mention === 'Bien').length,
    'Assez Bien': results.filter(r => r.mention === 'Assez Bien').length,
    'Passable': results.filter(r => r.mention === 'Passable').length,
    'Ajourné': results.filter(r => r.mention === 'Ajourné').length,
  };

  const barData = Object.entries(mentionsCount).map(([name, count]) => ({ name, count }));

  // Filtering for view tabs
  const classesList = Array.from(new Set(results.map(r => r.class_name || 'Sans classe')));

  const displayedResults = results.filter(r => {
    const matchesSearch = (r.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || r.class_name === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Exam Selector */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Classements & Performances Multi-Niveaux</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Palmarès officiel et analyse statistique de l'examen blanc</p>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedExam?.id || ''}
            onChange={(e) => {
              const ex = exams.find(x => x.id === e.target.value);
              if (ex) onSelectExam(ex);
            }}
            className="w-full md:w-80 px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs font-semibold outline-none focus:border-gray-500"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.level_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center font-bold">
            {successRate}%
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Taux de Réussite</div>
            <div className="text-lg font-extrabold text-gray-900 dark:text-white">{totalAdmis} / {totalCandidates} Admis</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex items-center justify-center font-bold">
            {globalAverage}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Moyenne Générale</div>
            <div className="text-lg font-extrabold text-gray-900 dark:text-white">Moyenne Promotion</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center font-bold">
            {maxAverage}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Plus Forte Moyenne</div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-300">Major de Promo</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center font-bold">
            {minAverage}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase">Moyenne Minimale</div>
            <div className="text-lg font-extrabold text-rose-600 dark:text-rose-300">Seuil de Rattrapage</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>Répartition des Admis / Refusés</span>
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span>Distribution des Mentions</span>
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#374151" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* View Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'class' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Par Classe
          </button>

          <button
            onClick={() => setActiveSubTab('level')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'level' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Par Niveau Global
          </button>

          <button
            onClick={() => setActiveSubTab('school')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'school' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Général Établissement (Top 50)
          </button>

          <button
            onClick={() => setActiveSubTab('cycle')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'cycle' ? 'bg-gray-900 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Par Cycle (1er & 2nd)
          </button>

          <button
            onClick={() => setActiveSubTab('series')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'series' ? 'bg-gray-800 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Par Série (A, C, D)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher rang élève..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-xs outline-none"
          />
        </div>
      </div>

      {/* Class Selector when 'class' subtab is active */}
      {activeSubTab === 'class' && (
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-500">Filtrer Classe :</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-xs font-semibold"
          >
            <option value="all">Toutes les classes</option>
            {classesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-950/80 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4 text-center">Rang Classe</th>
                <th className="py-3 px-4 text-center">Rang Niveau</th>
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-3">Classe</th>
                <th className="py-3 px-3 text-right">Points Totaux</th>
                <th className="py-3 px-4 text-center">Moyenne / 20</th>
                <th className="py-3 px-4 text-center">Mention</th>
                <th className="py-3 px-4 text-center">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {displayedResults.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">{getRankMedal(res.rank)}</div>
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-gray-400">
                    N° {res.rank_level}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{res.student_name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{res.registration_number}</div>
                  </td>

                  <td className="py-3 px-3 font-semibold text-amber-600 dark:text-amber-300">
                    {res.class_name}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                    {res.total_points} pts
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {res.average.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {getMentionBadge(res.mention)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {res.result_status === 'ADMIS' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ADMIS</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30 inline-flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>REFUSÉ</span>
                      </span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
