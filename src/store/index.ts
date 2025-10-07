import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';

// Persist configuration for auth slice (to preserve login state)
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['autoLoginEnabled', 'user', 'isAuthenticated'], // Persist login state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  notification: notificationReducer, // Don't persist notifications
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'auth/setUser', 
          'notification/addNotification', 
          'notification/setNotifications'
        ],
        ignoredPaths: ['auth.user', 'notification.notifications'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;