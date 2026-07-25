import React, { useState, useEffect } from 'react';
import { 
  Library, Bus, Utensils, BookOpen, CheckCircle2, Clock, MapPin, 
  Plus, Edit2, Trash2, Search, X, Save, AlertTriangle, UserCheck, Smartphone, Send, ChevronRight, Check
} from 'lucide-react';
import { BookItem, BookLoan, Student } from '../../types/database';
import { supabaseService, getLocalCache, setLocalCache } from '../../services/supabaseService';

const initialBooks: BookItem[] = [
  { id: '1', isbn: '978-2091717808', title: 'Mon beau navire de papier (Français 3ème)', author: 'Bernard Dadié', category: 'Français / Littérature', level_target: '3ème', condition: 'Bon état', totalQuantity: 120, availableQuantity: 94 },
  { id: '2', isbn: '978-2218956226', title: 'CIAM Mathématiques 3ème Collection', author: 'Comité Ivoirien de Mathématiques', category: 'Mathématiques', level_target: '3ème', condition: 'Neuf', totalQuantity: 150, availableQuantity: 109 },
  { id: '3', isbn: '978-2091718003', title: 'Physique Chimie 3ème Programme MENA', author: 'Kouamé & Associés', category: 'Sciences Physiques', level_target: '3ème', condition: 'Bon état', totalQuantity: 100, availableQuantity: 82 },
  { id: '4', isbn: '978-2218956332', title: 'L\'Aventure Ambiguë', author: 'Cheikh Hamidou Kane', category: 'Littérature Africaine', level_target: 'Tle A', condition: 'Bon état', totalQuantity: 80, availableQuantity: 45 },
  { id: '5', isbn: '978-2091718102', title: 'CIAM Mathématiques 6ème / 5ème', author: 'Collection Officielle MENA', category: 'Mathématiques', level_target: '6ème / 5ème', condition: 'Neuf', totalQuantity: 200, availableQuantity: 160 },
  { id: '6', isbn: '978-2218956441', title: 'Climbié', author: 'Bernard Dadié', category: 'Littérature Africaine', level_target: '4ème', condition: 'Usagé', totalQuantity: 90, availableQuantity: 68 }
];

const initialLoans: BookLoan[] = [
  { id: 'loan-1', book_id: '1', book_title: 'Mon beau navire de papier (Français 3ème)', student_name: 'Awa Fatima DIABATÉ', student_matricule: '2026-ABJ-0089', class_name: '3ème 2', loan_date: '2026-09-15', due_date: '2026-11-15', status: 'En cours' },
  { id: 'loan-2', book_id: '2', book_title: 'CIAM Mathématiques 3ème Collection', student_name: 'KOUASSI Jean-Emmanuel', student_matricule: '2026-ABJ-0102', class_name: '3ème 1', loan_date: '2026-09-10', due_date: '2026-10-10', status: 'En retard' },
  { id: 'loan-3', book_id: '3', book_title: 'Physique Chimie 3ème Programme MENA', student_name: 'YAO Kouadio Yves', student_matricule: '2026-ABJ-0055', class_name: '3ème 2', loan_date: '2026-09-08', due_date: '2026-10-08', return_date: '2026-10-05', status: 'Restitué' }
];

export const LibraryModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');
  const [books, setBooks] = useState<BookItem[]>(() => getLocalCache('library_books', initialBooks));
  const [loans, setLoans] = useState<BookLoan[]>(() => getLocalCache('library_loans', initialLoans));
  const [students, setStudents] = useState<Student[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Français / Littérature',
    level_target: '3ème',
    condition: 'Neuf' as const,
    totalQuantity: 50,
    availableQuantity: 50
  });

  const [newLoan, setNewLoan] = useState({
    book_id: '',
    student_name: '',
    student_matricule: '',
    class_name: '3ème 2',
    loan_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    supabaseService.fetchStudents().then(setStudents);
  }, []);

  const saveBooksState = (updated: BookItem[]) => {
    setBooks(updated);
    setLocalCache('library_books', updated);
  };

  const saveLoansState = (updated: BookLoan[]) => {
    setLoans(updated);
    setLocalCache('library_loans', updated);
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = `${b.title} ${b.author} ${b.isbn} ${b.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredLoans = loans.filter(l => 
    `${l.book_title} ${l.student_name} ${l.student_matricule} ${l.class_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BookItem = {
      id: `bk-${Date.now()}`,
      ...newBook
    };
    saveBooksState([created, ...books]);
    setShowAddModal(false);
    setNewBook({ isbn: '', title: '', author: '', category: 'Français / Littérature', level_target: '3ème', condition: 'Neuf', totalQuantity: 50, availableQuantity: 50 });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    saveBooksState(books.map(b => b.id === editingBook.id ? editingBook : b));
    setEditingBook(null);
  };

  const handleDeleteBook = (id: string, title: string) => {
    if (window.confirm(`Supprimer le manuel "${title}" du catalogue de la bibliothèque ?`)) {
      saveBooksState(books.filter(b => b.id !== id));
    }
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = books.find(b => b.id === newLoan.book_id);
    if (!targetBook) return;

    if (targetBook.availableQuantity <= 0) {
      alert("Ce manuel n'est actuellement plus disponible en réserve !");
      return;
    }

    const createdLoan: BookLoan = {
      id: `loan-${Date.now()}`,
      book_id: targetBook.id,
      book_title: targetBook.title,
      student_name: newLoan.student_name,
      student_matricule: newLoan.student_matricule,
      class_name: newLoan.class_name,
      loan_date: newLoan.loan_date,
      due_date: newLoan.due_date,
      status: 'En cours'
    };

    // Update book quantity
    const updatedBooks = books.map(b => b.id === targetBook.id ? { ...b, availableQuantity: Math.max(0, b.availableQuantity - 1) } : b);
    saveBooksState(updatedBooks);
    saveLoansState([createdLoan, ...loans]);

    setShowLoanModal(false);
    setNewLoan({
      book_id: '',
      student_name: '',
      student_matricule: '',
      class_name: '3ème 2',
      loan_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleReturnLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoans = loans.map(l => l.id === loanId ? { ...l, status: 'Restitué' as const, return_date: new Date().toISOString().split('T')[0] } : l);
    saveLoansState(updatedLoans);

    // Increase available quantity
    const updatedBooks = books.map(b => b.id === loan.book_id ? { ...b, availableQuantity: b.availableQuantity + 1 } : b);
    saveBooksState(updatedBooks);
  };

  const handleSendReminder = (studentName: string, bookTitle: string) => {
    alert(`Rappel WhatsApp / SMS envoyé au parent de ${studentName} pour le retour du livre "${bookTitle}".`);
  };

  const totalBooksCount = books.reduce((a, b) => a + b.totalQuantity, 0);
  const borrowedBooksCount = books.reduce((a, b) => a + (b.totalQuantity - b.availableQuantity), 0);
  const availableBooksCount = books.reduce((a, b) => a + b.availableQuantity, 0);
  const overdueLoansCount = loans.filter(l => l.status === 'En retard').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Library className="w-7 h-7 text-brand-500" />
            <span>Bibliothèque & Gestion du Manuel Scolaire ({books.length} Références)</span>
          </h1>
          <p className="text-xs text-slate-400">Gestion du fonds documentaire, cartable pédagogique et suivi des emprunts d'élèves</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowLoanModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Enregistrer un Emprunt Élève</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter au Catalogue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Catalogue Général</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center font-bold">
              <Library className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalBooksCount} <span className="text-xs text-slate-400 font-normal">Exemplaires</span>
          </div>
          <div className="text-xs text-purple-600 font-semibold mt-1">{books.length} Références MENA actives</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">En Circulation / Prêt</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-brand-600 dark:text-brand-400">
            {borrowedBooksCount} <span className="text-xs text-slate-400 font-normal">Manuels</span>
          </div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Cartable Pédagogique Élèves</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Disponibles en Réserve</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {availableBooksCount} <span className="text-xs text-slate-400 font-normal">En rayon</span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Prêts à être empruntés</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Retards de Restitution</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-600 dark:text-red-400">
            {overdueLoansCount} <span className="text-xs text-slate-400 font-normal">Relances requises</span>
          </div>
          <div className="text-xs text-red-500 font-semibold mt-1">Relances WhatsApp actives</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'catalog'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>Catalogue du Fonds Documentaire ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'loans'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Suivi des Emprunts & Restitutions Élèves ({loans.length})</span>
          {overdueLoansCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">{overdueLoansCount} en retard</span>
          )}
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'catalog' ? "Rechercher par Titre, Auteur, ISBN ou Catégorie..." : "Rechercher un élève, matricule ou livre..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-brand-500"
          />
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center gap-2 text-xs w-full md:w-auto">
            <span className="text-slate-400 font-bold">Discipline :</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Toutes les disciplines</option>
              <option value="Français / Littérature">Français / Littérature</option>
              <option value="Mathématiques">Mathématiques</option>
              <option value="Sciences Physiques">Sciences Physiques</option>
              <option value="Littérature Africaine">Littérature Africaine</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: CATALOGUE DES MANUELS */}
      {activeTab === 'catalog' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Code / ISBN</th>
                <th className="py-3.5 px-4">Titre de l'Ouvrage</th>
                <th className="py-3.5 px-4">Auteur</th>
                <th className="py-3.5 px-4">Niveau / Discipline</th>
                <th className="py-3.5 px-4">État Stock</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">En Réserve</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBooks.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{bk.isbn}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {bk.title}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">{bk.author}</td>
                  <td className="py-3 px-4">
                    <span className="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {bk.category} ({bk.level_target || 'Tous Niveaux'})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      bk.condition === 'Neuf' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      bk.condition === 'Usagé' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800'
                    }`}>
                      {bk.condition || 'Bon état'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white text-sm">{bk.totalQuantity}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-emerald-600 text-sm">{bk.availableQuantity}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingBook(bk)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-amber-500"
                        title="Modifier le livre"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(bk.id, bk.title)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 rounded-lg text-rose-500"
                        title="Supprimer le livre"
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
      )}

      {/* TAB 2: SUIVI DES EMPRUNTS ÉLÈVES */}
      {activeTab === 'loans' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Élève & Matricule</th>
                <th className="py-3.5 px-4">Classe</th>
                <th className="py-3.5 px-4">Manuel Emprunté</th>
                <th className="py-3.5 px-4">Date Prêt</th>
                <th className="py-3.5 px-4">Date Limite Retour</th>
                <th className="py-3.5 px-4">Statut Restitution</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLoans.map((ln) => (
                <tr key={ln.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{ln.student_name}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-semibold">{ln.student_matricule}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-600">{ln.class_name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{ln.book_title}</td>
                  <td className="py-3 px-4 font-mono">{ln.loan_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-600">{ln.due_date}</td>
                  <td className="py-3 px-4">
                    {ln.status === 'Restitué' ? (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Restitué le {ln.return_date || 'Aujourd\'hui'}
                      </span>
                    ) : ln.status === 'En retard' ? (
                      <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-500" /> En Retard
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> En cours d'emprunt
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ln.status !== 'Restitué' && (
                        <>
                          <button
                            onClick={() => handleReturnLoan(ln.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-xs"
                            title="Valider la restitution et réintégrer au stock"
                          >
                            <Check className="w-3 h-3" />
                            <span>Restituer</span>
                          </button>

                          <button
                            onClick={() => handleSendReminder(ln.student_name, ln.book_title)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-xs"
                            title="Rappeler le parent via WhatsApp"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Relancer</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add Book */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Nouveau Livre / Manuel au Catalogue</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code / ISBN *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: 978-2091717808"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de l'Ouvrage *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Mon beau navire de papier"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: Bernard Dadié"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Discipline / Matière</label>
                  <select
                    value={newBook.category}
                    onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="Français / Littérature">Français / Littérature</option>
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Sciences Physiques">Sciences Physiques</option>
                    <option value="Littérature Africaine">Littérature Africaine</option>
                    <option value="Histoire-Géographie">Histoire-Géographie</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantité Totale</label>
                  <input 
                    type="number" 
                    value={newBook.totalQuantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0;
                      setNewBook({...newBook, totalQuantity: qty, availableQuantity: qty});
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Niveau Visé</label>
                  <input 
                    type="text" 
                    value={newBook.level_target}
                    onChange={(e) => setNewBook({...newBook, level_target: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Ajouter au Catalogue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Loan Book */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span>Enregistrer un Emprunt Élève</span>
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sélectionner le Manuel *</label>
                <select
                  required
                  value={newLoan.book_id}
                  onChange={(e) => setNewLoan({...newLoan, book_id: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="">-- Choisir un livre disponible --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.availableQuantity <= 0}>
                      {b.title} ({b.availableQuantity} disponible(s))
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom & Prénoms de l'Élève *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Awa Fatima DIABATÉ"
                  value={newLoan.student_name}
                  onChange={(e) => setNewLoan({...newLoan, student_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Matricule Élève *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="2026-ABJ-0089"
                    value={newLoan.student_matricule}
                    onChange={(e) => setNewLoan({...newLoan, student_matricule: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classe *</label>
                  <input 
                    type="text" 
                    required
                    value={newLoan.class_name}
                    onChange={(e) => setNewLoan({...newLoan, class_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Emprunt</label>
                  <input 
                    type="date" 
                    value={newLoan.loan_date}
                    onChange={(e) => setNewLoan({...newLoan, loan_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date Limite Retour</label>
                  <input 
                    type="date" 
                    value={newLoan.due_date}
                    onChange={(e) => setNewLoan({...newLoan, due_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowLoanModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Valider l'Emprunt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Book */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>Modifier le Manuel Scolaire</span>
              </h3>
              <button onClick={() => setEditingBook(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titre de l'Ouvrage</label>
                <input 
                  type="text" 
                  required
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Auteur</label>
                <input 
                  type="text" 
                  required
                  value={editingBook.author}
                  onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Total</label>
                  <input 
                    type="number" 
                    value={editingBook.totalQuantity}
                    onChange={(e) => setEditingBook({...editingBook, totalQuantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Disponible</label>
                  <input 
                    type="number" 
                    value={editingBook.availableQuantity}
                    onChange={(e) => setEditingBook({...editingBook, availableQuantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingBook(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const TransportModule: React.FC = () => (
  <div className="space-y-6 animate-fadeIn pb-12">
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        <Bus className="w-7 h-7 text-ivory-orange" />
        <span>Transport Scolaire & Géolocalisation Bus</span>
      </h1>
      <p className="text-xs text-slate-400">Circuits de ramassage scolaire (Riviera, Angré, Deux Plateaux, Koumassi)</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Circuit Ligne 1 — Riviera & Palmeraie</h3>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">En Route (GPS Actif)</span>
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <div>Véhicule: Car Hyundai 32 Places (Immatriculation 8492-CI-01)</div>
          <div>Chauffeur: M. Mamadou SANOGO (+225 07 48 99 00 11)</div>
          <div>Élèves à bord: 28 / 32</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Circuit Ligne 2 — Angré & 8ème Tranche</h3>
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Arrivé à l'École</span>
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <div>Véhicule: Bus Isuzu 45 Places (Immatriculation 1290-CI-01)</div>
          <div>Chauffeur: M. Jean-Claude ADOU (+225 05 05 11 22 33)</div>
          <div>Élèves à bord: 42 / 45</div>
        </div>
      </div>
    </div>
  </div>
);

export const CafeteriaModule: React.FC = () => (
  <div className="space-y-6 animate-fadeIn pb-12">
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        <Utensils className="w-7 h-7 text-emerald-500" />
        <span>Cantine Scolaire & Menus Équilibrés</span>
      </h1>
      <p className="text-xs text-slate-400">Planning des repas du jour et abonnements cantine</p>
    </div>

    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Menu du Jour — Jeudi 23 Juillet 2026</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-1">
          <div className="font-bold text-slate-400 uppercase text-[10px]">Entrée</div>
          <div className="font-bold text-slate-900 dark:text-white">Salade Composée Royale & Œufs</div>
        </div>
        <div className="bg-brand-50 dark:bg-brand-950/40 p-4 rounded-xl space-y-1 border border-brand-200">
          <div className="font-bold text-brand-700 uppercase text-[10px]">Plat Principal</div>
          <div className="font-bold text-brand-900 dark:text-brand-200 text-sm">Riz au Gras Ivoirien & Poulet Rôti</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-1">
          <div className="font-bold text-slate-400 uppercase text-[10px]">Dessert</div>
          <div className="font-bold text-slate-900 dark:text-white">Fruits de Saison (Ananas / Mangue)</div>
        </div>
      </div>
    </div>
  </div>
);
