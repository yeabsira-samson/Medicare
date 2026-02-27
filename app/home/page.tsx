'use client'
import { useState, useEffect } from "react";
import { ToastProvider, useToast } from "../component/layout/notif";
import { useAuth } from "../hooks/userAuth"; 

interface MedicareRow {
  [key: string]: any;
  _id?: string;
}

interface SearchResult {
  matchedProcedures: MedicareRow[];
}

function MedicareInfoContent() {
  const { 
    showEmptySearchAlert,
    showSuccessAlert,
    showNoMatchesAlert
  } = useToast();
  

  const { isLoggedIn } = useAuth();
  
  const [results, setResults] = useState<SearchResult>({ matchedProcedures: [] });
  const [favorites, setFavorites] = useState<MedicareRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Searching Medicare data...");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteAdded, setFavoriteAdded] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);

  useEffect(() => {
    const loadSavedState = async () => {
      await loadFavorites();
      
      try {
        const savedSearchTerm = sessionStorage.getItem('medicareSearchTerm');
        const savedResults = sessionStorage.getItem('medicareResults');
        const savedHasSearched = sessionStorage.getItem('medicareHasSearched');
        
        console.log('Loading from sessionStorage:', {
          savedSearchTerm,
          hasSavedResults: !!savedResults,
          savedHasSearched
        });
        
        if (savedSearchTerm) {
          setSearchTerm(savedSearchTerm);
        }
        
        if (savedResults) {
          try {
            const parsedResults = JSON.parse(savedResults);
            console.log('Setting results to:', parsedResults);
            setResults(parsedResults);
          } catch (e) {
            console.error("Error parsing saved results:", e);
          }
        }
        
        if (savedHasSearched) {
          setHasSearched(savedHasSearched === 'true');
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      } finally {
        setInitialLoadComplete(true);
      }
    };
    
    loadSavedState();
  }, []);

  useEffect(() => {
    if (initialLoadComplete) {
      if (searchTerm) {
        sessionStorage.setItem('medicareSearchTerm', searchTerm);
        console.log('Saved search term:', searchTerm);
      } else {
        sessionStorage.removeItem('medicareSearchTerm');
      }
    }
  }, [searchTerm, initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete) {
      if (results.matchedProcedures.length > 0) {
        try {
          sessionStorage.setItem('medicareResults', JSON.stringify(results));
          console.log('Saved results with', results.matchedProcedures.length, 'items');
        } catch (e) {
          console.error("Error saving results to sessionStorage:", e);
        }
      } else {
        sessionStorage.removeItem('medicareResults');
      }
    }
  }, [results, initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete) {
      sessionStorage.setItem('medicareHasSearched', String(hasSearched));
    }
  }, [hasSearched, initialLoadComplete]);

  useEffect(() => {
    if (searchTerm.trim() === '' && initialLoadComplete) {
      setResults({ matchedProcedures: [] });
      setHasSearched(false);
      setError(null);
    }
  }, [searchTerm, initialLoadComplete]);

  const loadFavorites = async () => {
    try {
      const saved = localStorage.getItem("favorites");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }

      const email = sessionStorage.getItem('email');
      if (email) {
        const response = await fetch(`/api/favorites?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites || []);
          localStorage.setItem("favorites", JSON.stringify(data.favorites || []));
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const saveFavorites = async (updatedFavorites: MedicareRow[]) => {
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    
    const email = sessionStorage.getItem('email');
    if (email) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            favorites: updatedFavorites 
          }),
        });
      } catch (error) {
        console.error("Error saving favorites to database:", error);
      }
    }
  };

  const searchProvider = async (): Promise<void> => {
    if (!searchTerm.trim()) {
      showEmptySearchAlert();
      return;
    }

    setLoading(true);
    setLoadingMessage("Searching Medicare data...");
    setError(null);
    setHasSearched(true);
    setFavoriteAdded(null);

    try {
      const response = await fetch(`/api/data?search=${encodeURIComponent(searchTerm.trim())}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        showNoMatchesAlert(searchTerm); 
        setResults({ matchedProcedures: [] });
        return;
      }

      setResults({ matchedProcedures: data });
    } catch (error) {
      console.error("Search failed:", error);
      setError(error instanceof Error ? error.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uniqueId = (row: MedicareRow): string => {
    if (row._id) return row._id.toString();
    return Object.values(row).slice(0, 3).join('-') || Math.random().toString();
  };

  const addFavorite = async (row: MedicareRow): Promise<void> => {
    if (!isLoggedIn) {
      alert('Please log in to add favorites');
      return;
    }

    const chargePrice = getAllowedChargesPerPerson(row);
    const rowWithPrice = {
      ...row,
      _displayCharge: chargePrice ? chargePrice.formatted : 'N/A',
      _displayName: getDisplayName(row),
      _chargeAmount: chargePrice ? chargePrice.amount : 0,
      addedAt: new Date().toISOString(),
      favoriteId: uniqueId(row) 
    };

    const isDuplicate = favorites.some(f => {
      if (row._id && f._id) return f._id.toString() === row._id.toString();
      return uniqueId(f) === uniqueId(row);
    });

    if (isDuplicate) {
      return;
    }

    const updatedFavorites = [...favorites, rowWithPrice];
    

    setFavorites(updatedFavorites);
    setFavoriteAdded(uniqueId(row));
    
    await saveFavorites(updatedFavorites);
    
    if (showSuccessAlert) {
      showSuccessAlert();
    }
  };

  const getDisplayName = (row: MedicareRow): string => {
    const nameFields = ['Type_of_Service ', 'Type of Service', 'Place of Service', 'Place_of_Service'];
    for (const field of nameFields) {
      if (row[field] && typeof row[field] === 'string' && row[field].trim() !== '') {
        return row[field].toString();
      }
    }
    const firstKey = Object.keys(row).find(k =>
      !k.includes('_id') &&
      !k.includes('BLANK') &&
      !k.includes('NOTE') &&
      !k.startsWith('metadata.') &&
      !k.includes('Amount') &&
      !k.includes('Payment') &&
      !k.includes('Charge') &&
      !k.includes('Count') &&
      row[k] &&
      typeof row[k] === 'string' &&
      row[k].length < 100 &&
      row[k].length > 3 &&
      !row[k].match(/^\d+$/)
    );
    return firstKey && row[firstKey] ? row[firstKey].toString() : 'Medicare Service';
  };

  const getAllowedChargesPerPerson = (row: MedicareRow): { amount: number; formatted: string } | null => {
    const chargeFields = ['Allowed_Charges_Per_Person', 'Allowed Charges Per Person', 'allowed_charges_per_person'];
    for (const field of chargeFields) {
      if (row[field] !== undefined && row[field] !== null) {
        let amount = row[field];
        if (typeof amount === 'string') amount = parseFloat(amount.replace(/[$,]/g, ''));
        if (typeof amount === 'number' && !isNaN(amount) && amount > 0) {
          return { amount, formatted: formatPrice(amount) };
        }
      }
    }
    return null;
  };

  const formatPrice = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const isFavorite = (row: MedicareRow): boolean => {
    return favorites.some(f => {
      if (row._id && f._id) return f._id.toString() === row._id.toString();
      return uniqueId(f) === uniqueId(row);
    });
  };

  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    

    if (value.trim() === '') {
      setResults({ matchedProcedures: [] });
      setHasSearched(false);
    }
  };

 
  const clearSearch = () => {
    setSearchTerm('');
    setResults({ matchedProcedures: [] });
    setHasSearched(false);
    setError(null);
    
  
    sessionStorage.removeItem('medicareSearchTerm');
    sessionStorage.removeItem('medicareResults');
    sessionStorage.removeItem('medicareHasSearched');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-0 py-0 sm:p-8">
      <div className="w-full sm:max-w-full mx-auto bg-white shadow-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 mt-10 lg:mt-0 ">    
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 px-2">
            Medicare Price & Payment Explorer
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2 px-2">
            Search by specialty,service or price range to see Medicare payment amounts
          </p>
        </div>

        <div className="space-y-4 item-center justify-center ">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 item-center justify-center relative">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by specialty,type of service or price range"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && searchProvider()}
                className="w-full px-4 py-3 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base pr-10"
                disabled={loading}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={searchProvider}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-600">{loadingMessage}</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-red-600">{error}</p>
          </div>
        )}

        {!loading && results.matchedProcedures.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600">
                Found {results.matchedProcedures.length} matching entr{results.matchedProcedures.length === 1 ? 'y' : 'ies'}
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
              {results.matchedProcedures.map((row: MedicareRow, i: number) => {
                const displayName = getDisplayName(row);
                const allowedCharges = getAllowedChargesPerPerson(row);
                const favoriteStatus = isFavorite(row);
                
                return (
                  <div 
                    key={row._id?.toString() || i} 
                    className="p-4 sm:p-5 bg-white rounded-xl hover:shadow-lg transition border border-gray-200 flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <h3 className="font-bold text-gray-800 text-base sm:text-lg md:text-xl">{displayName}</h3>
                      </div>
                      
                      {allowedCharges ? (
                        <div className="mb-4 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">Allowed Charges Per Person</p>
                          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-700 break-words">
                            {allowedCharges.formatted}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-500">No charge data available</p>
                        </div>
                      )}
                    </div>

                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => addFavorite(row)}
                        disabled={favoriteStatus || !isLoggedIn}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg transition whitespace-nowrap text-sm font-medium shadow-md hover:shadow-lg ${
                          favoriteStatus 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : !isLoggedIn
                              ? 'bg-gray-300 cursor-not-allowed opacity-70 border border-gray-400' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title={!isLoggedIn ? "Please log in to save favorites" : ""}
                      >
                        {!isLoggedIn 
                          ? 'Login to save' 
                          : favoriteStatus 
                            ? 'In Favorites' 
                            : 'Add to favorite'
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && hasSearched && results.matchedProcedures.length === 0 && !error && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">No matching results found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MedicareInfo() {
  return (
    <ToastProvider>
      <MedicareInfoContent />
    </ToastProvider>
  );
}