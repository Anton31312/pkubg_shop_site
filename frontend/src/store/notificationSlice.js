import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: []
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: action.payload.type || 'info', // success, error, warning, info
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        timestamp: new Date().toISOString()
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

// Thunk for auto-removing notifications
export const showNotification = (notification) => (dispatch) => {
  dispatch(addNotification(notification));
  
  if (notification.duration > 0) {
    setTimeout(() => {
      dispatch(removeNotification(notification.id));
    }, notification.duration);
  }
};

export default notificationSlice.reducer;