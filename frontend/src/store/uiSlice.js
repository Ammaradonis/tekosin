import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    language: localStorage.getItem('i18nextLng') || 'de',
    theme: 'dark',
    modalOpen: null,
    modalData: null
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    setLanguage: (state, action) => { state.language = action.payload; },
    openModal: (state, action) => { state.modalOpen = action.payload.type; state.modalData = action.payload.data || null; },
    closeModal: (state) => { state.modalOpen = null; state.modalData = null; }
  }
});

export const { toggleSidebar, setSidebarOpen, setLanguage, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
