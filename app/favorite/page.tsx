'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '../component/layout/notif';
import * as XLSX from 'xlsx';

interface Favorite {
  _id?: string;
  favoriteId: string;
  email?: string;
  _displayName: string;
  _chargeAmount: number;
  _displayCharge: string;
  addedAt?: string;
  updatedAt?: string;
  note?:string;
}

function FavoritesPage() {
  const router = useRouter();
  const { 
    showToast,
    showDeleteAlert,
    showUpdateAlert

   } = useToast();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Favorite>>({});

  // LOAD FAVORITES FROM DATABASE
  useEffect(() => {
    const loadFavorites = async () => {
      const email = sessionStorage.getItem('email');

      if (!email) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/favorites?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setFavorites(data.favorites || []);
      } catch (error) {
        showToast('Failed to load favorites', 'error');
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [showToast]);

  
  const removeFavorite = async (favoriteId: string) => {
    const email = sessionStorage.getItem('email');
    if (!email) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, favoriteId }),
      });

      if (response.ok) {
        setFavorites(prev =>
          prev.filter(f => f.favoriteId !== favoriteId)
        );
        showDeleteAlert();
      } else {
        showToast('Failed to remove', 'error');
      }
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  
  const startEditing = (favorite: Favorite) => {
    setEditingId(favorite.favoriteId);
    setEditForm({ note: favorite.note || '' }); // Only initialize note field
  };

  
  const updateFavorite = async () => {
    const email = sessionStorage.getItem('email');
    if (!email || !editingId) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          favoriteId: editingId,
          updates: { note: editForm.note }, // Only send note updates
        }),
      });

      if (response.ok) {
        setFavorites(prev =>
          prev.map(f =>
            f.favoriteId === editingId
              ? { ...f, note: editForm.note } // Only update note field
              : f
          )
        );
        showUpdateAlert();
        setEditingId(null);
        setEditForm({});
      } else {
        showToast('Update failed', 'error');
      }
    } catch {
      showToast('Update failed', 'error');
    }
  };

  
  const exportToExcel = () => {
    const exportData = favorites.map(f => ({
      'Service Name': f._displayName,
      'Charge Amount': f._chargeAmount,
      'Formatted Charge': f._displayCharge,
      'Note': f.note || '', // Add note to export
      'Added At': f.addedAt
        ? new Date(f.addedAt).toLocaleDateString()
        : '',
      'Updated At': f.updatedAt
        ? new Date(f.updatedAt).toLocaleDateString()
        : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Favorites');
    XLSX.writeFile(wb, `favorites-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-gray-100">
      <div className="w-full max-w-[95%] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center">
          Your Favorites
        </h1>

        {favorites.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <button
              onClick={exportToExcel}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to Excel
            </button>
            <p className="text-sm sm:text-base text-gray-600">Total: {favorites.length} item{favorites.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-8 sm:py-10 md:py-12">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4">No favorites yet</p>
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm sm:text-base"
            >
              Go to Search
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {favorites.map(f => (
              <div
                key={f.favoriteId}
                className="border border-gray-200 p-3 sm:p-4 rounded-lg hover:shadow-md transition"
              >
                {editingId === f.favoriteId ? (
                  <div className="space-y-3">
                    {/* Only show note field for editing */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Note
                      </label>
                      <textarea
                        value={editForm.note || ''}
                        onChange={e =>
                          setEditForm({
                            ...editForm,
                            note: e.target.value,
                          })
                        }
                        className="border border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                        placeholder="Add a note (optional)"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={updateFavorite}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm sm:text-base"
                      >
                        Save Note
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                      <div className="flex-1 w-full sm:w-auto">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 break-words">
                          {f._displayName}
                        </h3>
                        <p className="text-green-600 text-base sm:text-lg md:text-xl font-bold mt-1">
                          {f._displayCharge}
                        </p>
                        {/* Display note if it exists */}
                        {f.note && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs sm:text-sm text-gray-600 italic break-words">
                              <span className="font-medium">Note:</span> {f.note}
                            </p>
                          </div>
                        )}
                        {f.addedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Added: {new Date(f.addedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row w-full sm:w-auto justify-end gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => startEditing(f)}
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-3 sm:py-1 rounded-lg transition text-xs sm:text-sm"
                        >
                          {f.note ? 'Edit Note' : 'Add Note'}
                        </button>
                        <button
                          onClick={() => removeFavorite(f.favoriteId)}
                          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-3 sm:py-1 rounded-lg transition text-xs sm:text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Favorites() {
  return (
    <ToastProvider>
      <FavoritesPage />
    </ToastProvider>
  );
}