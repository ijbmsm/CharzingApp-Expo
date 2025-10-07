import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  category: 'reservation' | 'report' | 'announcement' | 'marketing';
  isRead: boolean;
  createdAt: Date;
  data?: {
    reservationId?: string;
    reportId?: string;
    status?: string;
    type?: string;
  };
}

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<InAppNotification, 'id' | 'isRead' | 'createdAt'>>) => {
      const notification: InAppNotification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        isRead: false,
        createdAt: new Date(),
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
      
      // 최대 100개까지만 보관
      if (state.notifications.length > 100) {
        const removedNotification = state.notifications.pop();
        if (removedNotification && !removedNotification.isRead) {
          state.unreadCount -= 1;
        }
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    setNotifications: (state, action: PayloadAction<InAppNotification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  setNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;