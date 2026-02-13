import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchMembers = createAsyncThunk('members/fetch', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/members', { params });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to fetch members' });
  }
});

export const fetchMemberStats = createAsyncThunk('members/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/members/stats');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to fetch stats' });
  }
});

export const createMember = createAsyncThunk('members/create', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/members', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to create member' });
  }
});

export const updateMember = createAsyncThunk('members/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/members/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to update member' });
  }
});

export const deleteMember = createAsyncThunk('members/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/members/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Failed to delete member' });
  }
});

const membersSlice = createSlice({
  name: 'members',
  initialState: {
    members: [],
    pagination: null,
    stats: null,
    selectedMember: null,
    loading: false,
    error: null
  },
  reducers: {
    setSelectedMember: (state, action) => { state.selectedMember = action.payload; },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => { state.loading = true; })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.members;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error;
      })
      .addCase(fetchMemberStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(createMember.fulfilled, (state, action) => {
        state.members.unshift(action.payload);
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        const idx = state.members.findIndex(m => m.id === action.payload.id);
        if (idx !== -1) state.members[idx] = action.payload;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m.id !== action.payload);
      });
  }
});

export const { setSelectedMember, clearError } = membersSlice.actions;
export default membersSlice.reducer;
