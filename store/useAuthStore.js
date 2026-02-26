import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      email: null,
      isLoggedIn: false,
      
      
      login: (email, userData) => set({ 
        email, 
        user: userData, 
        isLoggedIn: true 
      }),
      
      logout: () => set({ 
        email: null, 
        user: null, 
        isLoggedIn: false 
      }),
      
      updateUser: (userData) => set((state) => ({ 
        user: { ...state.user, ...userData } 
      })),
      
      checkAuth: () => {
        const storedEmail = sessionStorage.getItem('email');
        const storedUser = sessionStorage.getItem('user');
        
        if (storedEmail && storedUser) {
          set({
            email: storedEmail,
            user: JSON.parse(storedUser),
            isLoggedIn: true
          });
          return true;
        }
        return false;
      }
    }),
    {
      name: 'auth-storage', 
      getStorage: () => sessionStorage, 
    }
  )
);

export default useAuthStore;