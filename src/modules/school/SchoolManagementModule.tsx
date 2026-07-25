import React, { useState, useEffect } from 'react';
import { Building2, School as SchoolIcon, Calendar, CheckCircle2, Shield, MapPin, Globe, Phone, Mail, Save, Sparkles, Upload, Database, RefreshCw, UserCheck } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';

export const SchoolManagementModule: React.FC = () => {
  const { currentSchool, updateCurrentSchool, academicYear } = useTenant();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ ...currentSchool });
  const [directorAvatar, setDirectorAvatar] = useState(user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setFormData({ ...currentSchool });
  }, [currentSchool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentSchool(formData);
    await supabaseService.updateSchoolConfig(formData.id, formData);

    if (formData.director_name) {
      const parts = formData.director_name.trim().split(' ');
      const lastName = parts.length > 1 ? parts.pop() || '' : '';
      const firstName = parts.join(' ') || formData.director_name;
      updateUser({
        first_name: firstName,
        last_name: lastName,
        avatar_url: directorAvatar
      });
    } else {
      updateUser({ avatar_url: directorAvatar });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Synchronisation Supabase en cours...');
    const result = await supabaseService.syncAllDataToSupabase();
    setIsSyncing(false);
    setSyncStatus(result.message);
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectorAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDirectorAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-brand-500" />
          <span>Configuration & Références de l'Établissement</span>
        </h1>
        <p className="text-xs text-slate-400">Renseignez le nom de votre établissement et les références officielles enregistrées dans Supabase</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main School Info Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <SchoolIcon className="w-5 h-5 text-brand-500" />
              <span>Identité Officielle & Coordonnées</span>
            </h3>

            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Enregistré dans Supabase !' : 'Enregistrer dans Supabase'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom Officiel de l'Établissement *</label>
              <input 
                type="text" 
                required
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-extrabold text-sm text-slate-900 dark:text-white" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro / Code d'Autorisation MENA *</label>
                <input 
                  type="text" 
                  required
                  value={formData.registration_number} 
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-brand-600" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type d'Établissement</label>
                <select 
                  value={formData.school_type} 
                  onChange={(e) => setFormData({ ...formData, school_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                >
                  <option value="Prive">Privé Homologué</option>
                  <option value="Public">Public</option>
                  <option value="Confessionnel">Confessionnel</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Devise de l'École</label>
              <input 
                type="text" 
                value={formData.motto} 
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl italic font-medium" 
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <img 
                src={directorAvatar} 
                alt="Avatar Directeur" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500 shadow-xs" 
              />
              <div className="flex-1">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Nom du Directeur / Chef d'Établissement *</label>
                <input 
                  type="text" 
                  value={formData.director_name} 
                  onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl font-bold text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Photo Directeur</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleDirectorAvatarUpload} 
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone Secrétariat</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Numéro WhatsApp Officiel</label>
                <input 
                  type="text" 
                  value={formData.whatsapp} 
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-emerald-600 font-bold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Adresse Postale & Physique</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ville / Commune</label>
                <input 
                  type="text" 
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Supabase Database Card & Logo Upload */}
        <div className="space-y-6">
          {/* Supabase Persistence Manager Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Base de Données Supabase Active</span>
            </div>

            <p className="text-xs text-slate-300">
              Toutes les données de votre établissement (élèves, parents, professeurs, notes, finances) sont synchronisées avec Supabase.
            </p>

            {syncStatus && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-medium">
                {syncStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleSyncSupabase}
              disabled={isSyncing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser l\'ensemble des tables Supabase'}</span>
            </button>
          </div>

          {/* Logo Upload Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Logo Officiel de l'Établissement</h3>
            
            <div className="w-28 h-28 mx-auto rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden relative group p-2">
              <img src={formData.logo_url || '/images/logoecole.png'} alt="Logo École" className="w-full h-full object-contain" />
            </div>

            <div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-brand-500" />
                <span>Changer / Téléverser le Logo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
