import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to fetch dashboard' });
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    charts: null,
    recentActivity: [],
    crisisEvents: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.charts = action.payload.charts;
        state.recentActivity = action.payload.recentActivity;
        state.crisisEvents = action.payload.crisisEvents;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error;
      });
  }
});

export default dashboardSlice.reducer;
