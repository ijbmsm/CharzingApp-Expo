import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  uid: string;
  email?: string | undefined;
  displayName?: string | undefined;
  realName?: string | undefined; // 실명
  photoURL?: string | undefined;
  kakaoId?: string; // 카카오 로그인용 (선택사항)
  googleId?: string; // Google 로그인용 (선택사항)
  appleId?: string; // Apple 로그인용 (선택사항)
  provider?: 'kakao' | 'google' | 'apple'; // 로그인 제공자 정보
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  autoLoginEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  autoLoginEnabled: false, // 기본값은 자동 로그인 비활성화 (임시)
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAutoLoginEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoLoginEnabled = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setUser, setLoading, setAutoLoginEnabled, updateUserProfile, logout } = authSlice.actions;
export default authSlice.reducer;