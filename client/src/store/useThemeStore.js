import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'night-owl', // 'night-owl' or 'day-walker'
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'day-walker') {
          document.documentElement.classList.add('day-walker');
        } else {
          document.documentElement.classList.remove('day-walker');
        }
      },
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'night-owl' ? 'day-walker' : 'night-owl';
        if (newTheme === 'day-walker') {
          document.documentElement.classList.add('day-walker');
        } else {
          document.documentElement.classList.remove('day-walker');
        }
        return { theme: newTheme };
      }),
      initTheme: () => {
        const { theme } = useThemeStore.getState();
        if (theme === 'day-walker') {
          document.documentElement.classList.add('day-walker');
        } else {
          document.documentElement.classList.remove('day-walker');
        }
      }
    }),
    {
      name: 'micollab-theme',
    }
  )
);

export default useThemeStore;
