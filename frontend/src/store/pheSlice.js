import { createSlice } from '@reduxjs/toolkit';

// Загрузка данных из localStorage
const loadState = () => {
  try {
    const saved = localStorage.getItem('pheCalculator');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Проверяем дату — если новый день, очищаем
      const today = new Date().toDateString();
      if (parsed.date !== today) {
        return { items: [], dailyLimit: parsed.dailyLimit || 300, date: today };
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading phe data:', e);
  }
  return { items: [], dailyLimit: 300, date: new Date().toDateString() };
};

const savedState = loadState();

const pheSlice = createSlice({
  name: 'phe',
  initialState: {
    items: savedState.items,
    dailyLimit: savedState.dailyLimit,
    date: savedState.date,
    isOpen: false,
  },
  reducers: {
    addPheItem: (state, action) => {
      const { name, proteinPer100g, weight } = action.payload;
      const phe = Math.round((proteinPer100g * weight / 100) * 50);
      
      state.items.push({
        id: Date.now(),
        name,
        weight,
        protein: parseFloat((proteinPer100g * weight / 100).toFixed(1)),
        phe,
      });
      
      saveToLocalStorage(state);
    },
    
    removePheItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      saveToLocalStorage(state);
    },
    
    clearPheItems: (state) => {
      state.items = [];
      saveToLocalStorage(state);
    },
    
    setDailyLimit: (state, action) => {
      state.dailyLimit = action.payload;
      saveToLocalStorage(state);
    },
    
    togglePheCalculator: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    openPheCalculator: (state) => {
      state.isOpen = true;
    },
    
    closePheCalculator: (state) => {
      state.isOpen = false;
    },
  },
});

// Сохранение в localStorage
function saveToLocalStorage(state) {
  try {
    localStorage.setItem('pheCalculator', JSON.stringify({
      items: state.items,
      dailyLimit: state.dailyLimit,
      date: state.date,
    }));
  } catch (e) {
    console.error('Error saving phe data:', e);
  }
}

export const {
  addPheItem,
  removePheItem,
  clearPheItems,
  setDailyLimit,
  togglePheCalculator,
  openPheCalculator,
  closePheCalculator,
} = pheSlice.actions;

export default pheSlice.reducer;