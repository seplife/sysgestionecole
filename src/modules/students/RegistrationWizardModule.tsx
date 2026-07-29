import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Upload, Sparkles, ArrowRight, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { Student, SchoolClass } from '../../types/database';
import { studentService } from '../../services/studentService';
import { supabaseService } from '../../services/supabaseService';
import { useTenant } from '../../context/TenantContext';
import { DEFAULT_ORGANIZATION_ID, DEFAULT_SCHOOL_ID } from '../../services/tenantService';

interface RegistrationWizardProps {
  onComplete: (newStudent: Student) => void;
  onCancel: () => void;
  classesList?: SchoolClass[];
}

export const RegistrationWizardModule: React.FC<RegistrationWizardProps> = ({ 
  onComplete, 
  onCancel,
  classesList 
}) => {
  const { currentSchool, organization } = useTenant();
  const [step, setStep] = useState<number>(1);
  const [classes, setClasses] = useState<SchoolClass[]>(classesList || []);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const generateMatricule = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const randDigits = Math.floor(100000 + Math.random() * 900000);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${year}${randDigits}${letter}`;
  };

  const [formData, setFormData] = useState({
    registrationNumber: '25180499E',
    firstName: 'Grace Emmanuelle',
    lastName: 'KOUASSI',
    dateOfBirth: '2012-05-14',
    placeOfBirth: 'Abidjan Cocody',
    gender: 'F',
    bloodGroup: 'O+',
    address: 'Riviera Palmeraie, Cité Lauriers',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    parentFirstName: 'Kouassi',
    parentLastName: 'DIABATÉ',
    parentPhone: '+225 07 08 09 10 11',
    parentWhatsapp: '+225 07 08 09 10 11',
    parentEmail: 'parent@gmail.com',
    targetLevel: 'Tous',
    targetClass: '',
    registrationFee: 50000,
    tuitionFeeT1: 150000,
    paymentMethod: 'Wave',
  });

  // Charger dynamiquement les classes créées dans l'application
  useEffect(() => {
    supabaseService.fetchClasses().then(fetched => {
      if (fetched && fetched.length > 0) {
        setClasses(fetched);
        setFormData(prev => {
          const currentValid = fetched.some(c => c.name === prev.targetClass);
          return {
            ...prev,
            targetClass: currentValid ? prev.targetClass : fetched[0].name,
            targetLevel: prev.targetLevel === 'Tous' ? (fetched[0].level_name || 'Tous') : prev.targetLevel
          };
        });
      }
    });
  }, [classesList]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedClassName = formData.targetClass || (classes[0]?.name ?? 'Non affectée');

      const newStudent: Student = {
        id: crypto.randomUUID(),
        organization_id: organization.id || DEFAULT_ORGANIZATION_ID,
        school_id: currentSchool.id || DEFAULT_SCHOOL_ID,
        registration_number: formData.registrationNumber || generateMatricule(),
        first_name: formData.firstName || 'Grace Emmanuelle',
        last_name: formData.lastName || 'KOUASSI',
        date_of_birth: formData.dateOfBirth,
        place_of_birth: formData.placeOfBirth,
        gender: formData.gender as 'M' | 'F',
        nationality: 'Ivoirienne',
        blood_group: formData.bloodGroup,
        status: 'Inscrit',
        current_class_name: selectedClassName,
        address: formData.address,
        photo_url: formData.photoUrl
      };

      const result = await studentService.saveStudent(newStudent);

      if (!result.success && result.status === 'ERROR') {
        setSubmitError(result.error || 'Erreur lors de l\'enregistrement de l\'élève.');
        return;
      }

      onComplete(result.data || newStudent);
    } catch (e: any) {
      setSubmitError(e?.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extraire les niveaux dynamiquement à partir des classes réelles enregistrées
  const dynamicLevelNames = Array.from(new Set(classes.map(c => c.level_name).filter(Boolean))) as string[];
  const availableLevels = ['Tous', ...dynamicLevelNames];

  // Filtrer les classes selon le niveau sélectionné
  const filteredClasses = classes.filter(c => {
    if (formData.targetLevel === 'Tous') return true;
    return c.level_name === formData.targetLevel || c.name.startsWith(formData.targetLevel);
  });

  const displayClassesList = filteredClasses.length > 0 ? filteredClasses : classes;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fadeIn">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand-500" />
            <span>Processus d'Inscription Élève</span>
          </h2>
          <p className="text-xs text-slate-400">Enregistrement et génération du matricule MENA officiel</p>
        </div>
        <span className="text-xs font-bold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
          Étape {step} sur 4
        </span>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-4 gap-2">
        {['1. Élève', '2. Parents', '3. Classe', '4. Frais & Validation'].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div 
              key={label}
              className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : isDone 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* STEP 1: Élève */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">État Civil de l'Élève</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Matricule Élève (Saisie Manuelle MENA) *
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="ex: 24180492A"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-brand-600 outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, registrationNumber: generateMatricule()})}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Générer auto
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img src={formData.photoUrl} alt="Photo élève" className="w-16 h-16 rounded-xl object-cover border-2 border-brand-500" />
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Photo de l'Élève (Identité / Carte)</label>
                  <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Téléverser / Choisir une Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nom de famille *</label>
                <input 
                  type="text" 
                  placeholder="ex: KOUASSI"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Prénoms complets *</label>
                <input 
                  type="text" 
                  placeholder="ex: Grace Emmanuelle"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date de Naissance *</label>
                <input 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Lieu de Naissance *</label>
                <input 
                  type="text" 
                  placeholder="ex: Abidjan Cocody"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Sexe</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                >
                  <option value="F">Féminin (F)</option>
                  <option value="M">Masculin (M)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Groupe Sanguin</label>
                <select 
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Parents */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Parents & Tuteurs Rattachés</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nom du Tuteur Principal *</label>
                <input 
                  type="text" 
                  value={formData.parentLastName}
                  onChange={(e) => setFormData({...formData, parentLastName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Prénom du Tuteur Principal *</label>
                <input 
                  type="text" 
                  value={formData.parentFirstName}
                  onChange={(e) => setFormData({...formData, parentFirstName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Téléphone Principal (SMS) *</label>
                <input 
                  type="text" 
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Numéro WhatsApp (Notifications) *</label>
                <input 
                  type="text" 
                  value={formData.parentWhatsapp}
                  onChange={(e) => setFormData({...formData, parentWhatsapp: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Classe (Dynamique selon les classes crées) */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Affectation Pédagogique (Classes Créées)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtrer par Niveau Scolaire</label>
                <select 
                  value={formData.targetLevel}
                  onChange={(e) => {
                    const selectedLvl = e.target.value;
                    const matchingClass = classes.find(c => selectedLvl === 'Tous' || c.level_name === selectedLvl || c.name.startsWith(selectedLvl));
                    setFormData(prev => ({
                      ...prev,
                      targetLevel: selectedLvl,
                      targetClass: matchingClass ? matchingClass.name : prev.targetClass
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                >
                  {availableLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Classe d'Affectation *</label>
                <select 
                  value={formData.targetClass}
                  onChange={(e) => setFormData({...formData, targetClass: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-brand-600 outline-none focus:border-brand-500"
                >
                  {displayClassesList.length > 0 ? (
                    displayClassesList.map((cls) => {
                      const freePlaces = Math.max(0, (cls.capacity || 45) - (cls.student_count || 0));
                      return (
                        <option key={cls.id} value={cls.name}>
                          {cls.name} {cls.level_name ? `(${cls.level_name})` : ''} - Capacité {cls.capacity || 45} (Reste {freePlaces} places)
                        </option>
                      );
                    })
                  ) : (
                    <option value="">Aucune classe créée - Veuillez d'abord ajouter une classe dans le module Classes</option>
                  )}
                </select>
              </div>
            </div>

            {displayClassesList.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Aucune classe créée ne correspond à ce niveau. Rendez-vous dans le module <span className="font-bold">Gestion des Classes</span> pour créer vos classes d'établissement.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Validation */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Récapitulatif & Frais d'Inscription</h3>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Élève à inscrire:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.lastName} {formData.firstName}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Classe demandée:</span>
                <span className="font-bold text-brand-600">{formData.targetClass || 'Non renseignée'}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Frais d'inscription + Badge:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.registrationFee.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 text-emerald-600">
                <span>Total à régler à l'inscription:</span>
                <span className="text-sm">{formData.registrationFee.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-xl text-xs text-brand-800 dark:text-brand-300 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-500 shrink-0" />
              <span>Un matricule MENA officiel sera automatiquement attribué et la carte scolaire QR Code sera générée.</span>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
                ⚠️ {submitError}
              </div>
            )}
          </div>
        )}

        {/* Buttons Nav */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePrev}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              Annuler
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-md"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-brand-600 to-ivory-orange hover:from-brand-700 hover:to-orange-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valider l'Inscription</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
