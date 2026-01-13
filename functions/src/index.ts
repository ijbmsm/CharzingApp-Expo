import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";
import { google } from "googleapis";
import * as Sentry from "@sentry/node";
import { v4 as uuidv4 } from "uuid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import {
  ExportReportImageRequest,
  ExportReportImageResponse,
} from "./types/export.types";

export { uploadVehiclesToFirestore } from "./uploadVehicles";
import { sendSMS, validateSMSConfig } from "./utils/naver-sens-sms";
import { generateUniqueReferralCode } from "./utils/referralCode";

// Firebase Admin 초기화 (중복 초기화 방지)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 🧪 디버그: 환경변수 로깅
console.log("🔧 Functions 환경 설정:", {
  NODE_ENV: process.env.NODE_ENV,
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  isDevMode: process.env.NODE_ENV === "development" || !!process.env.FIRESTORE_EMULATOR_HOST,
});

// Sentry 초기화 (프로덕션 환경에서만)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.1,
  });
  console.log("✅ Sentry initialized in Firebase Functions");
}

// CORS 설정 (프로덕션에서는 특정 도메인만 허용)
const corsHandler = cors({
  origin: [
    "http://localhost:8082", // Expo dev server
    "https://your-production-domain.com", // 실제 프로덕션 도메인
  ],
  credentials: true,
});

// Firestore 인스턴스
const db = admin.firestore();

/**
 * 카카오 로그인용 HTTP 함수 (인증 없이 호출 가능)
 */
export const kakaoLoginHttp = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    try {
      // Sentry: 함수 시작 추적
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Kakao login request started",
        level: "info",
      });

      // CORS 헤더 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      // OPTIONS 요청 처리 (CORS preflight)
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // POST 요청만 허용
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("🟡 Kakao Login HTTP 요청 받음");
      console.log("🔍 Request body:", req.body);

      const { kakaoAccessToken } = req.body;

      if (!kakaoAccessToken) {
        res.status(400).json({
          success: false,
          error: "카카오 액세스 토큰이 필요합니다.",
        });
        return;
      }

      // 🔒 보안 개선: 서버에서 직접 카카오 API로 사용자 정보 조회
      let userInfo;
      try {
        // 카카오 API를 통한 사용자 정보 조회 (/v2/user/me)
        const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${kakaoAccessToken}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          },
        });

        console.log("✅ 카카오 사용자 정보 조회 완료:", response.data);

        // 사용자 정보 추출
        const kakaoData = response.data;
        userInfo = {
          id: kakaoData.id.toString(),
          email: kakaoData.kakao_account?.email || undefined,
          nickname: kakaoData.kakao_account?.profile?.nickname || undefined,
          profileImageUrl:
            kakaoData.kakao_account?.profile?.profile_image_url || undefined,
        };

        console.log("📋 추출된 사용자 정보:", userInfo);
      } catch (error: any) {
        console.error(
          "❌ 카카오 사용자 정보 조회 실패:",
          error.response?.data || error.message
        );
        res.status(400).json({
          success: false,
          error:
            "카카오 액세스 토큰이 유효하지 않거나 사용자 정보를 가져올 수 없습니다.",
        });
        return;
      }

      // 🚀 성능 최적화: kakaoId와 email 쿼리를 병렬로 실행
      const [kakaoQuery, emailQuery] = await Promise.all([
        db
          .collection("users")
          .where("kakaoId", "==", userInfo.id)
          .limit(1)
          .get(),
        userInfo.email
          ? db
              .collection("users")
              .where("email", "==", userInfo.email)
              .limit(1)
              .get()
          : Promise.resolve({ empty: true, docs: [] }),
      ]);

      let firebaseUID;
      let isNewUser;

      if (!kakaoQuery.empty) {
        // 기존 카카오 사용자 발견
        firebaseUID = kakaoQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ 기존 카카오 사용자 발견:", firebaseUID);

        // 기존 사용자 정보 업데이트 (undefined 필드는 자동 제외됨)
        const updatePayload: Record<string, any> = {
          displayName:
            userInfo.nickname ||
            userInfo.email?.split("@")[0] ||
            "카카오 사용자",
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (userInfo.email) {
          updatePayload.email = userInfo.email;
        }

        if (userInfo.profileImageUrl) {
          updatePayload.photoURL = userInfo.profileImageUrl;
        }

        await db.collection("users").doc(firebaseUID).update(updatePayload);
        console.log("✅ 기존 카카오 사용자 정보 업데이트:", firebaseUID);
      } else if (!emailQuery.empty) {
        // 🚀 최적화: email로 기존 사용자 발견 (getUserByEmail 대신 Firestore 쿼리)
        firebaseUID = emailQuery.docs[0].id;
        isNewUser = false;
        console.log(
          "✅ 기존 이메일 사용자 발견 (Firestore 쿼리):",
          firebaseUID
        );

        // 기존 사용자에 카카오 정보 추가
        const updatePayload: Record<string, any> = {
          kakaoId: userInfo.id,
          displayName:
            userInfo.nickname || emailQuery.docs[0].data().displayName,
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          "providers.kakao": {
            id: userInfo.id,
            nickname: userInfo.nickname,
            profileImageUrl: userInfo.profileImageUrl || null, // providers 내부는 null 허용
            linkedAt: FieldValue.serverTimestamp(),
          },
        };

        if (userInfo.profileImageUrl) {
          updatePayload.photoURL = userInfo.profileImageUrl;
        }

        await db.collection("users").doc(firebaseUID).update(updatePayload);
        console.log(
          "✅ 기존 사용자에 카카오 정보 추가 완료 (Firestore 쿼리 사용)"
        );
      } else {
        // 완전히 새로운 사용자 - Firebase Auth 생성
        try {
          // photoURL과 email이 undefined이면 필드 제외
          const createUserPayload: {
            email?: string;
            displayName: string;
            photoURL?: string;
          } = {
            displayName:
              userInfo.nickname ||
              userInfo.email?.split("@")[0] ||
              "카카오 사용자",
          };

          if (userInfo.email) {
            createUserPayload.email = userInfo.email;
          }

          if (userInfo.profileImageUrl) {
            createUserPayload.photoURL = userInfo.profileImageUrl;
          }

          const userRecord = await admin.auth().createUser(createUserPayload);
          firebaseUID = userRecord.uid;
          isNewUser = true;

          console.log(
            "✅ 신규 카카오 사용자 생성 (Firebase Auth만, Firestore 문서는 SignupComplete에서 생성):",
            firebaseUID
          );
          console.log("🔄 클라이언트에서 SignupComplete 화면으로 이동 필요");
        } catch (createError: any) {
          if (
            createError.code === "auth/email-already-exists" &&
            userInfo.email
          ) {
            // Firebase Auth에는 있는데 Firestore에는 없는 경우 (드물지만 가능)
            console.log(
              "⚠️ Firebase Auth에만 존재하는 사용자, getUserByEmail로 찾기:",
              userInfo.email
            );
            const existingUserRecord = await admin
              .auth()
              .getUserByEmail(userInfo.email);
            firebaseUID = existingUserRecord.uid;
            isNewUser = true; // Firestore 문서가 없으므로 신규로 처리
            console.log("📧 Firebase Auth 사용자 UID:", firebaseUID);
          } else {
            throw createError;
          }
        }
      }

      // Firebase Custom Token 생성
      console.log(
        "🔥 Kakao Custom Token 생성 중... Firebase UID:",
        firebaseUID
      );

      const customClaims = {
        provider: "kakao",
        kakaoId: userInfo.id,
        email: userInfo.email || null,
        displayName:
          userInfo.nickname || userInfo.email?.split("@")[0] || "카카오 사용자",
        isVerified: true,
        role: "user",
        canCreateReservation: true,
        tokenVersion: Date.now(),
      };

      const customToken = await admin
        .auth()
        .createCustomToken(firebaseUID, customClaims);
      console.log("✅ Kakao Custom Token 생성 완료 (강화된 claims 포함)");

      // Sentry: 성공 로깅
      Sentry.captureMessage("Kakao login successful", {
        level: "info",
        tags: {
          function: "kakaoLoginHttp",
          provider: "kakao",
          userType: isNewUser ? "new" : "existing",
        },
        contexts: {
          user: {
            id: firebaseUID,
            email: userInfo.email || "no-email",
          },
        },
      });

      // 응답
      res.status(200).json({
        success: true,
        customToken,
        userInfo: {
          id: firebaseUID,
          email: userInfo.email,
          displayName:
            userInfo.nickname ||
            userInfo.email?.split("@")[0] ||
            "카카오 사용자",
          photoURL: userInfo.profileImageUrl,
        },
        isExistingUser: !isNewUser,
      });
    } catch (error: any) {
      console.error("❌ Kakao Login 실패:", error);

      // Sentry에 에러 로그 전송
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: {
            function: "kakaoLoginHttp",
            provider: "kakao",
          },
          extra: {
            errorMessage: error.message,
            errorCode: error.code,
            requestBody: req.body,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: "카카오 로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

/**
 * 카카오 로그인용 Callable 함수 (기존 호환성)
 */
export const kakaoLogin = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    try {
      console.log("🟡 Kakao Login Callable 요청 받음");

      const { kakaoAccessToken, userInfo } = data;
      if (!kakaoAccessToken || !userInfo) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "카카오 액세스 토큰과 사용자 정보가 필요합니다."
        );
      }

      // HTTP 함수로 리다이렉트
      const axios = require("axios");
      const response = await axios.post(
        "https://asia-northeast3-charzing-d1600.cloudfunctions.net/kakaoLoginHttp",
        { kakaoAccessToken, userInfo },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Kakao Login Callable 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "카카오 로그인 처리 중 오류가 발생했습니다."
      );
    }
  });

/**
 * Google 로그인용 HTTP 함수 (앱/웹 공통)
 */
export const googleLoginHttp = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    try {
      // Sentry: 함수 시작 추적
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Google login request started",
        level: "info",
      });

      // CORS 헤더 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      // OPTIONS 요청 처리 (CORS preflight)
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // POST 요청만 허용
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("🟢 Google Login HTTP 요청 받음");
      console.log("🔍 Request body:", req.body);

      const { googleIdToken } = req.body;

      if (!googleIdToken) {
        res.status(400).json({
          success: false,
          error: "Google ID Token이 필요합니다.",
        });
        return;
      }

      // 🔒 보안 개선: 서버에서 직접 Google ID Token 검증
      let userInfo;
      try {
        const OAuth2 = google.auth.OAuth2;
        const client = new OAuth2();

        // Google Web Client ID (Firebase Console > 프로젝트 설정 > 일반 > 웹 앱에서 확인)
        const GOOGLE_WEB_CLIENT_ID =
          "91035459357-0ulua3kp7eje2bmjd76mceml113el8gd.apps.googleusercontent.com";

        const ticket = await client.verifyIdToken({
          idToken: googleIdToken,
          audience: GOOGLE_WEB_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Invalid Google ID Token");
        }

        console.log("✅ Google ID Token 검증 완료:", payload.email);

        // 사용자 정보 추출
        userInfo = {
          id: payload.sub, // Google User ID
          email: payload.email || undefined,
          name: payload.name || undefined,
          picture: payload.picture || undefined,
        };

        console.log("📋 추출된 사용자 정보:", userInfo);
      } catch (error: any) {
        console.error("❌ Google ID Token 검증 실패:", error.message);
        res.status(400).json({
          success: false,
          error:
            "Google ID Token이 유효하지 않거나 사용자 정보를 가져올 수 없습니다.",
        });
        return;
      }

      // 🚀 성능 최적화: googleId와 email 쿼리를 병렬로 실행
      const [googleQuery, emailQuery] = await Promise.all([
        db
          .collection("users")
          .where("googleId", "==", userInfo.id)
          .limit(1)
          .get(),
        userInfo.email
          ? db
              .collection("users")
              .where("email", "==", userInfo.email)
              .limit(1)
              .get()
          : Promise.resolve({ empty: true, docs: [] }),
      ]);

      let firebaseUID;
      let isNewUser;

      if (!googleQuery.empty) {
        // 기존 Google 사용자 발견
        firebaseUID = googleQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ 기존 Google 사용자 발견:", firebaseUID);

        // 기존 사용자 정보 업데이트 (undefined 필드는 자동 제외됨)
        const updatePayload: Record<string, any> = {
          displayName:
            userInfo.name || userInfo.email?.split("@")[0] || "Google 사용자",
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (userInfo.email) {
          updatePayload.email = userInfo.email;
        }

        if (userInfo.picture) {
          updatePayload.photoURL = userInfo.picture;
        }

        await db.collection("users").doc(firebaseUID).update(updatePayload);
        console.log("✅ 기존 Google 사용자 정보 업데이트:", firebaseUID);
      } else if (!emailQuery.empty) {
        // 🚀 최적화: email로 기존 사용자 발견 (getUserByEmail 대신 Firestore 쿼리)
        firebaseUID = emailQuery.docs[0].id;
        isNewUser = false;
        console.log(
          "✅ 기존 이메일 사용자 발견 (Firestore 쿼리):",
          firebaseUID
        );

        // 기존 사용자에 Google 정보 추가
        const updatePayload: Record<string, any> = {
          googleId: userInfo.id,
          displayName: userInfo.name || emailQuery.docs[0].data().displayName,
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          "providers.google": {
            id: userInfo.id,
            name: userInfo.name,
            picture: userInfo.picture || null, // providers 내부는 null 허용
            linkedAt: FieldValue.serverTimestamp(),
          },
        };

        if (userInfo.picture) {
          updatePayload.photoURL = userInfo.picture;
        }

        await db.collection("users").doc(firebaseUID).update(updatePayload);
        console.log(
          "✅ 기존 사용자에 Google 정보 추가 완료 (Firestore 쿼리 사용)"
        );
      } else {
        // 완전히 새로운 사용자 - Firebase Auth 생성
        try {
          // photoURL과 email이 undefined이면 필드 제외
          const createUserPayload: {
            email?: string;
            displayName: string;
            photoURL?: string;
          } = {
            displayName:
              userInfo.name || userInfo.email?.split("@")[0] || "Google 사용자",
          };

          if (userInfo.email) {
            createUserPayload.email = userInfo.email;
          }

          if (userInfo.picture) {
            createUserPayload.photoURL = userInfo.picture;
          }

          const userRecord = await admin.auth().createUser(createUserPayload);
          firebaseUID = userRecord.uid;
          isNewUser = true;

          console.log(
            "✅ 신규 Google 사용자 생성 (Firebase Auth만, Firestore 문서는 SignupComplete에서 생성):",
            firebaseUID
          );
          console.log("🔄 클라이언트에서 SignupComplete 화면으로 이동 필요");
        } catch (createError: any) {
          if (
            createError.code === "auth/email-already-exists" &&
            userInfo.email
          ) {
            // Firebase Auth에는 있는데 Firestore에는 없는 경우 (드물지만 가능)
            console.log(
              "⚠️ Firebase Auth에만 존재하는 사용자, getUserByEmail로 찾기:",
              userInfo.email
            );
            const existingUserRecord = await admin
              .auth()
              .getUserByEmail(userInfo.email);
            firebaseUID = existingUserRecord.uid;
            isNewUser = true; // Firestore 문서가 없으므로 신규로 처리
            console.log("📧 Firebase Auth 사용자 UID:", firebaseUID);
          } else {
            throw createError;
          }
        }
      }

      // Firebase Custom Token 생성
      console.log(
        "🔥 Google Custom Token 생성 중... Firebase UID:",
        firebaseUID
      );

      const customClaims = {
        provider: "google",
        googleId: userInfo.id,
        email: userInfo.email || null,
        displayName:
          userInfo.name || userInfo.email?.split("@")[0] || "Google 사용자",
        isVerified: true,
        role: "user",
        canCreateReservation: true,
        tokenVersion: Date.now(),
      };

      const customToken = await admin
        .auth()
        .createCustomToken(firebaseUID, customClaims);
      console.log("✅ Google Custom Token 생성 완료 (강화된 claims 포함)");

      // Sentry: 성공 로깅
      Sentry.captureMessage("Google login successful", {
        level: "info",
        tags: {
          function: "googleLoginHttp",
          provider: "google",
          userType: isNewUser ? "new" : "existing",
        },
        contexts: {
          user: {
            id: firebaseUID,
            email: userInfo.email || "no-email",
          },
        },
      });

      // 응답
      res.status(200).json({
        success: true,
        customToken,
        userInfo: {
          id: firebaseUID,
          email: userInfo.email,
          displayName:
            userInfo.name || userInfo.email?.split("@")[0] || "Google 사용자",
          photoURL: userInfo.picture,
        },
        isExistingUser: !isNewUser,
      });
    } catch (error: any) {
      console.error("❌ Google Login 실패:", error);

      // Sentry에 에러 로그 전송
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: {
            function: "googleLoginHttp",
            provider: "google",
          },
          extra: {
            errorMessage: error.message,
            errorCode: error.code,
            requestBody: req.body,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: "Google 로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

/**
 * 웹 전용 카카오 로그인 (Authorization Code 기반)
 * 웹에서 인가 코드를 받아서 서버에서 토큰 교환 수행
 */
export const kakaoLoginWebHttp = functions
  .region("asia-northeast3")
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
    minInstances: 1,
  })
  .https.onRequest(async (req, res) => {
    try {
      // CORS 헤더 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("🌐 [WEB] Kakao Login 요청 받음");

      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        res.status(400).json({
          success: false,
          error: "code와 redirectUri가 필요합니다.",
        });
        return;
      }

      // 1. 인가 코드로 액세스 토큰 받기 (서버에서 수행)
      const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
      const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

      if (!KAKAO_REST_API_KEY) {
        console.error("❌ Kakao REST API Key가 설정되지 않았습니다.");
        res.status(500).json({
          success: false,
          error: "서버 설정 오류",
        });
        return;
      }

      if (!KAKAO_CLIENT_SECRET) {
        console.error("❌ Kakao Client Secret이 설정되지 않았습니다.");
        res.status(500).json({
          success: false,
          error: "서버 설정 오류",
        });
        return;
      }

      let kakaoAccessToken;
      try {
        const tokenResponse = await axios.post(
          "https://kauth.kakao.com/oauth/token",
          new URLSearchParams({
            grant_type: "authorization_code",
            client_id: KAKAO_REST_API_KEY,
            client_secret: KAKAO_CLIENT_SECRET,
            redirect_uri: redirectUri,
            code: code,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        kakaoAccessToken = tokenResponse.data.access_token;
        console.log("✅ [WEB] 카카오 액세스 토큰 받기 성공");
      } catch (error: unknown) {
        console.error("❌ [WEB] 카카오 토큰 교환 실패:", error);
        res.status(400).json({
          success: false,
          error: "카카오 토큰 교환 실패",
        });
        return;
      }

      // 2. 액세스 토큰으로 사용자 정보 조회 (기존 로직 재사용)
      let userInfo;
      try {
        const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${kakaoAccessToken}`,
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
          },
        });

        const kakaoData = response.data;
        userInfo = {
          id: kakaoData.id.toString(),
          email: kakaoData.kakao_account?.email || undefined,
          nickname: kakaoData.kakao_account?.profile?.nickname || undefined,
          profileImageUrl:
            kakaoData.kakao_account?.profile?.profile_image_url || undefined,
        };

        console.log("✅ [WEB] 카카오 사용자 정보 조회 완료:", userInfo);
      } catch (error: unknown) {
        console.error("❌ [WEB] 카카오 사용자 정보 조회 실패:", error);
        res.status(400).json({
          success: false,
          error: "카카오 사용자 정보 조회 실패",
        });
        return;
      }

      // 3. Firestore에서 사용자 찾기 (기존 로직과 동일)
      const [kakaoQuery, emailQuery] = await Promise.all([
        db
          .collection("users")
          .where("kakaoId", "==", userInfo.id)
          .limit(1)
          .get(),
        userInfo.email
          ? db
              .collection("users")
              .where("email", "==", userInfo.email)
              .limit(1)
              .get()
          : Promise.resolve({ empty: true, docs: [] }),
      ]);

      let firebaseUID;
      let isNewUser;

      if (!kakaoQuery.empty) {
        firebaseUID = kakaoQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ [WEB] 기존 카카오 사용자:", firebaseUID);
      } else if (!emailQuery.empty) {
        firebaseUID = emailQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ [WEB] 이메일로 기존 사용자 발견:", firebaseUID);

        await db.collection("users").doc(firebaseUID).update({
          kakaoId: userInfo.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        firebaseUID = db.collection("users").doc().id;
        isNewUser = true;
        console.log("✅ [WEB] 신규 사용자 UID 생성:", firebaseUID);

        // 신규 사용자: 추천 코드 생성 및 기본 문서 생성
        try {
          const referralCode = await generateUniqueReferralCode();
          console.log(`✅ [WEB] 추천 코드 생성: ${referralCode}`);

          // users 문서 생성 (기본 정보만)
          await db
            .collection("users")
            .doc(firebaseUID)
            .set({
              uid: firebaseUID,
              provider: "kakao",
              kakaoId: userInfo.id,
              email: userInfo.email || null,
              referralCode,
              isRegistrationComplete: false,
              isActive: false,
              createdAt: FieldValue.serverTimestamp(),
            });

          // referralCodes 컬렉션에도 문서 생성
          await db.collection("referralCodes").doc(referralCode).set({
            code: referralCode,
            ownerUserId: firebaseUID,
            ownerType: "user",
            status: "inactive",
            createdAt: FieldValue.serverTimestamp(),
          });

          console.log("✅ [WEB] 신규 사용자 문서 생성 완료");
        } catch (error) {
          console.error("❌ [WEB] 신규 사용자 생성 실패:", error);
          res.status(500).json({
            success: false,
            error: "사용자 생성 중 오류가 발생했습니다.",
          });
          return;
        }
      }

      // 4. Custom Token 생성 (기존 로직과 동일)
      const customToken = await admin.auth().createCustomToken(firebaseUID, {
        provider: "kakao",
        kakaoId: userInfo.id,
        role: "user",
        canCreateReservation: false,
        tokenVersion: 1,
      });

      console.log("✅ [WEB] Custom Token 생성 완료");

      res.json({
        success: true,
        customToken,
        userInfo,
        isExistingUser: !isNewUser,
      });
    } catch (error: unknown) {
      console.error("❌ [WEB] Kakao 로그인 처리 오류:", error);
      res.status(500).json({
        success: false,
        error: "로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

/**
 * 웹 전용 구글 로그인 (Authorization Code 기반)
 * 웹에서 인가 코드를 받아서 서버에서 토큰 교환 수행
 */
export const googleLoginWebHttp = functions
  .region("asia-northeast3")
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
    minInstances: 1,
  })
  .https.onRequest(async (req, res) => {
    try {
      // CORS 헤더 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("🌐 [WEB] Google Login 요청 받음");

      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        res.status(400).json({
          success: false,
          error: "code와 redirectUri가 필요합니다.",
        });
        return;
      }

      // 1. 인가 코드로 ID Token 받기 (서버에서 수행)
      const GOOGLE_CLIENT_ID =
        "91035459357-0ulua3kp7eje2bmjd76mceml113el8gd.apps.googleusercontent.com";
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

      if (!GOOGLE_CLIENT_SECRET) {
        console.error("❌ Google Client Secret이 설정되지 않았습니다.");
        res.status(500).json({
          success: false,
          error: "서버 설정 오류",
        });
        return;
      }

      let googleIdToken;
      try {
        const tokenResponse = await axios.post(
          "https://oauth2.googleapis.com/token",
          new URLSearchParams({
            code: code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        googleIdToken = tokenResponse.data.id_token;
        console.log("✅ [WEB] 구글 ID Token 받기 성공");
      } catch (error: unknown) {
        console.error("❌ [WEB] 구글 토큰 교환 실패:", error);
        res.status(400).json({
          success: false,
          error: "구글 토큰 교환 실패",
        });
        return;
      }

      // 2. ID Token 검증 (기존 로직과 동일)
      let userInfo;
      try {
        const OAuth2 = google.auth.OAuth2;
        const client = new OAuth2();

        const ticket = await client.verifyIdToken({
          idToken: googleIdToken,
          audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Invalid Google ID Token");
        }

        userInfo = {
          id: payload.sub,
          email: payload.email || undefined,
          name: payload.name || undefined,
          picture: payload.picture || undefined,
        };

        console.log("✅ [WEB] 구글 사용자 정보 검증 완료:", userInfo);
      } catch (error: unknown) {
        console.error("❌ [WEB] 구글 ID Token 검증 실패:", error);
        res.status(400).json({
          success: false,
          error: "구글 ID Token 검증 실패",
        });
        return;
      }

      // 3. Firestore에서 사용자 찾기 (기존 로직과 동일)
      const [googleQuery, emailQuery] = await Promise.all([
        db
          .collection("users")
          .where("googleId", "==", userInfo.id)
          .limit(1)
          .get(),
        userInfo.email
          ? db
              .collection("users")
              .where("email", "==", userInfo.email)
              .limit(1)
              .get()
          : Promise.resolve({ empty: true, docs: [] }),
      ]);

      let firebaseUID;
      let isNewUser;

      if (!googleQuery.empty) {
        firebaseUID = googleQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ [WEB] 기존 구글 사용자:", firebaseUID);
      } else if (!emailQuery.empty) {
        firebaseUID = emailQuery.docs[0].id;
        isNewUser = false;
        console.log("✅ [WEB] 이메일로 기존 사용자 발견:", firebaseUID);

        await db.collection("users").doc(firebaseUID).update({
          googleId: userInfo.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        firebaseUID = db.collection("users").doc().id;
        isNewUser = true;
        console.log("✅ [WEB] 신규 사용자 UID 생성:", firebaseUID);

        // 신규 사용자: 추천 코드 생성 및 기본 문서 생성
        try {
          const referralCode = await generateUniqueReferralCode();
          console.log(`✅ [WEB] 추천 코드 생성: ${referralCode}`);

          // users 문서 생성 (기본 정보만)
          await db
            .collection("users")
            .doc(firebaseUID)
            .set({
              uid: firebaseUID,
              provider: "google",
              googleId: userInfo.id,
              email: userInfo.email || null,
              referralCode,
              isRegistrationComplete: false,
              isActive: false,
              createdAt: FieldValue.serverTimestamp(),
            });

          // referralCodes 컬렉션에도 문서 생성
          await db.collection("referralCodes").doc(referralCode).set({
            code: referralCode,
            ownerUserId: firebaseUID,
            ownerType: "user",
            status: "inactive",
            createdAt: FieldValue.serverTimestamp(),
          });

          console.log("✅ [WEB] 신규 사용자 문서 생성 완료");
        } catch (error) {
          console.error("❌ [WEB] 신규 사용자 생성 실패:", error);
          res.status(500).json({
            success: false,
            error: "사용자 생성 중 오류가 발생했습니다.",
          });
          return;
        }
      }

      // 4. Custom Token 생성 (기존 로직과 동일)
      const customToken = await admin.auth().createCustomToken(firebaseUID, {
        provider: "google",
        googleId: userInfo.id,
        role: "user",
        canCreateReservation: false,
        tokenVersion: 1,
      });

      console.log("✅ [WEB] Custom Token 생성 완료");

      res.json({
        success: true,
        customToken,
        userInfo,
        isExistingUser: !isNewUser,
      });
    } catch (error: unknown) {
      console.error("❌ [WEB] Google 로그인 처리 오류:", error);
      res.status(500).json({
        success: false,
        error: "로그인 처리 중 오류가 발생했습니다.",
      });
    }
  });

/**
 * 카카오 로그인을 위한 Firebase 커스텀 토큰 생성 (기존 함수 - 호환성 유지)
 * @deprecated 새로운 kakaoLogin 함수를 사용하세요
 */
export const createKakaoCustomToken = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      const { kakaoId, email, displayName, photoURL } = data;

      // 입력 데이터 검증
      if (!kakaoId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "카카오 ID가 필요합니다."
        );
      }

      // 카카오 ID를 기반으로 고유한 UID 생성
      const uid = `kakao_${kakaoId}`;

      // 사용자 정보 설정
      const userRecord = {
        uid,
        email: email || undefined,
        displayName: displayName || "카카오 사용자",
        photoURL: photoURL || undefined,
        emailVerified: false,
        disabled: false,
      };

      // Firebase Auth에서 사용자 확인/생성
      let user;
      try {
        user = await admin.auth().getUser(uid);
        // 기존 사용자 정보 업데이트
        user = await admin.auth().updateUser(uid, {
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
        });
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // 신규 사용자 생성
          user = await admin.auth().createUser(userRecord);
        } else {
          throw error;
        }
      }

      // 커스텀 토큰 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "kakao",
        kakaoId: kakaoId,
        email: email,
        displayName: displayName,
      });

      // Firestore에 사용자 정보 저장/업데이트 (선택사항)
      try {
        await db
          .collection("users")
          .doc(uid)
          .set(
            {
              uid,
              email: email || null,
              displayName: displayName || "카카오 사용자",
              photoURL: photoURL || null,
              provider: "kakao",
              kakaoId: kakaoId,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      } catch (firestoreError) {
        console.warn("Firestore 사용자 정보 저장 실패:", firestoreError);
        // Firestore 저장 실패는 치명적이지 않으므로 계속 진행
      }

      return {
        success: true,
        customToken,
        uid: user.uid,
        isNewUser:
          !user.metadata?.creationTime ||
          user.metadata.creationTime === user.metadata.lastSignInTime,
        message: "카카오 커스텀 토큰 생성 성공",
      };
    } catch (error: any) {
      console.error("카카오 커스텀 토큰 생성 실패:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "카카오 로그인 처리 중 오류가 발생했습니다.",
        error.message
      );
    }
  });

/**
 * 사용자 프로필 업데이트 (웹과 앱 공통)
 */
export const updateUserProfile = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      const { displayName, phoneNumber, address, isRegistrationComplete } =
        data;

      console.log("👤 사용자 프로필 업데이트:", uid);

      // Firestore 업데이트
      await db
        .collection("users")
        .doc(uid)
        .update({
          displayName,
          phoneNumber,
          address,
          isRegistrationComplete: isRegistrationComplete || true,
          updatedAt: FieldValue.serverTimestamp(),
        });

      console.log("✅ 프로필 업데이트 완료:", uid);

      return { success: true };
    } catch (error) {
      console.error("❌ 프로필 업데이트 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "프로필 업데이트에 실패했습니다."
      );
    }
  });

/**
 * Google 로그인용 Custom Token 생성
 */
export const googleLogin = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    try {
      // Sentry: 함수 시작 추적
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Google login request started",
        level: "info",
      });

      console.log("🔍 Google Login 요청 받음");

      const { idToken, userInfo } = data;

      if (!idToken || !userInfo) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Google ID Token과 사용자 정보가 필요합니다."
        );
      }

      // Google ID Token 검증
      const OAuth2 = google.auth.OAuth2;
      const client = new OAuth2();

      try {
        // Google Web Client ID (Firebase Console > 프로젝트 설정 > 일반 > 웹 앱에서 확인)
        const GOOGLE_WEB_CLIENT_ID =
          "91035459357-0ulua3kp7eje2bmjd76mceml113el8gd.apps.googleusercontent.com";

        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: GOOGLE_WEB_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Invalid Google ID Token");
        }

        console.log("✅ Google ID Token 검증 완료:", payload.email);
      } catch (error) {
        console.error("❌ Google ID Token 검증 실패:", error);
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Google ID Token이 유효하지 않습니다."
        );
      }

      // Firebase UID 생성 (Google ID 기반)
      const firebaseUID = `google_${userInfo.id}`;
      const userDocRef = db.collection("users").doc(firebaseUID);
      const userDoc = await userDocRef.get();
      const isNewUser = !userDoc.exists;

      console.log(
        "🔍 사용자 존재 여부:",
        isNewUser ? "신규 사용자" : "기존 사용자",
        "UID:",
        firebaseUID
      );

      // 기존 사용자만 Firestore 업데이트 (신규 사용자는 SignupComplete에서 생성)
      const userData = {
        googleId: userInfo.id,
        email: userInfo.email,
        displayName:
          userInfo.name || userInfo.email?.split("@")[0] || "Google 사용자",
        photoURL: userInfo.photo,
        provider: "google",
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!isNewUser) {
        await userDocRef.update(userData);
        console.log("✅ 기존 Google 사용자 정보 업데이트:", firebaseUID);
      } else {
        console.log(
          "✅ 신규 Google 사용자 (Firebase Auth만, Firestore 문서는 SignupComplete에서 생성):",
          firebaseUID
        );
        console.log("🔄 클라이언트에서 SignupComplete 화면으로 이동 필요");
      }

      // Firebase Custom Token 생성
      console.log(
        "🔥 Google Custom Token 생성 중... Firebase UID:",
        firebaseUID
      );

      const customClaims = {
        provider: "google",
        googleId: userInfo.id,
        email: userInfo.email || null,
        displayName: userData.displayName,
        isVerified: true,
        role: "user",
        canCreateReservation: true,
        tokenVersion: Date.now(),
      };

      const customToken = await admin
        .auth()
        .createCustomToken(firebaseUID, customClaims);
      console.log("✅ Google Custom Token 생성 완료 (강화된 claims 포함)");

      // Sentry: 성공 로깅
      Sentry.captureMessage("Google login successful", {
        level: "info",
        tags: {
          function: "googleLogin",
          provider: "google",
          userType: isNewUser ? "new" : "existing",
        },
        contexts: {
          user: {
            id: firebaseUID,
            email: userInfo.email || "no-email",
          },
        },
      });

      // 응답
      return {
        success: true,
        customToken,
        userInfo: {
          id: firebaseUID,
          email: userInfo.email,
          displayName: userData.displayName,
          photoURL: userInfo.photo,
        },
        isExistingUser: !isNewUser,
      };
    } catch (error: any) {
      console.error("❌ Google Login 실패:", error);

      // Sentry: 에러 로깅
      Sentry.captureException(error, {
        tags: {
          function: "googleLogin",
          provider: "google",
        },
        extra: {
          errorMessage: error.message,
          errorCode: error.code,
        },
      });

      throw new functions.https.HttpsError(
        "internal",
        "Google 로그인 처리 중 오류가 발생했습니다."
      );
    }
  });

/**
 * Apple 로그인용 Custom Token 생성
 */
export const createCustomTokenFromApple = functions
  .region("asia-northeast3")
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Sentry: 함수 시작 추적
        Sentry.addBreadcrumb({
          category: "auth",
          message: "Apple login request started",
          level: "info",
        });

        console.log("🍎 Apple Custom Token 생성 요청 받음");

        if (req.method !== "POST") {
          res.status(405).json({ success: false, error: "Method not allowed" });
          return;
        }

        const { appleUser } = req.body;

        if (!appleUser || !appleUser.uid) {
          res.status(400).json({
            success: false,
            error: "Apple 사용자 정보가 필요합니다.",
          });
          return;
        }

        const firebaseUID = appleUser.uid; // 클라이언트에서 실제 Firebase UID 전달받음
        const userInfo = {
          id: firebaseUID,
          email: appleUser.email || null,
          displayName: appleUser.displayName || "Apple 사용자",
          photoURL: appleUser.photoURL || null,
        };

        console.log("✅ 실제 Firebase UID 받음:", firebaseUID);

        // Firebase UID로 사용자 문서 참조 (실제 Firebase UID 사용)
        const userDocRef = db.collection("users").doc(firebaseUID);
        const userDoc = await userDocRef.get();

        let isNewUser = !userDoc.exists;

        console.log(
          "🔍 사용자 존재 여부:",
          isNewUser ? "신규 사용자" : "기존 사용자",
          "UID:",
          firebaseUID
        );

        // 기존 사용자만 Firestore 업데이트 (신규 사용자는 SignupComplete에서 생성)
        if (!isNewUser) {
          const userData = {
            appleId: firebaseUID,
            email: userInfo.email,
            displayName: userInfo.displayName,
            photoURL: userInfo.photoURL,
            provider: "apple",
            lastLoginAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          await userDocRef.update(userData);
          console.log("✅ 기존 Apple 사용자 정보 업데이트:", firebaseUID);
        } else {
          console.log(
            "✅ 신규 Apple 사용자 (Firebase Auth만, Firestore 문서는 SignupComplete에서 생성):",
            firebaseUID
          );
          console.log("🔄 클라이언트에서 SignupComplete 화면으로 이동 필요");
        }

        // Firebase Custom Token 생성 (실제 Firebase UID 사용)
        console.log(
          "🔥 Apple Custom Token 생성 중... Firebase UID:",
          firebaseUID
        );

        const customClaims = {
          provider: "apple",
          appleId: firebaseUID, // Firebase UID 사용
          email: userInfo.email || null,
          displayName: userInfo.displayName,
          isVerified: true,
          role: "user",
          canCreateReservation: true,
          tokenVersion: Date.now(),
        };

        const customToken = await admin
          .auth()
          .createCustomToken(firebaseUID, customClaims);
        console.log("✅ Apple Custom Token 생성 완료 (강화된 claims 포함)");

        // Sentry: 성공 로깅
        Sentry.captureMessage("Apple login successful", {
          level: "info",
          tags: {
            function: "createCustomTokenFromApple",
            provider: "apple",
            userType: isNewUser ? "new" : "existing",
          },
          contexts: {
            user: {
              id: firebaseUID,
              email: userInfo.email || "no-email",
            },
          },
        });

        // 응답
        res.status(200).json({
          success: true,
          customToken,
          userInfo,
          isNewUser,
        });
      } catch (error: any) {
        console.error("❌ Apple Custom Token 생성 실패:", error);

        // Sentry: 에러 로깅
        Sentry.captureException(error, {
          tags: {
            function: "createCustomTokenFromApple",
            provider: "apple",
          },
          extra: {
            errorMessage: error.message,
          },
        });

        res.status(500).json({
          success: false,
          error: "서버 오류가 발생했습니다.",
        });
      }
    });
  });

/**
 * 회원탈퇴 (웹과 앱 공통)
 */
export const deleteUserAccount = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      console.log("🔴 회원탈퇴 처리 시작:", uid);

      // 1. Firestore에서 사용자 데이터 삭제
      await db.collection("users").doc(uid).delete();
      console.log("✅ Firestore 사용자 데이터 삭제 완료");

      // 2. Firebase Auth에서 사용자 삭제
      await admin.auth().deleteUser(uid);
      console.log("✅ Firebase Auth 사용자 삭제 완료");

      // 3. 추가로 삭제할 데이터가 있다면 여기서 처리
      // 예: 사용자가 작성한 게시글, 댓글 등

      console.log("✅ 회원탈퇴 처리 완료:", uid);

      return { success: true };
    } catch (error) {
      console.error("❌ 회원탈퇴 처리 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "회원탈퇴 처리에 실패했습니다."
      );
    }
  });

/**
 * 사용자 정보 조회 (웹과 앱 공통)
 */
export const getUserProfile = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      console.log("👤 사용자 정보 조회:", uid);

      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "사용자 정보를 찾을 수 없습니다."
        );
      }

      const userData = userDoc.data();
      console.log("✅ 사용자 정보 조회 완료");

      return {
        success: true,
        user: {
          uid,
          ...userData,
          // 민감한 정보는 제외
          createdAt: userData?.createdAt?.toDate?.()?.toISOString(),
          updatedAt: userData?.updatedAt?.toDate?.()?.toISOString(),
          lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ 사용자 정보 조회 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "사용자 정보 조회에 실패했습니다."
      );
    }
  });

// ======= 진단 예약 관련 Functions =======

/**
 * 진단 예약 생성 (서버사이드 검증 포함)
 */
export const createDiagnosisReservation = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Sentry: 함수 시작 추적
        Sentry.addBreadcrumb({
          category: "reservation",
          message: "Create diagnosis reservation request started",
          level: "info",
        });

        console.log("🔍 진단 예약 생성 요청 받음 (HTTP)");

        if (req.method !== "POST") {
          res.status(405).json({ success: false, error: "Method not allowed" });
          return;
        }

        // 🔥 Guest User 로직: 토큰이 있으면 인증, 없으면 Guest 생성
        const token = req.headers.authorization?.replace("Bearer ", "");
        let uid: string;

        if (token) {
          // ✅ 인증된 사용자
          try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            uid = decodedToken.uid;
            console.log("✅ 인증된 사용자:", uid);
            console.log("🔐 토큰 claims:", decodedToken);
          } catch (authError) {
            console.error("❌ 인증 실패:", authError);
            res.status(401).json({
              success: false,
              error: "유효하지 않은 인증 토큰입니다.",
            });
            return;
          }
        } else {
          // ✅ Guest 사용자 - UUID 기반 Guest UID 생성
          const { userName, userPhone } = req.body;

          if (!userName || !userPhone) {
            res.status(400).json({
              success: false,
              error: "Guest 사용자는 이름과 전화번호가 필요합니다.",
            });
            return;
          }

          uid = `guest_${uuidv4()}`;
          console.log("👤 Guest 사용자 생성:", uid);

          // Guest user 문서 생성
          await db
            .collection("users")
            .doc(uid)
            .set({
              uid: uid,
              displayName: userName,
              phoneNumber: userPhone,
              phoneNumberNormalized: userPhone.replace(/[^0-9]/g, ""), // 숫자만
              isGuest: true,
              provider: "email",
              isRegistrationComplete: false,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });

          console.log("✅ Guest user 문서 생성 완료:", uid);
        }

        const {
          address,
          detailAddress,
          latitude,
          longitude,
          requestedDate,
          notes,
          serviceType,
          servicePrice,
          vehicleBrand,
          vehicleModel,
          vehicleYear,
          userName,
          userPhone,
          status, // 🔥 클라이언트에서 보낸 status 받기
          paymentStatus, // 🔥 클라이언트에서 보낸 paymentStatus 받기
        } = req.body;

        console.log("📅 진단 예약 생성 요청:", uid);

        // 데이터 검증
        if (!address || !latitude || !longitude || !requestedDate) {
          res.status(400).json({
            success: false,
            error: "필수 정보가 누락되었습니다.",
          });
          return;
        }

        // 예약 시간 검증
        const requestedDateTime = new Date(requestedDate);
        const now = new Date();

        if (requestedDateTime <= now) {
          res.status(400).json({
            success: false,
            error: "예약 시간은 현재 시간 이후여야 합니다.",
          });
          return;
        }

        // 사용자 정보 조회
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
          res.status(404).json({
            success: false,
            error: "사용자 정보를 찾을 수 없습니다.",
          });
          return;
        }

        const userData = userDoc.data();

        // 예약 데이터 생성
        const reservationData = {
          userId: uid,
          userName: userName || userData?.displayName || "사용자",
          userPhone: userPhone || userData?.phoneNumber || null,
          address,
          detailAddress: detailAddress || "",
          latitude: Number(latitude),
          longitude: Number(longitude),
          status: status || "pending", // 🔥 클라이언트에서 보낸 status 사용
          paymentStatus: paymentStatus || null, // 🔥 paymentStatus 추가
          requestedDate: Timestamp.fromDate(requestedDateTime),
          estimatedDuration: "약 30분",
          serviceType: serviceType || "방문 배터리 진단 및 상담",
          servicePrice: servicePrice || 100000,
          vehicleBrand: vehicleBrand || "",
          vehicleModel: vehicleModel || "",
          vehicleYear: vehicleYear || "",
          notes: notes || "",
          adminNotes: "",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Firestore에 저장
        const reservationRef = await db
          .collection("diagnosisReservations")
          .add(reservationData);

        console.log("✅ 진단 예약 생성 완료:", reservationRef.id);

        // Sentry: 성공 로깅
        Sentry.captureMessage("Diagnosis reservation created successfully", {
          level: "info",
          tags: {
            function: "createDiagnosisReservation",
            category: "reservation",
          },
          contexts: {
            reservation: {
              id: reservationRef.id,
              userId: uid,
              vehicleBrand,
              vehicleModel,
              serviceType,
            },
          },
        });

        res.status(200).json({
          success: true,
          reservationId: reservationRef.id,
          message: "진단 예약이 성공적으로 생성되었습니다.",
        });
      } catch (error: any) {
        console.error("❌ 진단 예약 생성 실패:", error);

        // Sentry: 에러 로깅
        Sentry.captureException(error, {
          tags: {
            function: "createDiagnosisReservation",
            category: "reservation",
          },
          extra: {
            errorMessage: error.message,
          },
        });

        res.status(500).json({
          success: false,
          error: "서버 오류가 발생했습니다.",
        });
      }
    });
  });

/**
 * 사용자 진단 예약 목록 조회
 */
export const getUserDiagnosisReservations = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") {
          res.status(405).json({ success: false, error: "Method not allowed" });
          return;
        }

        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
          res
            .status(401)
            .json({ success: false, error: "인증 토큰이 필요합니다." });
          return;
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        console.log("📋 사용자 예약 목록 조회:", uid);

        const reservationsSnapshot = await db
          .collection("diagnosisReservations")
          .where("userId", "==", uid)
          .orderBy("createdAt", "desc")
          .get();

        const reservations = reservationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          requestedDate: doc.data().requestedDate?.toDate?.()?.toISOString(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
        }));

        console.log(`✅ 예약 목록 조회 완료: ${reservations.length}건`);

        res.status(200).json({
          success: true,
          reservations,
        });
      } catch (error) {
        console.error("❌ 예약 목록 조회 실패:", error);
        res.status(500).json({
          success: false,
          error: "예약 목록 조회에 실패했습니다.",
        });
      }
    });
  });

// ======= 사용자 차량 관리 Functions =======

/**
 * 사용자 차량 추가 (서버사이드 검증)
 */
export const addUserVehicle = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      const { make, model, year, batteryCapacity, range, nickname } = data;

      console.log("🚗 사용자 차량 추가:", uid);

      // 데이터 검증
      if (!make || !model || !year) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "차량 정보(제조사, 모델명, 연식)가 누락되었습니다."
        );
      }

      // 기존 활성 차량 비활성화
      const batch = db.batch();

      const existingVehicles = await db
        .collection("userVehicles")
        .where("userId", "==", uid)
        .where("isActive", "==", true)
        .get();

      existingVehicles.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isActive: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      // 새 차량 추가
      const vehicleData = {
        userId: uid,
        make,
        model,
        year: parseInt(year.toString()),
        batteryCapacity: batteryCapacity || null,
        range: range || null,
        nickname: nickname || null,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const newVehicleRef = db.collection("userVehicles").doc();
      batch.set(newVehicleRef, vehicleData);

      await batch.commit();
      console.log("✅ 사용자 차량 추가 완료:", newVehicleRef.id);

      return {
        success: true,
        vehicleId: newVehicleRef.id,
        message: "차량이 성공적으로 등록되었습니다.",
      };
    } catch (error) {
      console.error("❌ 사용자 차량 추가 실패:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "차량 등록 중 오류가 발생했습니다."
      );
    }
  });

/**
 * 사용자 차량 목록 조회
 */
export const getUserVehicles = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      console.log("사용자 차량 목록 조회:", uid);

      const vehiclesSnapshot = await db
        .collection("userVehicles")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      const vehicles = vehiclesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));

      console.log(`차량 목록 조회 완료: ${vehicles.length}대`);

      return {
        success: true,
        vehicles,
      };
    } catch (error) {
      console.error("차량 목록 조회 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "차량 목록 조회에 실패했습니다."
      );
    }
  });

// ======= 푸시 알림 시스템 =======

/**
 * 푸시 알림 전송 (관리자용)
 */
export const sendPushNotification = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      console.log("푸시 알림 전송 요청");

      const { userIds, title, body, data: notificationData } = data;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.log("유효하지 않은 사용자 목록");
        throw new functions.https.HttpsError(
          "invalid-argument",
          "받을 사용자 ID 목록이 필요합니다."
        );
      }

      if (!title || !body) {
        console.log("유효하지 않은 제목/내용");
        throw new functions.https.HttpsError(
          "invalid-argument",
          "알림 제목과 내용이 필요합니다."
        );
      }

      console.log(`${userIds.length}명의 사용자에게 알림 전송`);
      console.log("알림 전송:", title);

      const results = [];

      for (const userId of userIds) {
        try {
          // 사용자의 푸시 토큰 및 알림 설정 조회
          const userDoc = await db.collection("users").doc(userId).get();

          if (!userDoc.exists) {
            results.push({ userId, success: false, error: "User not found" });
            continue;
          }

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;

          // 알림 설정 확인
          const notificationSettingsDoc = await db
            .collection("users")
            .doc(userId)
            .collection("notificationSettings")
            .doc("settings")
            .get();
          const notificationSettings = notificationSettingsDoc.exists
            ? notificationSettingsDoc.data() || {}
            : { enabled: true }; // 기본값: 활성화

          // 전체 알림이 비활성화된 경우 건너뛰기
          if (notificationSettings.enabled === false) {
            console.log(
              `사용자 ${userId}는 전체 알림이 비활성화됨, 전송 건너뛰기`
            );
            results.push({
              userId,
              success: false,
              error: "Notifications disabled by user",
            });
            continue;
          }

          // 카테고리별 알림 설정 확인
          const category = notificationData?.category || "announcement";
          if (notificationSettings[category] === false) {
            console.log(
              `사용자 ${userId}는 ${category} 알림이 비활성화됨, 전송 건너뛰기`
            );
            results.push({
              userId,
              success: false,
              error: `${category} notifications disabled by user`,
            });
            continue;
          }

          let pushSuccess = false;
          let pushError = null;

          // 1. 푸시 토큰이 있으면 푸시 알림 전송
          if (pushToken) {
            try {
              const message = {
                to: pushToken,
                sound: "default",
                title,
                body,
                data: notificationData || {},
              };

              const response = await axios.post(
                "https://exp.host/--/api/v2/push/send",
                message,
                {
                  headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                  },
                }
              );

              pushSuccess = true;

              // 푸시 알림 로그 저장
              await db.collection("notificationLogs").add({
                userId,
                pushToken,
                title,
                body,
                data: notificationData || {},
                response: response.data,
                sentAt: FieldValue.serverTimestamp(),
                status: "sent",
              });
            } catch (pushErr) {
              console.error(`푸시 알림 전송 실패: ${userId}`, pushErr);
              pushError =
                pushErr instanceof Error
                  ? pushErr.message
                  : "푸시 알림 전송 실패";
            }
          }

          // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
          try {
            const inAppNotification = {
              title,
              body,
              category: notificationData?.category || "announcement",
              data: notificationData || {},
              isRead: false,
              createdAt: FieldValue.serverTimestamp(),
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            // 사용자의 inAppNotifications 컬렉션에 저장
            await db
              .collection("users")
              .doc(userId)
              .collection("inAppNotifications")
              .add(inAppNotification);

            results.push({
              userId,
              success: true,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: true,
              pushError: pushError,
            });
          } catch (inAppError) {
            console.error(`인앱 알림 저장 실패: ${userId}`, inAppError);
            const errorMessage =
              inAppError instanceof Error
                ? inAppError.message
                : "인앱 알림 저장 실패";

            results.push({
              userId,
              success: false,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: false,
              error: errorMessage,
              pushError: pushError,
            });
          }
        } catch (error) {
          console.error(`푸시 알림 전송 실패: ${userId}`);
          results.push({
            userId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log("전송 완료");

      return {
        success: true,
        results,
        message: `${results.length}명에게 알림 전송 시도 완료`,
      };
    } catch (error) {
      console.error("푸시 알림 전송 실패:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "푸시 알림 전송 중 오류가 발생했습니다."
      );
    }
  });

/**
 * 푸시 알림을 받을 수 있는 사용자 목록 조회 (관리자용)
 */
export const getUsersWithPushTokens = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      console.log("사용자 목록 조회");

      // 푸시 토큰이 있는 사용자만 조회
      const usersQuery = await db
        .collection("users")
        .where("pushToken", "!=", null)
        .orderBy("updatedAt", "desc")
        .limit(100)
        .get();

      const users = usersQuery.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          displayName: data.displayName || "이름 없음",
          email: data.email || "",
          provider: data.provider || "unknown",
          hasPushToken: !!data.pushToken,
          pushTokenPreview: data.pushToken
            ? `${data.pushToken.substring(0, 20)}...`
            : null,
          lastUpdated:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        };
      });

      console.log(`사용자 ${users.length}명 조회 완료`);

      return {
        success: true,
        users,
        totalCount: users.length,
        message: `푸시 토큰이 있는 사용자 ${users.length}명`,
      };
    } catch (error) {
      console.error("사용자 목록 조회 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "사용자 목록 조회 중 오류가 발생했습니다."
      );
    }
  });

/**
 * 예약 상태 변경 시 자동 푸시 알림
 */
export const sendReservationStatusNotification = functions
  .region("asia-northeast3") // ⭐ 중복 알림 방지: 단일 리전만 사용
  .firestore.document("diagnosisReservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // 상태가 변경된 경우에만 알림 전송
      if (beforeData.status === afterData.status) {
        return;
      }

      // Sentry: 함수 시작 추적
      Sentry.addBreadcrumb({
        category: "notification",
        message: `Reservation status changed: ${beforeData.status} → ${afterData.status}`,
        level: "info",
      });

      console.log(`예약 상태 변경: ${beforeData.status} → ${afterData.status}`);

      const userId = afterData.userId;
      const reservationId = context.params.reservationId;

      // 사용자 푸시 토큰 및 알림 설정 조회
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.log(`사용자 문서 없음: ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData?.pushToken;

      // 알림 설정 확인
      const notificationSettingsDoc = await db
        .collection("users")
        .doc(userId)
        .collection("notificationSettings")
        .doc("settings")
        .get();
      const notificationSettings = notificationSettingsDoc.exists
        ? notificationSettingsDoc.data() || {}
        : { enabled: true, reservation: true }; // 기본값: 활성화

      // 전체 알림 또는 예약 알림이 비활성화된 경우 건너뛰기
      if (
        notificationSettings.enabled === false ||
        notificationSettings.reservation === false
      ) {
        console.log(
          `사용자 ${userId}는 예약 알림이 비활성화됨, 자동 알림 전송 건너뛰기`
        );
        return;
      }

      // 상태별 알림 메시지
      let title = "";
      let body = "";

      switch (afterData.status) {
        case "confirmed":
          title = "예약 확정 안내";
          body =
            "진단 예약이 확정되었습니다. 예정된 시간에 전문가가 방문할 예정입니다.";
          break;
        case "in_progress":
          title = "진단 시작 안내";
          body = "전기차 배터리 진단이 시작되었습니다.";
          break;
        case "completed":
          title = "진단 완료 안내";
          body = "배터리 진단이 완료되었습니다. 진단 리포트를 확인해보세요.";
          break;
        case "cancelled":
          title = "예약 취소 안내";
          body = "진단 예약이 취소되었습니다.";
          break;
        default:
          return; // 알림을 보내지 않는 상태
      }

      // 1. 푸시 토큰이 있으면 푸시 알림 전송
      if (pushToken) {
        try {
          const message = {
            to: pushToken,
            sound: "default",
            title,
            body,
            data: {
              type: "reservation_status_change",
              reservationId,
              status: afterData.status,
              category: "reservation",
            },
          };

          const response = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            message,
            {
              headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
              },
            }
          );

          console.log(`자동 푸시 알림 전송 성공: ${userId}`);

          // 푸시 알림 로그 저장
          await db.collection("notificationLogs").add({
            userId,
            pushToken,
            title,
            body,
            data: message.data,
            response: response.data,
            sentAt: FieldValue.serverTimestamp(),
            status: "sent",
            trigger: "reservation_status_change",
            reservationId,
          });
        } catch (pushErr) {
          console.error(`자동 푸시 알림 전송 실패: ${userId}`, pushErr);
        }
      } else {
        console.log(`사용자 ${userId}에게 푸시 토큰이 없음, 인앱 알림만 저장`);
      }

      // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
      try {
        const inAppNotification = {
          title,
          body,
          category: "reservation",
          data: {
            type: "reservation_status_change",
            reservationId,
            status: afterData.status,
          },
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // 사용자의 inAppNotifications 컬렉션에 저장
        await db
          .collection("users")
          .doc(userId)
          .collection("inAppNotifications")
          .add(inAppNotification);
        console.log(
          `사용자 ${userId}에게 자동 인앱 알림 저장 완료 (예약 상태 변경)`
        );

        // Sentry: 성공 로깅
        Sentry.captureMessage(
          "Reservation status notification sent successfully",
          {
            level: "info",
            tags: {
              function: "sendReservationStatusNotification",
              category: "notification",
              statusChange: `${beforeData.status} → ${afterData.status}`,
            },
            contexts: {
              reservation: {
                id: reservationId,
                userId,
                newStatus: afterData.status,
              },
            },
          }
        );
      } catch (inAppError) {
        console.error(`사용자 ${userId} 자동 인앱 알림 저장 실패:`, inAppError);
      }

      // 3. 예약 확정/취소 시 고객에게 SMS 발송
      if (
        afterData.status === "confirmed" ||
        afterData.status === "cancelled"
      ) {
        try {
          const customerPhone = afterData.userPhone;

          if (!customerPhone) {
            console.log(
              `고객 전화번호 없음, SMS 발송 건너뛰기: ${reservationId}`
            );
          } else {
            // SMS 환경 변수 검증
            const smsConfig = validateSMSConfig();

            // 예약 일시 포맷팅 (한국 시간 KST)
            let dateStr = "정보 없음";
            if (afterData.requestedDate) {
              const requestedDate = afterData.requestedDate.toDate();
              const kstFormatter = new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              const parts = kstFormatter.formatToParts(requestedDate);
              const year = parts.find((p) => p.type === "year")?.value;
              const month = parts.find((p) => p.type === "month")?.value;
              const day = parts.find((p) => p.type === "day")?.value;
              const weekday = parts.find((p) => p.type === "weekday")?.value;
              const hour = parts.find((p) => p.type === "hour")?.value;
              const minute = parts.find((p) => p.type === "minute")?.value;
              dateStr = `${year}-${month}-${day}(${weekday}) ${hour}:${minute}`;
            }

            // 장소
            const address = afterData.address || "정보 없음";

            // SMS 메시지 구성
            let smsMessage = "";
            if (afterData.status === "confirmed") {
              smsMessage = [
                "[차징] 예약 확정 안내",
                "고객님의 배터리 진단 예약이 확정되었습니다.",
                `일시: ${dateStr}`,
                `장소: ${address}`,
                "담당 진단사가 예정 시간에 방문합니다.",
              ].join("\n");
            } else if (afterData.status === "cancelled") {
              smsMessage = [
                "[차징] 예약 취소 안내",
                "배터리 진단 예약이 취소되었습니다.",
                `취소된 예약: ${dateStr}`,
                "감사합니다.",
              ].join("\n");
            }

            // SMS 발송
            await sendSMS(
              { to: customerPhone, content: smsMessage },
              smsConfig.serviceId,
              smsConfig.accessKey,
              smsConfig.secretKey,
              smsConfig.senderPhone
            );

            console.log(
              `✅ 고객 SMS 발송 완료 (${afterData.status}): ${reservationId} → ${customerPhone}`
            );

            // Sentry: SMS 발송 성공 로깅
            Sentry.addBreadcrumb({
              category: "sms",
              message: `Customer SMS sent for ${afterData.status}`,
              level: "info",
              data: { reservationId, status: afterData.status },
            });
          }
        } catch (smsError) {
          // SMS 발송 실패해도 예약 상태 변경에는 영향 없음
          console.error(
            `❌ 고객 SMS 발송 실패 (${afterData.status}):`,
            smsError
          );
          Sentry.captureException(smsError, {
            tags: {
              function: "sendReservationStatusNotification",
              category: "sms",
              status: afterData.status,
            },
            level: "warning",
          });
        }
      }
    } catch (error) {
      console.error("자동 푸시 알림 전송 실패:", error);

      // Sentry: 에러 로깅
      Sentry.captureException(error, {
        tags: {
          function: "sendReservationStatusNotification",
          category: "notification",
        },
        extra: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  });

/**
 * 진단 리포트 상태 변경 시 자동 알림 (published 상태로 변경 시)
 * - 푸시 알림
 * - 인앱 알림
 * - SMS 알림 (고객 전화번호로)
 */
export const sendReportPublishedNotification = functions
  .region("asia-northeast3") // ⭐ 중복 알림 방지: 단일 리전만 사용
  .firestore.document("vehicleDiagnosisReports/{reportId}")
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // pending_review → published 변경 시에만 알림 전송
      if (
        beforeData.status !== "pending_review" ||
        afterData.status !== "published"
      ) {
        return;
      }

      // Sentry: 함수 시작 추적
      Sentry.addBreadcrumb({
        category: "notification",
        message: `Report status changed: ${beforeData.status} → ${afterData.status}`,
        level: "info",
      });

      console.log(
        `리포트 상태 변경: ${beforeData.status} → ${afterData.status}`
      );

      const userId = afterData.userId;
      const reportId = context.params.reportId;
      const vehicleBrand = afterData.vehicleBrand || "";
      const vehicleName = afterData.vehicleName || "";

      // 사용자 푸시 토큰 및 알림 설정 조회
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.log(`사용자 문서 없음: ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData?.pushToken;

      // 알림 설정 확인
      const notificationSettingsDoc = await db
        .collection("users")
        .doc(userId)
        .collection("notificationSettings")
        .doc("settings")
        .get();
      const notificationSettings = notificationSettingsDoc.exists
        ? notificationSettingsDoc.data() || {}
        : { enabled: true, report: true }; // 기본값: 활성화

      // 전체 알림 또는 리포트 알림이 비활성화된 경우 건너뛰기
      if (
        notificationSettings.enabled === false ||
        notificationSettings.report === false
      ) {
        console.log(
          `사용자 ${userId}는 리포트 알림이 비활성화됨, 자동 알림 전송 건너뛰기`
        );
        return;
      }

      // 알림 메시지
      const title = "진단 리포트 발행 완료";
      const body = `${vehicleBrand} ${vehicleName} 진단 리포트가 발행되었습니다. 지금 확인해보세요!`;

      // 1. 푸시 토큰이 있으면 푸시 알림 전송
      if (pushToken) {
        try {
          const message = {
            to: pushToken,
            sound: "default",
            title,
            body,
            data: {
              type: "report_published",
              reportId,
              status: afterData.status,
              category: "report",
            },
          };

          const response = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            message,
            {
              headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
              },
            }
          );

          console.log(`자동 푸시 알림 전송 성공: ${userId}`);

          // 푸시 알림 로그 저장
          await db.collection("notificationLogs").add({
            userId,
            pushToken,
            title,
            body,
            data: message.data,
            response: response.data,
            sentAt: FieldValue.serverTimestamp(),
            status: "sent",
            trigger: "report_published",
            reportId,
          });
        } catch (pushErr) {
          console.error(`자동 푸시 알림 전송 실패: ${userId}`, pushErr);
        }
      } else {
        console.log(`사용자 ${userId}에게 푸시 토큰이 없음, 인앱 알림만 저장`);
      }

      // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
      try {
        const inAppNotification = {
          title,
          body,
          category: "report",
          data: {
            type: "report_published",
            reportId,
            status: afterData.status,
          },
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // 사용자의 inAppNotifications 컬렉션에 저장
        await db
          .collection("users")
          .doc(userId)
          .collection("inAppNotifications")
          .add(inAppNotification);
        console.log(
          `사용자 ${userId}에게 자동 인앱 알림 저장 완료 (리포트 발행)`
        );

        // Sentry: 성공 로깅
        Sentry.captureMessage(
          "Report published notification sent successfully",
          {
            level: "info",
            tags: {
              function: "sendReportPublishedNotification",
              category: "notification",
              statusChange: `${beforeData.status} → ${afterData.status}`,
            },
            contexts: {
              report: {
                id: reportId,
                userId,
                vehicleBrand,
                vehicleName,
                newStatus: afterData.status,
              },
            },
          }
        );
      } catch (inAppError) {
        console.error(`사용자 ${userId} 자동 인앱 알림 저장 실패:`, inAppError);
      }

      // 3. SMS 알림 발송 (고객 전화번호가 있는 경우)
      const customerPhone = afterData.userPhone || userData?.phoneNumber;
      const customerName = afterData.userName || userData?.realName || userData?.displayName || "고객";

      if (customerPhone) {
        try {
          const serviceId = process.env.NAVER_SENS_SERVICE_ID;
          const accessKey = process.env.NAVER_SENS_ACCESS_KEY;
          const secretKey = process.env.NAVER_SENS_SECRET_KEY;
          const senderPhone = process.env.NAVER_SENS_SENDER_PHONE;

          if (serviceId && accessKey && secretKey && senderPhone) {
            const baseUrl = "https://charzing.co.kr";
            const reportUrl = `${baseUrl}/mypage/reports/${reportId}`;
            const reviewUrl = `${baseUrl}/review/${reportId}`;

            const smsContent = `안녕하세요 ${customerName}님,
요청하신 배터리 진단이 완료되었습니다.

▶ 내 리포트 확인하기
${reportUrl}

진단 결과가 차량 구매 결정에 도움이 되셨길 바랍니다.

서비스가 만족스러우셨다면,
소중한 리뷰 부탁드립니다.

▶ 리뷰 작성하기
${reviewUrl}

감사합니다.
- 차징 드림`;

            const { sendSMS } = await import("./utils/naver-sens-sms");
            const smsResult = await sendSMS(
              {
                to: customerPhone.replace(/[^0-9]/g, ""),
                content: smsContent,
                subject: "[차징] 배터리 진단 리포트 안내",
              },
              serviceId,
              accessKey,
              secretKey,
              senderPhone
            );

            console.log(`SMS 발송 성공: ${userId}, requestId: ${smsResult.requestId}`);

            // SMS 발송 기록 저장
            await change.after.ref.update({
              smsNotification: {
                sent: true,
                sentAt: FieldValue.serverTimestamp(),
                requestId: smsResult.requestId,
              },
            });
          } else {
            console.warn("SMS 환경변수가 설정되지 않아 SMS 발송 건너뜀");
          }
        } catch (smsError) {
          console.error(`SMS 발송 실패: ${userId}`, smsError);

          // SMS 실패 기록 저장
          await change.after.ref.update({
            smsNotification: {
              sent: false,
              error: smsError instanceof Error ? smsError.message : "Unknown error",
              attemptedAt: FieldValue.serverTimestamp(),
            },
          });
        }
      } else {
        console.log(`사용자 ${userId}에게 전화번호가 없어 SMS 발송 건너뜀`);
      }
    } catch (error) {
      console.error("자동 알림 전송 실패:", error);

      // Sentry: 에러 로깅
      Sentry.captureException(error, {
        tags: {
          function: "sendReportPublishedNotification",
          category: "notification",
        },
        extra: {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  });

/**
 * 푸시 토큰 저장
 */
export const savePushToken = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const uid = context.auth.uid;
      const { pushToken } = data;

      if (!pushToken) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "푸시 토큰이 필요합니다."
        );
      }

      console.log(`푸시 토큰 저장: ${uid}`);

      // 사용자 문서에 푸시 토큰 저장
      await db.collection("users").doc(uid).update({
        pushToken,
        pushTokenUpdatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`푸시 토큰 저장 완료: ${uid}`);

      return {
        success: true,
        message: "푸시 토큰이 저장되었습니다.",
      };
    } catch (error) {
      console.error("푸시 토큰 저장 실패:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "푸시 토큰 저장 중 오류가 발생했습니다."
      );
    }
  });

// ===============================
// Admin Web용 HTTPS 엔드포인트들 (인증 없이 호출 가능)
// ===============================

/**
 * Admin Web용 푸시 알림 전송 (HTTPS 엔드포인트)
 */
export const sendPushNotificationAdmin = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      // CORS 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("관리자 알림 전송");

      const { userIds, title, body, data: notificationData } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.log("유효하지 않은 사용자 목록");
        res.status(400).json({
          success: false,
          error: "받을 사용자 ID 목록이 필요합니다.",
        });
        return;
      }

      if (!title || !body) {
        console.log("유효하지 않은 제목/내용");
        res.status(400).json({
          success: false,
          error: "제목과 내용이 필요합니다.",
        });
        return;
      }

      const results = [];
      let totalSuccess = 0;
      let totalFailure = 0;
      const errors = [];

      // 각 사용자별로 푸시 토큰 조회 및 전송
      for (const userId of userIds) {
        try {
          console.log(`사용자 ${userId}에게 푸시 알림 전송 시도`);

          const userDoc = await db.collection("users").doc(userId).get();
          if (!userDoc.exists) {
            console.log(`사용자 ${userId} 존재하지 않음`);
            errors.push(`사용자 ${userId}를 찾을 수 없습니다`);
            totalFailure++;
            continue;
          }

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;

          // 알림 설정 확인
          const notificationSettingsDoc = await db
            .collection("users")
            .doc(userId)
            .collection("notificationSettings")
            .doc("settings")
            .get();
          const notificationSettings = notificationSettingsDoc.exists
            ? notificationSettingsDoc.data() || {}
            : { enabled: true }; // 기본값: 활성화

          // 전체 알림이 비활성화된 경우 건너뛰기
          if (notificationSettings.enabled === false) {
            console.log(
              `사용자 ${userId}는 전체 알림이 비활성화됨, Admin 알림 전송 건너뛰기`
            );
            errors.push(`사용자 ${userId}: 알림이 비활성화됨`);
            totalFailure++;
            continue;
          }

          // 카테고리별 알림 설정 확인
          const category = notificationData?.category || "announcement";
          if (notificationSettings[category] === false) {
            console.log(
              `사용자 ${userId}는 ${category} 알림이 비활성화됨, Admin 알림 전송 건너뛰기`
            );
            errors.push(`사용자 ${userId}: ${category} 알림이 비활성화됨`);
            totalFailure++;
            continue;
          }

          let pushSuccess = false;
          let pushError = null;

          // 1. 푸시 토큰이 있으면 푸시 알림 전송
          if (pushToken) {
            try {
              const message = {
                to: pushToken,
                sound: "default",
                title: title,
                body: body,
                data: notificationData || {},
              };

              console.log(`Expo Push API 호출 중 (사용자: ${userId})`);

              const response = await axios.post(
                "https://exp.host/--/api/v2/push/send",
                message,
                {
                  headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log(
                `사용자 ${userId} 푸시 알림 전송 성공:`,
                response.data
              );
              pushSuccess = true;
            } catch (pushErr) {
              console.error(`사용자 ${userId} 푸시 알림 전송 실패:`, pushErr);
              pushError =
                pushErr instanceof Error
                  ? pushErr.message
                  : "푸시 알림 전송 실패";
            }
          } else {
            console.log(
              `사용자 ${userId}에게 푸시 토큰이 없음, 인앱 알림만 저장`
            );
          }

          // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
          try {
            const inAppNotification = {
              title,
              body,
              category: notificationData?.category || "announcement",
              data: notificationData || {},
              isRead: false,
              createdAt: FieldValue.serverTimestamp(),
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            // 사용자의 inAppNotifications 컬렉션에 저장
            await db
              .collection("users")
              .doc(userId)
              .collection("inAppNotifications")
              .add(inAppNotification);
            console.log(`사용자 ${userId}에게 인앱 알림 저장 완료`);

            totalSuccess++;
            results.push({
              userId,
              success: true,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: true,
              pushError: pushError,
            });
          } catch (inAppError) {
            console.error(`사용자 ${userId} 인앱 알림 저장 실패:`, inAppError);
            const errorMessage =
              inAppError instanceof Error
                ? inAppError.message
                : "인앱 알림 저장 실패";
            errors.push(`사용자 ${userId}: ${errorMessage}`);
            totalFailure++;

            results.push({
              userId,
              success: false,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: false,
              error: errorMessage,
              pushError: pushError,
            });
          }
        } catch (error) {
          console.error(`사용자 ${userId} 푸시 알림 전송 실패:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "알 수 없는 오류";
          errors.push(`사용자 ${userId}: ${errorMessage}`);
          totalFailure++;

          results.push({
            userId,
            success: false,
            error: errorMessage,
          });
        }
      }

      console.log(
        `푸시 알림 전송 완료 - 성공: ${totalSuccess}, 실패: ${totalFailure}`
      );

      res.json({
        success: true,
        successCount: totalSuccess,
        failureCount: totalFailure,
        errors: errors,
        results: results,
      });
    } catch (error) {
      console.error("Admin Web 푸시 알림 전송 실패:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  });

/**
 * Admin Web용 푸시 토큰 보유 사용자 목록 조회 (HTTPS 엔드포인트)
 */
export const getUsersWithPushTokensAdmin = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      // CORS 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      console.log("Admin Web 푸시 토큰이 있는 사용자 목록 조회");

      // 모든 사용자 조회 후 클라이언트에서 푸시 토큰 필터링 (인덱스 문제 해결)
      const usersQuery = await db.collection("users").limit(100).get();

      const users = usersQuery.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || "이름 없음",
            email: data.email || "",
            provider: data.provider || "unknown",
            hasPushToken: !!data.pushToken,
            pushTokenPreview: data.pushToken
              ? `${data.pushToken.substring(0, 20)}...`
              : null,
            lastUpdated:
              data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            _pushToken: data.pushToken, // 임시로 전체 토큰도 포함 (필터링용)
          };
        })
        .filter((user) => user._pushToken) // 푸시 토큰이 있는 사용자만 필터링
        .map((user) => {
          const { _pushToken, ...userWithoutToken } = user; // _pushToken 제거
          return userWithoutToken;
        });

      console.log(`사용자 ${users.length}명 조회 완료`);

      res.json({
        success: true,
        users: users,
        totalCount: users.length,
        message: `푸시 토큰이 있는 사용자 ${users.length}명`,
      });
    } catch (error) {
      console.error("Admin Web 사용자 목록 조회 실패:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  });

// ======= 차량 데이터 조회 Functions (Admin SDK 사용) =======

// 타입 정의
interface VehicleBattery {
  manufacturers: string[];
  capacity: string;
  warranty?: string;
  cellType?: string;
  variant: string;
}

interface VehicleSpecs {
  range?: string;
  powerMax?: string;
  torqueMax?: string;
  acceleration?: string;
  topSpeed?: string;
  driveType?: string;
  efficiency?: string;
  seats?: number;
}

interface VehicleTrimData {
  trimId: string;
  startYear: number;
  endYear?: number;
  battery: VehicleBattery;
  specs: VehicleSpecs;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface VehicleTrim {
  id: string;
  trimName: string;
  year: number;
  batteryCapacity: string | null;
  range: string | null;
  powerType: "BEV" | "PHEV" | "HEV" | "FCEV";
  drivetrain: "2WD" | "AWD" | "4WD";
  modelId: string;
  brandId: string;
  battery: VehicleBattery;
  specs: VehicleSpecs;
  startYear: number;
  endYear?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * 차량 트림 목록 조회 (새로운 nested 구조 사용)
 * 구조: /vehicles/{brandId}/models/{modelId}/trims/{trimId}/driveTypes/{driveTypeId}
 */
export const getVehicleTrims = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      // CORS 헤더 설정
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      console.log("🔍 차량 트림 목록 조회 요청 (단순 구조)");

      const { brandId, modelId } = req.body.data || req.body;

      if (!brandId || !modelId) {
        res.status(400).json({
          success: false,
          error: "brandId와 modelId가 필요합니다.",
        });
        return;
      }

      console.log(`📋 트림 조회: ${brandId}/${modelId}`);

      // 모델 문서 경로: /vehicles/{brandId}/models/{modelId}
      const modelDocRef = db
        .collection("vehicles")
        .doc(brandId)
        .collection("models")
        .doc(modelId);
      const modelDoc = await modelDocRef.get();

      if (!modelDoc.exists) {
        console.log(`❌ 모델 문서가 존재하지 않음: ${brandId}/${modelId}`);
        res.status(404).json({
          success: false,
          trims: [],
          message: "모델을 찾을 수 없습니다.",
        });
        return;
      }

      const modelData = modelDoc.data() as
        | {
            modelName?: string;
            trims?: Array<{
              trimId: string;
              trimName: string;
              driveType: string;
              years?: string[];
              batteryCapacity?: string;
            }>;
          }
        | undefined;

      if (!modelData) {
        console.log(`❌ 모델 데이터가 비어있음: ${brandId}/${modelId}`);
        res.status(404).json({
          success: false,
          trims: [],
          message: "모델 데이터를 찾을 수 없습니다.",
        });
        return;
      }

      console.log(`📄 모델 데이터:`, modelData);

      // 모델 문서 안의 trims 배열 사용
      const trimsArray = modelData.trims || [];
      console.log(`🔍 발견된 트림 수: ${trimsArray.length}`);

      const trims: Array<{
        trimId: string;
        trimName: string;
        driveType: string;
        years: string[];
        batteryCapacity: string;
        brandId: string;
        modelId: string;
        modelName: string;
      }> = [];

      // 각 트림 데이터 처리
      for (const trimData of trimsArray) {
        console.log(`📋 트림 처리 중:`, trimData);

        trims.push({
          trimId: trimData.trimId,
          trimName: trimData.trimName,
          driveType: trimData.driveType,
          years: trimData.years || [],
          batteryCapacity: trimData.batteryCapacity || "",
          brandId,
          modelId,
          modelName: modelData.modelName || modelId,
        });
      }

      // 트림명으로 정렬
      trims.sort((a, b) => a.trimName.localeCompare(b.trimName));

      console.log(
        `✅ 트림 조회 완료: ${brandId}/${modelId}, 총 ${trims.length}개 트림`
      );

      res.status(200).json({
        success: true,
        trims,
        totalCount: trims.length,
        message: `${trims.length}개 트림을 찾았습니다.`,
      });
      return;
    } catch (error) {
      console.error("❌ 차량 트림 조회 실패:", error);

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      res.status(500).json({
        success: false,
        error: "차량 트림 조회 중 오류가 발생했습니다.",
        details: errorMessage,
      });
      return;
    }
  });

/**
 * 브랜드 목록 조회 (새로운 nested 구조 사용)
 * 구조: /vehicles/{brandId}
 */
export const getBrands = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    try {
      console.log("🔍 브랜드 목록 조회 요청 (새로운 nested 구조)");

      // vehicles 컬렉션의 모든 문서 조회
      const vehiclesSnapshot = await db.collection("vehicles").get();
      console.log(`🔍 발견된 브랜드 수: ${vehiclesSnapshot.size}`);

      const brands: Array<{
        id: string;
        name: string;
        logoUrl?: string;
        modelsCount?: number;
      }> = [];

      for (const brandDoc of vehiclesSnapshot.docs) {
        const brandId = brandDoc.id;
        const brandData = brandDoc.data();

        try {
          // 각 브랜드의 모델 수 카운트
          const modelsSnapshot = await brandDoc.ref.collection("models").get();

          brands.push({
            id: brandId,
            name: brandData.brandName || brandId,
            logoUrl: brandData.logoUrl,
            modelsCount: modelsSnapshot.size,
          });

          console.log(
            `📋 브랜드 처리 완료: ${brandId} (${modelsSnapshot.size}개 모델)`
          );
        } catch (brandError) {
          console.error(`❌ 브랜드 처리 실패 (${brandId}):`, brandError);
        }
      }

      // 브랜드명으로 정렬
      brands.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ 브랜드 조회 완료: 총 ${brands.length}개 브랜드`);

      res.status(200).json({
        success: true,
        brands,
        totalCount: brands.length,
        message: `${brands.length}개 브랜드를 찾았습니다.`,
      });
      return;
    } catch (error) {
      console.error("❌ 브랜드 목록 조회 실패:", error);

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      res.status(500).json({
        success: false,
        error: "브랜드 목록 조회 중 오류가 발생했습니다.",
        details: errorMessage,
      });
      return;
    }
  });

/**
 * 모델 목록 조회 (새로운 nested 구조 사용)
 * 구조: /vehicles/{brandId}/models/{modelId}
 */
export const getModels = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      console.log("🔍 모델 목록 조회 요청 (새로운 nested 구조)");

      const { brandId } = req.body.data || req.body;

      if (!brandId) {
        res.status(400).json({
          success: false,
          error: "brandId가 필요합니다.",
        });
        return;
      }

      console.log(`📋 모델 조회: ${brandId}`);

      // 브랜드 문서 확인
      const brandDocRef = db.collection("vehicles").doc(brandId);
      const brandDoc = await brandDocRef.get();

      if (!brandDoc.exists) {
        console.log(`❌ 브랜드 문서가 존재하지 않음: ${brandId}`);
        res.status(404).json({
          success: false,
          models: [],
          message: "브랜드를 찾을 수 없습니다.",
        });
        return;
      }

      // 모델 컬렉션 조회: /vehicles/{brandId}/models
      const modelsSnapshot = await brandDocRef.collection("models").get();
      console.log(`🔍 발견된 모델 수: ${modelsSnapshot.size}`);

      const models: Array<{
        id: string;
        name: string;
        brandId: string;
        imageUrl?: string;
        trimsCount?: number;
        startYear?: number;
        endYear?: number;
      }> = [];

      for (const modelDoc of modelsSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();

        try {
          // 각 모델의 트림 수 카운트
          const trimsSnapshot = await modelDoc.ref.collection("trims").get();

          models.push({
            id: modelId,
            name: modelData.modelName || modelId,
            brandId: brandId,
            imageUrl: modelData.imageUrl,
            trimsCount: trimsSnapshot.size,
            startYear: modelData.startYear,
            endYear: modelData.endYear,
          });

          console.log(
            `📋 모델 처리 완료: ${modelId} (${trimsSnapshot.size}개 트림)`
          );
        } catch (modelError) {
          console.error(`❌ 모델 처리 실패 (${modelId}):`, modelError);
        }
      }

      // 모델명으로 정렬
      models.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ 모델 조회 완료: ${brandId}, 총 ${models.length}개 모델`);

      res.status(200).json({
        success: true,
        models,
        totalCount: models.length,
        message: `${models.length}개 모델을 찾았습니다.`,
      });
      return;
    } catch (error) {
      console.error("❌ 모델 목록 조회 실패:", error);

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      res.status(500).json({
        success: false,
        error: "모델 목록 조회 중 오류가 발생했습니다.",
        details: errorMessage,
      });
      return;
    }
  });

import {
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
} from "./types/functions.types";
import { PaymentDocument } from "./types/payment.types";
import {
  confirmPayment as confirmPaymentAPI,
  cancelPayment as cancelPaymentAPI,
} from "./utils/toss-api";
import {
  tossResponseToPaymentDocument,
  createCancelUpdateData,
} from "./utils/payment-mapper";

function validateConfig(): string {
  // NODE_ENV로 환경 구분: development = 테스트 키, production = 라이브 키
  const isDevelopment = process.env.NODE_ENV === "development";

  const secretKey = isDevelopment
    ? process.env.TOSS_SECRET_KEY_TEST
    : process.env.TOSS_SECRET_KEY_PROD;

  if (!secretKey) {
    const keyType = isDevelopment ? "TEST" : "PROD";
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Toss Secret Key (TOSS_SECRET_KEY_${keyType})가 설정되지 않았습니다.`
    );
  }

  // 키 형식 검증 (보안)
  const expectedPrefix = isDevelopment ? "test_" : "live_";
  if (!secretKey.startsWith(expectedPrefix)) {
    console.warn(
      `⚠️ ${isDevelopment ? "테스트" : "프로덕션"} 키가 ${expectedPrefix}로 시작하지 않습니다: ${secretKey.substring(0, 10)}...`
    );
  }

  console.log(
    `🔑 Toss Payment Mode: ${isDevelopment ? "TEST" : "PRODUCTION"} (${secretKey.substring(0, 10)}...)`
  );
  return secretKey;
}

export const confirmPaymentFunction = functions
  .region("asia-northeast3")
  .runWith({
    secrets: ["SENTRY_DSN"],
    minInstances: 1, // Cold start 제거 - 결제 핵심 플로우
  })
  .https.onCall(
    async (
      data: ConfirmPaymentRequest,
      context
    ): Promise<ConfirmPaymentResponse> => {
      // Sentry: 결제 확정 시작 추적
      Sentry.addBreadcrumb({
        category: "payment",
        message: "Payment confirmation started",
        level: "info",
        data: {
          orderId: data.orderId,
          amount: data.amount,
          hasReservationInfo: !!data.reservationInfo,
        },
      });

      const secretKey = validateConfig();

      if (!data.paymentKey || !data.orderId || !data.amount) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "필수 파라미터가 누락되었습니다: paymentKey, orderId, amount"
        );
      }

      if (!data.customerInfo?.name || !data.customerInfo?.phone) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "고객 정보가 누락되었습니다: name, phone"
        );
      }

      try {
        const tossResponse = await confirmPaymentAPI(secretKey, {
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          amount: data.amount,
        });

        const paymentDocData = tossResponseToPaymentDocument(tossResponse, {
          reservationId: data.reservationId || null,
          userId: context.auth?.uid || null,
          customerName: data.customerInfo.name,
          customerPhone: data.customerInfo.phone,
          customerEmail: data.customerInfo.email || "",
        });

        const paymentRef = db.collection("payments").doc();
        await paymentRef.set({
          ...paymentDocData,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        } as PaymentDocument);

        let reservationId = data.reservationId;

        // ⭐ Two-Phase Commit: 앱 플로우 - 예약 먼저 생성됨
        if (data.reservationId) {
          console.log(`🔄 기존 예약 업데이트: ${data.reservationId}`);

          // diagnosisReservations 컬렉션에서 예약 조회
          const reservationRef = db
            .collection("diagnosisReservations")
            .doc(data.reservationId);
          const reservationDoc = await reservationRef.get();

          if (!reservationDoc.exists) {
            throw new functions.https.HttpsError(
              "not-found",
              `예약을 찾을 수 없습니다: ${data.reservationId}`
            );
          }

          const reservationData = reservationDoc.data();

          // 예약 상태 검증
          if (reservationData?.status !== "pending_payment") {
            console.warn(
              `⚠️ 예약 상태가 pending_payment가 아닙니다: ${reservationData?.status}`
            );
          }

          // 🎫 쿠폰 사용 처리 (앱 플로우)
          let usedCouponId: string | undefined;
          let couponDiscountAmount = 0;

          if (data.userCouponId && context.auth?.uid) {
            try {
              console.log(`💳 쿠폰 사용 시도 (앱): ${data.userCouponId}`);

              const couponRef = db
                .collection("userCoupons")
                .doc(data.userCouponId);
              const couponDoc = await couponRef.get();

              if (couponDoc.exists) {
                const couponData = couponDoc.data();

                if (
                  couponData?.status === "active" &&
                  couponData.expiresAt.toDate() >= new Date() &&
                  couponData.userId === context.auth.uid
                ) {
                  await couponRef.update({
                    status: "used",
                    usedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                  });

                  usedCouponId = data.userCouponId;
                  couponDiscountAmount =
                    couponData.discountType === "fixed"
                      ? couponData.discountAmount
                      : 0;

                  console.log(
                    `✅ 쿠폰 사용 완료 (앱): ${couponData.couponName}`
                  );
                }
              }
            } catch (error) {
              console.error("❌ 쿠폰 처리 중 오류 (앱):", error);
            }
          }

          // ⭐ 예약 상태 업데이트: pending_payment → pending
          await reservationRef.update({
            status: "pending", // ⭐ 결제 완료, 관리자/정비사 확정 대기
            paymentStatus: "completed", // ⭐ pending → completed
            paymentId: paymentRef.id,
            paymentKey: data.paymentKey, // Toss paymentKey 저장
            orderId: data.orderId, // Toss orderId 저장
            paidAmount: tossResponse.totalAmount,
            paidAt: FieldValue.serverTimestamp(),
            paymentMethod: paymentDocData.method, // 결제 수단
            // 카드 결제 정보 (2025-11-30 추가)
            ...(paymentDocData.paymentMethod.card && {
              cardCompany: paymentDocData.paymentMethod.card.company,
              cardNumber: paymentDocData.paymentMethod.card.number,
              cardType: paymentDocData.paymentMethod.card.cardType,
              installmentPlanMonths:
                paymentDocData.paymentMethod.card.installmentPlanMonths,
            }),
            // 🎫 쿠폰 사용 정보
            ...(usedCouponId && {
              usedCouponId: usedCouponId,
              couponDiscountAmount: couponDiscountAmount,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // payment 문서에 reservationId 연결
          await paymentRef.update({
            reservationId: data.reservationId,
          });

          console.log(
            `✅ 예약 업데이트 완료: ${data.reservationId} (pending_payment → pending)`
          );

          // Sentry: 예약 상태 변경 로깅
          Sentry.addBreadcrumb({
            category: "reservation",
            message: "Reservation payment completed",
            level: "info",
            data: {
              reservationId: data.reservationId,
              oldStatus: "pending_payment",
              newStatus: "pending",
              paymentId: paymentRef.id,
            },
          });
        }
        // 🔥 웹 플로우 (하위 호환성): reservationInfo로 새 예약 생성
        else if (data.reservationInfo) {
          console.log("🌐 웹 플로우: 새 예약 생성 (Guest User 지원)");

          // Guest User 로직: 토큰이 없으면 Guest UID 생성
          let userId: string;

          if (context.auth?.uid) {
            // ✅ 인증된 사용자
            userId = context.auth.uid;
            console.log("✅ 인증된 사용자:", userId);
          } else {
            // ✅ Guest 사용자 - UUID 기반 Guest UID 생성
            userId = `guest_${uuidv4()}`;
            console.log("👤 Guest 사용자 생성:", userId);

            // Guest user 문서 생성
            await db
              .collection("users")
              .doc(userId)
              .set({
                uid: userId,
                displayName: data.customerInfo.name,
                phoneNumber: data.customerInfo.phone,
                phoneNumberNormalized: data.customerInfo.phone.replace(
                  /[^0-9]/g,
                  ""
                ), // 숫자만
                email: data.customerInfo.email || "",
                isGuest: true,
                provider: "email",
                isRegistrationComplete: false,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              });

            console.log("✅ Guest user 문서 생성 완료:", userId);
          }

          const reservationRef = db.collection("diagnosisReservations").doc();

          console.log(
            "📅 받은 requestedDate:",
            data.reservationInfo.requestedDate
          );
          const requestedDateTime = new Date(
            data.reservationInfo.requestedDate
          );
          console.log("📅 변환된 Date 객체:", requestedDateTime);
          console.log(
            "📅 Date 유효성:",
            requestedDateTime instanceof Date &&
              !isNaN(requestedDateTime.getTime())
          );

          // 날짜 유효성 검증
          if (
            !(requestedDateTime instanceof Date) ||
            isNaN(requestedDateTime.getTime())
          ) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              `유효하지 않은 날짜 형식입니다: ${data.reservationInfo.requestedDate}`
            );
          }

          // 🎁 추천 코드 검증 및 할인 처리
          let referralDiscount = 0;
          let referralCodeUsed: string | undefined;

          // 🎫 쿠폰 사용 처리
          let usedCouponId: string | undefined;
          let couponDiscountAmount = 0;

          if (data.userCouponId) {
            try {
              console.log(`💳 쿠폰 사용 시도: ${data.userCouponId}`);

              const couponRef = db
                .collection("userCoupons")
                .doc(data.userCouponId);
              const couponDoc = await couponRef.get();

              if (!couponDoc.exists) {
                console.warn(
                  `⚠️ 쿠폰을 찾을 수 없습니다: ${data.userCouponId}`
                );
              } else {
                const couponData = couponDoc.data();

                // 쿠폰 유효성 검증
                if (couponData?.status !== "active") {
                  console.warn(
                    `⚠️ 쿠폰이 이미 사용되었거나 만료되었습니다: ${couponData?.status}`
                  );
                } else if (couponData.expiresAt.toDate() < new Date()) {
                  console.warn(
                    `⚠️ 쿠폰이 만료되었습니다: ${couponData.expiresAt.toDate()}`
                  );
                } else if (
                  couponData.userId !== userId &&
                  !userId.startsWith("guest_")
                ) {
                  console.warn(
                    `⚠️ 다른 사용자의 쿠폰입니다: ${couponData.userId} !== ${userId}`
                  );
                } else {
                  // ✅ 쿠폰 사용 처리
                  await couponRef.update({
                    status: "used",
                    usedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                  });

                  usedCouponId = data.userCouponId;

                  // 할인 금액 계산 (정보 저장용, 실제 결제 금액은 이미 프론트엔드에서 할인된 상태)
                  if (couponData.discountType === "fixed") {
                    couponDiscountAmount = couponData.discountAmount;
                  } else if (couponData.discountType === "percentage") {
                    // 백분율 할인의 경우 원래 가격 정보가 필요하지만,
                    // 실제로는 이미 할인된 금액이 전달되므로 기록만 유지
                    couponDiscountAmount = 0; // 정확한 계산은 프론트엔드에서 수행됨
                  }

                  console.log(
                    `✅ 쿠폰 사용 완료: ${couponData.couponName} (${data.userCouponId})`
                  );

                  // Sentry: 쿠폰 사용 추적
                  Sentry.addBreadcrumb({
                    category: "coupon",
                    message: "Coupon used in payment",
                    level: "info",
                    data: {
                      couponId: data.userCouponId,
                      couponName: couponData.couponName,
                      discountType: couponData.discountType,
                      discountAmount: couponData.discountAmount,
                    },
                  });
                }
              }
            } catch (error) {
              console.error("❌ 쿠폰 처리 중 오류 발생:", error);
              // 쿠폰 처리 실패 시에도 결제는 진행 (쿠폰 없이)
              Sentry.captureException(error, {
                tags: { context: "coupon-processing" },
                extra: { userCouponId: data.userCouponId },
              });
            }
          }

          await reservationRef.set({
            // 기존 구조와 호환 (vehicleBrand, vehicleModel, vehicleYear)
            vehicleBrand: data.reservationInfo.vehicle.make,
            vehicleModel: data.reservationInfo.vehicle.model,
            vehicleYear: String(data.reservationInfo.vehicle.year),
            vehiclePlateNumber: data.reservationInfo.vehiclePlateNumber || "",

            // 주소 정보
            address: data.reservationInfo.address,
            detailAddress: data.reservationInfo.detailAddress,
            latitude: 0, // 주소 API에서 가져올 수 없는 경우 기본값
            longitude: 0,

            // 날짜/시간
            requestedDate:
              Timestamp.fromDate(requestedDateTime),

            // 서비스 정보
            serviceType: data.reservationInfo.serviceType,
            servicePrice: tossResponse.totalAmount,
            status: "pending", // 🔥 웹 예약도 pending 상태로 시작 (정비사 할당 시 confirmed)

            // 고객 정보 (기존 구조: userName, userPhone, userEmail)
            userName: data.customerInfo.name,
            userPhone: data.customerInfo.phone,
            userEmail: data.customerInfo.email || "",

            // 메모
            notes: data.reservationInfo.notes || "",
            adminNotes: "",

            // 결제 정보
            paymentId: paymentRef.id,
            paymentStatus: "completed", // ⭐ 'paid' → 'completed'로 통일
            paymentKey: data.paymentKey,
            orderId: data.orderId,
            paidAmount: tossResponse.totalAmount,
            paidAt: FieldValue.serverTimestamp(),

            // 사용자 및 소스
            userId: userId, // 🔥 Guest UID 또는 인증된 UID
            source: "web",

            // 🎁 추천 코드 할인 정보
            ...(referralCodeUsed && {
              referralCodeUsed: referralCodeUsed,
              discountAmount: referralDiscount,
              originalPrice: tossResponse.totalAmount + referralDiscount,
            }),

            // 🎫 쿠폰 사용 정보
            ...(usedCouponId && {
              usedCouponId: usedCouponId,
              couponDiscountAmount: couponDiscountAmount,
            }),

            // 타임스탬프
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          reservationId = reservationRef.id;

          await paymentRef.update({
            reservationId: reservationRef.id,
          });

          console.log(`✅ 예약 생성 완료 (웹 플로우): ${reservationRef.id}`);
        } else {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "reservationId 또는 reservationInfo가 필요합니다."
          );
        }

        // Sentry: 결제 확정 성공
        Sentry.captureMessage(
          "Payment confirmed and reservation created successfully",
          {
            level: "info",
            tags: {
              paymentId: paymentRef.id,
              orderId: data.orderId,
              reservationId: reservationId || "none",
            },
            extra: {
              amount: data.amount,
              customerName: data.customerInfo.name,
            },
          }
        );

        return {
          success: true,
          paymentId: paymentRef.id,
          receiptUrl: tossResponse.receipt?.url || null,
          reservationId,
          // ⭐ 영수증 표시용 추가 필드
          approvedAt: tossResponse.approvedAt,
          method: paymentDocData.method,
          card: paymentDocData.paymentMethod.card
            ? {
                company: paymentDocData.paymentMethod.card.company,
                number: paymentDocData.paymentMethod.card.number,
                cardType: paymentDocData.paymentMethod.card.cardType,
                installmentPlanMonths:
                  paymentDocData.paymentMethod.card.installmentPlanMonths,
              }
            : undefined,
        };
      } catch (error) {
        console.error("결제 승인 실패:", error);

        // Sentry: 결제 확정 실패
        Sentry.captureException(error, {
          tags: {
            orderId: data.orderId,
            amount: data.amount.toString(),
          },
          extra: {
            paymentKey: data.paymentKey,
            customerName: data.customerInfo?.name,
          },
        });

        if (error instanceof functions.https.HttpsError) {
          throw error;
        }

        throw new functions.https.HttpsError(
          "internal",
          "결제 승인 중 오류가 발생했습니다.",
          error instanceof Error ? { message: error.message } : undefined
        );
      }
    }
  );

export const cancelPaymentFunction = functions
  .region("asia-northeast3")
  .runWith({
    // secrets 제거 - .env 파일에서 직접 읽음
  })
  .https.onCall(
    async (
      data: CancelPaymentRequest,
      context
    ): Promise<CancelPaymentResponse> => {
      // Sentry: 결제 취소 시작 추적
      Sentry.addBreadcrumb({
        category: "payment",
        message: "Payment cancellation started",
        level: "info",
        data: {
          paymentId: data.paymentId,
          cancelReason: data.cancelReason,
          cancelAmount: data.cancelAmount,
        },
      });

      const secretKey = validateConfig();

      if (!data.paymentId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "paymentId가 필요합니다."
        );
      }

      if (!data.cancelReason?.trim()) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "취소 사유를 입력해주세요."
        );
      }

      try {
        const paymentRef = db.collection("payments").doc(data.paymentId);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "결제 정보를 찾을 수 없습니다."
          );
        }

        const paymentData = paymentDoc.data() as PaymentDocument;

        if (paymentData.cancelInProgress) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "이미 취소 처리 중입니다. 잠시 후 다시 시도해주세요."
          );
        }

        if (paymentData.status === "CANCELED") {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "이미 취소된 결제입니다."
          );
        }

        if (paymentData.balanceAmount === 0) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "환불 가능한 금액이 없습니다."
          );
        }

        if (data.cancelAmount !== undefined) {
          if (data.cancelAmount <= 0) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "취소 금액은 0보다 커야 합니다."
            );
          }

          if (data.cancelAmount > paymentData.balanceAmount) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              `취소 금액이 환불 가능 금액(${paymentData.balanceAmount}원)을 초과합니다.`
            );
          }
        }

        await paymentRef.update({
          cancelInProgress: true,
          updatedAt: FieldValue.serverTimestamp(),
        });

        try {
          const idempotencyKey = uuidv4();

          const tossResponse = await cancelPaymentAPI(
            secretKey,
            paymentData.paymentKey,
            {
              cancelReason: data.cancelReason.trim(),
              cancelAmount: data.cancelAmount,
            },
            idempotencyKey
          );

          const updateData = createCancelUpdateData(
            tossResponse,
            idempotencyKey
          );
          await paymentRef.update(updateData);

          if (paymentData.reservationId) {
            // 두 컬렉션 모두 확인 (reservations: 앱 예약, diagnosisReservations: 웹 예약)
            let reservationRef = db
              .collection("reservations")
              .doc(paymentData.reservationId);
            let reservationDoc = await reservationRef.get();

            if (!reservationDoc.exists) {
              // reservations에 없으면 diagnosisReservations 확인
              reservationRef = db
                .collection("diagnosisReservations")
                .doc(paymentData.reservationId);
              reservationDoc = await reservationRef.get();
            }

            if (reservationDoc.exists) {
              let paymentStatus: "paid" | "partial_refunded" | "refunded" =
                "paid";

              if (tossResponse.status === "CANCELED") {
                paymentStatus = "refunded";
              } else if (tossResponse.status === "PARTIAL_CANCELED") {
                paymentStatus = "partial_refunded";
              }

              await reservationRef.update({
                paymentStatus,
                updatedAt: FieldValue.serverTimestamp(),
              });

              console.log(
                `예약 상태 업데이트 완료: ${paymentData.reservationId} -> ${paymentStatus}`
              );
            } else {
              console.warn(
                `예약 문서를 찾을 수 없습니다: ${paymentData.reservationId}`
              );
            }
          }

          // Sentry: 결제 취소 성공
          Sentry.captureMessage("Payment cancelled successfully", {
            level: "info",
            tags: {
              paymentId: data.paymentId,
              status: tossResponse.status,
              reservationId: paymentData.reservationId || "none",
            },
            extra: {
              cancelAmount: data.cancelAmount || paymentData.balanceAmount,
              balanceAmount: tossResponse.balanceAmount,
              cancelReason: data.cancelReason,
            },
          });

          return {
            success: true,
            status: tossResponse.status as "CANCELED" | "PARTIAL_CANCELED",
            balanceAmount: tossResponse.balanceAmount,
            cancelAmount: data.cancelAmount || paymentData.balanceAmount,
          };
        } catch (error) {
          await paymentRef.update({
            cancelInProgress: false,
            updatedAt: FieldValue.serverTimestamp(),
          });
          throw error;
        }
      } catch (error) {
        console.error("결제 취소 실패:", error);

        // Sentry: 결제 취소 실패
        Sentry.captureException(error, {
          tags: {
            paymentId: data.paymentId,
          },
          extra: {
            cancelReason: data.cancelReason,
            cancelAmount: data.cancelAmount,
          },
        });

        if (error instanceof functions.https.HttpsError) {
          throw error;
        }

        throw new functions.https.HttpsError(
          "internal",
          "결제 취소 중 오류가 발생했습니다.",
          error instanceof Error ? { message: error.message } : undefined
        );
      }
    }
  );

/**
 * Toss Payments Webhook (Step 3: 2차 백업)
 *
 * @description
 * Toss가 결제 상태 변경 시 자동으로 호출
 * confirmPaymentFunction 실패 시 자동 백업
 * Toss가 최대 24시간 재시도
 *
 * @endpoint POST /tossWebhook
 * @region us-central1, asia-northeast3
 *
 * @example Toss가 보내는 요청
 * {
 *   "eventType": "PAYMENT_STATUS_CHANGED",
 *   "createdAt": "2025-11-28T12:34:56.789Z",
 *   "data": {
 *     "orderId": "CHZ_abc123",
 *     "status": "DONE",
 *     "paymentKey": "tgen_xxxx",
 *     "approvedAt": "2025-11-28T12:34:56.789Z"
 *   }
 * }
 */
export const tossWebhook = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    try {
      // 1️⃣ 보안: POST 메서드만 허용
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      console.log("📥 Toss Webhook received:", {
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        body: req.body,
      });

      // 2️⃣ Payload 파싱
      const { eventType, data } = req.body;

      // PAYMENT_STATUS_CHANGED 이벤트만 처리
      if (eventType !== "PAYMENT_STATUS_CHANGED") {
        console.log("⏭️  Ignoring eventType:", eventType);
        res.status(200).send("OK");
        return;
      }

      const { orderId, status, paymentKey } = data;

      // status가 DONE이 아니면 무시
      if (status !== "DONE") {
        console.log("⏭️  Payment not DONE:", { orderId, status });
        res.status(200).send("OK");
        return;
      }

      // 3️⃣ orderId에서 reservationId 추출
      // 형식: CHZ_{reservationId} 또는 CHZ_{reservationId}_retry{timestamp}
      const reservationId = orderId.replace(/^CHZ_/, "").split("_")[0];
      console.log("🔍 Extracted reservationId:", { orderId, reservationId });

      // 4️⃣ 예약 문서 조회
      const reservationRef = db
        .collection("diagnosisReservations")
        .doc(reservationId);
      const reservationDoc = await reservationRef.get();

      if (!reservationDoc.exists) {
        console.error("❌ Reservation not found:", reservationId);

        // Sentry 로깅
        Sentry.captureMessage("Toss Webhook: Reservation not found", {
          level: "error",
          tags: { orderId, reservationId },
        });

        res.status(404).send("Reservation not found");
        return;
      }

      const reservation = reservationDoc.data();

      // 5️⃣ 이미 결제 완료 상태면 중복 방지
      if (reservation!.paymentStatus === "completed") {
        console.log("✅ Already paid, skipping:", reservationId);
        res.status(200).send("Already paid");
        return;
      }

      // 6️⃣ 예약 상태 업데이트: pending_payment → pending
      await reservationRef.update({
        status: "pending",
        paymentStatus: "completed",
        paymentKey: paymentKey,
        orderId: orderId,
        paidAmount: reservation!.servicePrice || 0,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log("✅ Reservation payment completed via Webhook:", {
        reservationId,
        orderId,
        paymentKey,
      });

      // 7️⃣ Sentry 로깅
      Sentry.addBreadcrumb({
        category: "payment",
        message: "Reservation payment completed via Toss Webhook",
        level: "info",
        data: { reservationId, orderId, paymentKey },
      });

      // 8️⃣ 성공 응답
      res.status(200).send("OK");
    } catch (error) {
      console.error("❌ Webhook error:", error);

      // Sentry 에러 캡처
      Sentry.captureException(error, {
        tags: {
          source: "tossWebhook",
        },
      });

      res.status(500).send("Internal Server Error");
    }
  });

/**
 * TTL Cleanup - pending_payment 예약 1시간 후 자동 삭제 (Step 4)
 *
 * @description
 * 매 시간마다 자동 실행되어 1시간 지난 미결제 예약을 정리
 * - pending_payment 상태가 1시간 넘으면 cancelled로 변경
 * - DB 오염 방지 및 시간대 재사용 가능
 *
 * @trigger Cloud Scheduler (Pub/Sub)
 * @schedule 매시 정각 (KST) - "0 * * * *" (UTC)
 * @region us-central1, asia-northeast3
 *
 * @example Cloud Scheduler 설정
 * Topic: cleanup-pending-payments
 * Schedule: 0 * * * * (UTC = 매시 정각)
 * Timezone: UTC
 */
export const cleanupPendingPayments = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 540, // 9분 (최대 시간)
  })
  .pubsub.topic("cleanup-pending-payments")
  .onPublish(async (message) => {
    const startTime = Date.now();
    console.log("🧹 Starting TTL Cleanup for pending_payment reservations...");

    try {
      // 1️⃣ 1시간 전 타임스탬프 계산
      const oneHourAgo = Timestamp.fromMillis(
        Date.now() - 1 * 60 * 60 * 1000
      );

      console.log("⏰ Cutoff time:", oneHourAgo.toDate().toISOString());

      // 2️⃣ pending_payment 상태이면서 1시간 지난 예약 찾기
      const expiredReservationsSnapshot = await db
        .collection("diagnosisReservations")
        .where("status", "==", "pending_payment")
        .where("createdAt", "<", oneHourAgo)
        .get();

      if (expiredReservationsSnapshot.empty) {
        console.log("✅ No expired reservations found");

        // Sentry 로깅
        Sentry.addBreadcrumb({
          category: "cleanup",
          message: "TTL Cleanup completed - no expired reservations",
          level: "info",
        });

        return;
      }

      const expiredCount = expiredReservationsSnapshot.size;
      console.log(`🔍 Found ${expiredCount} expired reservations`);

      // 3️⃣ Batch로 상태 업데이트 (삭제 대신 cancelled로 변경)
      const batch = db.batch();
      const reservationIds: string[] = [];
      const paidReservationIds: string[] = []; // 결제 완료됐는데 pending인 예약

      expiredReservationsSnapshot.docs.forEach((doc) => {
        const reservation = doc.data();

        // ⚠️ paymentKey가 있으면 실제 결제 완료 → 취소하면 안됨!
        if (reservation.paymentKey) {
          paidReservationIds.push(doc.id);

          console.warn(
            "⚠️ Skipping paid reservation (manual review required):",
            {
              id: doc.id,
              paymentKey: reservation.paymentKey?.slice(0, 20) + "...",
              userId: reservation.userId,
              createdAt: reservation.createdAt?.toDate().toISOString(),
            }
          );

          return; // 건너뛰기 - 관리자가 수동으로 확인해야 함
        }

        // paymentKey 없는 예약만 취소
        reservationIds.push(doc.id);

        console.log("🗑️  Cancelling unpaid reservation:", {
          id: doc.id,
          userId: reservation.userId,
          createdAt: reservation.createdAt?.toDate().toISOString(),
          requestedDate: reservation.requestedDate?.toDate().toISOString(),
        });

        batch.update(doc.ref, {
          status: "cancelled",
          cancelledAt: FieldValue.serverTimestamp(),
          cancelReason: "TTL_EXPIRED_24H",
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      // 4️⃣ Batch 커밋 (paymentKey 없는 예약만)
      if (reservationIds.length > 0) {
        await batch.commit();
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ TTL Cleanup completed: ${reservationIds.length} cancelled, ${paidReservationIds.length} skipped (paid) in ${duration}ms`
      );

      // 5️⃣ Sentry 로깅
      Sentry.addBreadcrumb({
        category: "cleanup",
        message: `TTL Cleanup: ${reservationIds.length} cancelled, ${paidReservationIds.length} skipped`,
        level: "info",
        data: {
          cancelledCount: reservationIds.length,
          skippedCount: paidReservationIds.length,
          durationMs: duration,
          cancelledIds: reservationIds.slice(0, 10),
          skippedIds: paidReservationIds.slice(0, 10),
        },
      });

      // 6️⃣ 결제 완료된 예약이 pending_payment로 남아있으면 경고 (Critical!)
      if (paidReservationIds.length > 0) {
        Sentry.captureMessage(
          "TTL Cleanup: Paid reservations stuck in pending_payment",
          {
            level: "error", // Critical 상황 - 즉시 확인 필요
            tags: {
              count: paidReservationIds.length.toString(),
              source: "TTL_Cleanup",
            },
            extra: {
              reservationIds: paidReservationIds,
              message:
                "These reservations have paymentKey but status is still pending_payment. Webhook and confirmPaymentFunction both failed. MANUAL REVIEW REQUIRED!",
              action:
                "Admin should manually change status to confirmed in charzing-admin",
            },
          }
        );
      }

      // 7️⃣ 많은 예약이 정리된 경우 경고 (비정상적 상황)
      if (reservationIds.length > 50) {
        Sentry.captureMessage(
          "TTL Cleanup: High number of expired reservations",
          {
            level: "warning",
            tags: {
              count: reservationIds.length.toString(),
            },
            extra: {
              reservationIds: reservationIds.slice(0, 20),
            },
          }
        );
      }
    } catch (error) {
      console.error("❌ TTL Cleanup error:", error);

      // Sentry 에러 캡처
      Sentry.captureException(error, {
        tags: {
          source: "cleanupPendingPayments",
        },
      });

      throw error; // Cloud Scheduler 재시도를 위해 throw
    }
  });

/**
 * 새 예약 생성 시 관리자에게 SMS 알림 전송
 * Firestore 트리거: diagnosisReservations 컬렉션에 새 문서 생성 시 실행
 *
 * 특징:
 * - 백그라운드 트리거로 사용자 경험에 영향 없음
 * - 예약 생성 후 비동기적으로 SMS 발송
 * - 실패 시에도 예약 생성에는 영향 없음
 */
export const notifyReservationCreated = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .firestore.document("diagnosisReservations/{reservationId}")
  .onCreate(async (snapshot, context) => {
    const reservationId = context.params.reservationId;
    const data = snapshot.data();

    console.log(`📲 새 예약 생성됨 (SMS 알림 발송 시작): ${reservationId}`);

    // Sentry 브레드크럼 추가
    Sentry.addBreadcrumb({
      category: "notification",
      message: "SMS notification triggered",
      level: "info",
      data: {
        reservationId,
        userId: data.userId,
      },
    });

    try {
      // 환경 변수 검증
      const config = validateSMSConfig();

      // 예약 정보 추출
      const customerName = data.userName || "정보 없음";
      const customerPhone = data.userPhone || "정보 없음";
      const vehicleBrand = data.vehicleBrand || "";
      const vehicleModel = data.vehicleModel || "";
      const vehicleYear = data.vehicleYear || "";
      const serviceType = data.serviceType || "일반 진단";
      const servicePrice = data.servicePrice || 0;

      // 예약 날짜 포맷팅 (한국 시간 KST로 변환)
      let requestedDateStr = "정보 없음";
      if (data.requestedDate) {
        const requestedDate = data.requestedDate.toDate();
        // Intl.DateTimeFormat으로 한국 시간대 변환
        const kstFormatter = new Intl.DateTimeFormat("ko-KR", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const parts = kstFormatter.formatToParts(requestedDate);
        const year = parts.find((p) => p.type === "year")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;
        const hour = parts.find((p) => p.type === "hour")?.value;
        const minute = parts.find((p) => p.type === "minute")?.value;
        requestedDateStr = `${year}-${month}-${day} ${hour}:${minute}`;
      }

      // SMS 메시지 구성 (이모지 제거 - Naver SENS API 제약)
      const message = [
        "[차징 예약 알림]",
        "",
        `예약 ID: ${reservationId.slice(0, 8)}`,
        `고객명: ${customerName}`,
        `연락처: ${customerPhone}`,
        `차량: ${vehicleBrand} ${vehicleModel} ${vehicleYear}`,
        `희망일시: ${requestedDateStr}`,
        `서비스: ${serviceType} (${servicePrice.toLocaleString()}원)`,
      ].join("\n");

      // SMS 발송 (여러 관리자에게 동시 발송)
      const sendPromises = config.adminPhones.map(async (phone) => {
        try {
          await sendSMS(
            {
              to: phone,
              content: message,
            },
            config.serviceId,
            config.accessKey,
            config.secretKey,
            config.senderPhone
          );
          console.log(`✅ SMS 알림 발송 완료: ${reservationId} → ${phone}`);
          return { phone, success: true };
        } catch (error) {
          console.error(`❌ SMS 발송 실패 (${phone}):`, error);
          return { phone, success: false, error };
        }
      });

      // 모든 SMS 발송 완료 대기
      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;

      console.log(
        `📊 SMS 발송 결과: ${successCount}/${config.adminPhones.length} 성공`
      );

      // Sentry 성공 기록
      Sentry.addBreadcrumb({
        category: "notification",
        message: `SMS notification sent to ${successCount}/${config.adminPhones.length} recipients`,
        level: "info",
        data: {
          reservationId,
          recipients: config.adminPhones,
          successCount,
        },
      });
    } catch (error) {
      // SMS 발송 실패는 로그만 남기고 예약 생성에는 영향 없음
      console.error("❌ SMS 알림 발송 실패:", {
        reservationId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Sentry 에러 캡처
      Sentry.captureException(error, {
        tags: {
          source: "notifyReservationCreated",
          reservationId,
        },
        level: "warning", // Critical이 아님 - SMS 실패해도 예약은 정상 생성됨
      });

      // 에러를 throw하지 않음으로써 예약 생성 트랜잭션에 영향을 주지 않음
    }
  });

/**
 * SMS 인증번호 발송 (앱/웹 공용)
 *
 * 요청 데이터:
 * - phoneNumber: 인증번호를 받을 전화번호 (010-1234-5678 형식)
 *
 * 응답:
 * - success: 발송 성공 여부
 * - expiresAt: 인증번호 만료 시간 (5분)
 * - error: 에러 메시지 (실패 시)
 */
export const sendVerificationCode = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    try {
      console.log("📱 SMS 인증번호 발송 요청:", {
        phoneNumber: data.phoneNumber,
      });

      // 입력 검증
      const phoneNumber = data.phoneNumber?.replace(/[^\d]/g, "");
      if (!phoneNumber || !/^01[016789]\d{8}$/.test(phoneNumber)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "올바른 전화번호를 입력해주세요."
        );
      }

      // 🔒 발송 횟수 제한 체크 (3회 초과 시 30분 차단)
      const docRef = db.collection("verificationCodes").doc(phoneNumber);
      const existingDoc = await docRef.get();
      const existingData = existingDoc.data();

      if (existingData) {
        const now = Date.now();

        // 차단 상태 확인
        if (existingData.blockedUntil) {
          const blockedUntil = existingData.blockedUntil.toMillis();
          if (now < blockedUntil) {
            const remainingMinutes = Math.ceil((blockedUntil - now) / 60000);
            throw new functions.https.HttpsError(
              "resource-exhausted",
              `너무 많은 요청입니다. ${remainingMinutes}분 후에 다시 시도해주세요.`
            );
          }
          // 차단 시간이 지났으면 카운트 리셋
        }

        // 발송 횟수 체크 (30분 내 3회 제한)
        const sendCount = existingData.sendCount || 0;
        const lastSendAt = existingData.lastSendAt?.toMillis() || 0;
        const thirtyMinutesAgo = now - 30 * 60 * 1000;

        // 30분이 지났으면 카운트 리셋
        const currentSendCount = lastSendAt < thirtyMinutesAgo ? 0 : sendCount;

        if (currentSendCount >= 3) {
          // 3회 초과 - 30분 차단 설정
          await docRef.update({
            blockedUntil: Timestamp.fromDate(
              new Date(now + 30 * 60 * 1000)
            ),
          });
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "인증번호 발송 횟수를 초과했습니다. 30분 후에 다시 시도해주세요."
          );
        }
      }

      // 🧪 개발/에뮬레이터 모드 체크
      const isDevMode =
        process.env.NODE_ENV === "development" ||
        !!process.env.FIRESTORE_EMULATOR_HOST;

      // 개발 모드에서는 테스트 인증번호 사용 (SMS 발송 안 함)
      const TEST_VERIFICATION_CODE = "000000";

      // 6자리 랜덤 인증번호 생성 (개발 모드에서는 테스트 코드 사용)
      const verificationCode = isDevMode
        ? TEST_VERIFICATION_CODE
        : Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 5 * 60 * 1000) // 5분 후 만료
      );

      // 현재 발송 횟수 계산 (30분 내)
      const now = Date.now();
      const lastSendAt = existingData?.lastSendAt?.toMillis() || 0;
      const thirtyMinutesAgo = now - 30 * 60 * 1000;
      const currentSendCount =
        lastSendAt < thirtyMinutesAgo ? 0 : existingData?.sendCount || 0;

      if (isDevMode) {
        // 🧪 개발 모드: SMS 발송 없이 Firestore에만 저장
        console.log(
          "🧪 [개발 모드] 테스트 인증번호 사용:",
          TEST_VERIFICATION_CODE
        );

        await docRef.set({
          code: verificationCode,
          phoneNumber,
          expiresAt,
          verified: false,
          sendCount: currentSendCount + 1,
          lastSendAt: FieldValue.serverTimestamp(),
          blockedUntil: null,
          createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        // 🚀 프로덕션 모드: SMS 설정 검증 및 발송
        const config = validateSMSConfig();

        // 🚀 성능 최적화: Firestore 저장과 SMS 발송을 병렬로 실행
        await Promise.all([
          // Firestore에 인증번호 저장 (발송 횟수 포함)
          docRef.set({
            code: verificationCode,
            phoneNumber,
            expiresAt,
            verified: false,
            sendCount: currentSendCount + 1,
            lastSendAt: FieldValue.serverTimestamp(),
            blockedUntil: null, // 차단 해제
            createdAt: FieldValue.serverTimestamp(),
          }),
          // SMS 발송
          sendSMS(
            {
              to: phoneNumber,
              content: `[차징] 인증번호는 ${verificationCode} 입니다. 5분 내에 입력해주세요.`,
            },
            config.serviceId,
            config.accessKey,
            config.secretKey,
            config.senderPhone
          ),
        ]);
      }

      console.log(
        `${isDevMode ? "🧪" : "✅"} SMS 인증번호 발송 완료:`,
        phoneNumber,
        `(${currentSendCount + 1}/3)`,
        isDevMode ? "[개발 모드]" : ""
      );

      return {
        success: true,
        expiresAt: expiresAt.toMillis(),
        sendCount: currentSendCount + 1, // 클라이언트에 현재 발송 횟수 전달
        remainingCount: 3 - (currentSendCount + 1), // 남은 발송 횟수
      };
    } catch (error: any) {
      console.error("❌ SMS 인증번호 발송 실패:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
      });

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        `인증번호 발송에 실패했습니다: ${error.message || "잠시 후 다시 시도해주세요."}`
      );
    }
  });

/**
 * SMS 인증번호 검증 (앱/웹 공용)
 *
 * 요청 데이터:
 * - phoneNumber: 전화번호
 * - code: 인증번호
 *
 * 응답:
 * - success: 검증 성공 여부
 * - error: 에러 메시지 (실패 시)
 */
export const verifyPhoneCode = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    try {
      console.log("🔐 SMS 인증번호 검증 요청:", {
        phoneNumber: data.phoneNumber,
      });

      // 입력 검증
      const phoneNumber = data.phoneNumber?.replace(/[^\d]/g, "");
      const code = data.code?.trim();

      if (!phoneNumber || !/^01[016789]\d{8}$/.test(phoneNumber)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "올바른 전화번호를 입력해주세요."
        );
      }

      if (!code || !/^\d{6}$/.test(code)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "인증번호는 6자리 숫자입니다."
        );
      }

      // Firestore에서 인증번호 조회
      const docRef = db.collection("verificationCodes").doc(phoneNumber);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "인증번호를 먼저 발송해주세요."
        );
      }

      const verificationData = doc.data();
      if (!verificationData) {
        throw new functions.https.HttpsError(
          "not-found",
          "인증번호를 먼저 발송해주세요."
        );
      }

      // 만료 시간 확인
      const now = Timestamp.now();
      if (verificationData.expiresAt.toMillis() < now.toMillis()) {
        throw new functions.https.HttpsError(
          "deadline-exceeded",
          "인증번호가 만료되었습니다. 다시 발송해주세요."
        );
      }

      // 인증번호 일치 확인 (먼저 확인!)
      if (verificationData.code !== code) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "인증번호가 일치하지 않습니다."
        );
      }

      // 이미 검증된 코드인지 확인 (맞는 경우에만 체크)
      if (verificationData.verified) {
        throw new functions.https.HttpsError(
          "already-exists",
          "이미 사용된 인증번호입니다."
        );
      }

      // 검증 완료 표시
      await docRef.update({
        verified: true,
        verifiedAt: FieldValue.serverTimestamp(),
      });

      console.log("✅ SMS 인증번호 검증 완료:", phoneNumber);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error("❌ SMS 인증번호 검증 실패:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "인증번호 검증에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  });

/**
 * 추천 코드 검증 함수
 * 예약 시 사용자가 입력한 추천 코드의 유효성을 검증
 */
export const validateReferralCode = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 10,
  })
  .https.onCall(async (data: { code: string; userId?: string }, context) => {
    try {
      const { code, userId } = data;

      if (!code || typeof code !== "string") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "추천 코드를 입력해주세요."
        );
      }

      // 1. settings/referralPricing 조회 (추천 기능 활성화 여부)
      const referralPricingSnap = await db
        .collection("settings")
        .doc("referralPricing")
        .get();

      if (!referralPricingSnap.exists) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 할인 설정을 찾을 수 없습니다."
        );
      }

      const referralPricing = referralPricingSnap.data();
      if (!referralPricing) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 할인 설정이 올바르지 않습니다."
        );
      }

      // 2. 추천 기능 활성화 여부 체크
      if (referralPricing.enabled !== true) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 할인이 비활성화되었습니다."
        );
      }

      // 3. 추천 코드 문서 조회
      const normalizedCode = code.trim().toUpperCase();
      const referralCodeSnap = await db
        .collection("referralCodes")
        .doc(normalizedCode)
        .get();

      if (!referralCodeSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "존재하지 않는 추천 코드입니다."
        );
      }

      const referralCodeData = referralCodeSnap.data();
      if (!referralCodeData) {
        throw new functions.https.HttpsError(
          "not-found",
          "추천 코드 데이터가 올바르지 않습니다."
        );
      }

      // 4. 추천 코드 상태 체크
      if (referralCodeData.status !== "active") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "사용할 수 없는 추천 코드입니다."
        );
      }

      // 5. 기간 체크
      const now = Timestamp.now();
      if (
        referralPricing.startDate &&
        now.toMillis() < referralPricing.startDate.toMillis()
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 할인 기간이 아직 시작되지 않았습니다."
        );
      }

      if (
        referralPricing.endDate &&
        now.toMillis() > referralPricing.endDate.toMillis()
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 할인 기간이 종료되었습니다."
        );
      }

      // 6. 첫 예약 제한 체크 (userId가 있는 경우)
      if (
        referralPricing.firstReservationOnly === true &&
        userId &&
        typeof userId === "string"
      ) {
        const reservationsQuery = await db
          .collection("diagnosisReservations")
          .where("userId", "==", userId)
          .where("status", "in", ["confirmed", "paid", "completed"])
          .limit(1)
          .get();

        if (!reservationsQuery.empty) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "추천 할인은 첫 예약에만 적용됩니다."
          );
        }
      }

      // 7. 검증 성공 - 할인 금액만 반환 (민감 정보 제외)
      const discountValue = referralPricing.discount?.value;
      const discountType = referralPricing.discount?.type;

      if (
        typeof discountValue !== "number" ||
        typeof discountType !== "string"
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "할인 정보가 올바르지 않습니다."
        );
      }

      return {
        valid: true,
        discountAmount: discountValue,
        discountType: discountType,
        message: "추천 코드가 적용되었습니다.",
      };
    } catch (error) {
      console.error("❌ 추천 코드 검증 실패:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "추천 코드 검증 중 오류가 발생했습니다."
      );
    }
  });

/**
 * 추천 코드 적용 및 쿠폰 발급 함수
 * 사용자가 추천 코드를 입력하면 검증 후 쿠폰을 발급
 */
export const applyReferralCode = functions
  .region("asia-northeast3")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data: { referralCode: string }, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const userId = context.auth.uid;
      const { referralCode } = data;

      if (!referralCode || typeof referralCode !== "string") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "추천 코드를 입력해주세요."
        );
      }

      const normalizedCode = referralCode.trim().toUpperCase();

      // 1. 추천 코드 검증
      const referralCodeSnap = await db
        .collection("referralCodes")
        .doc(normalizedCode)
        .get();

      if (!referralCodeSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "존재하지 않는 추천 코드입니다."
        );
      }

      const referralCodeData = referralCodeSnap.data();
      if (!referralCodeData || referralCodeData.status !== "active") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "사용할 수 없는 추천 코드입니다."
        );
      }

      // 2. 자기 자신의 추천 코드는 사용 불가
      if (referralCodeData.userId === userId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "자신의 추천 코드는 사용할 수 없습니다."
        );
      }

      // 3. 이미 추천 쿠폰을 받았는지 확인
      const existingCouponQuery = await db
        .collection("userCoupons")
        .where("userId", "==", userId)
        .where("issueReason", "==", "referral")
        .limit(1)
        .get();

      if (!existingCouponQuery.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "이미 추천 코드로 쿠폰을 받으셨습니다."
        );
      }

      // 4. 추천 쿠폰 정의 조회
      const referralCouponSnap = await db
        .collection("coupons")
        .doc("referral-welcome")
        .get();

      if (!referralCouponSnap.exists) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "추천 쿠폰 설정을 찾을 수 없습니다."
        );
      }

      const couponData = referralCouponSnap.data();
      if (!couponData || !couponData.isActive) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "현재 추천 쿠폰이 비활성화되었습니다."
        );
      }

      // 5. 사용자에게 쿠폰 발급
      const now = Timestamp.now();
      // 추천 쿠폰은 유효기간 없음 (10년 후로 설정)
      const expiresAt = Timestamp.fromMillis(
        now.toMillis() + 10 * 365 * 24 * 60 * 60 * 1000
      );

      const userCouponRef = db.collection("userCoupons").doc();
      const userCouponData = {
        id: userCouponRef.id,
        userId: userId,
        couponId: "referral-welcome",
        couponName: couponData.name,
        couponDescription: couponData.description,
        discountType: couponData.discountType,
        discountAmount: couponData.discountAmount || null,
        discountPercentage: couponData.discountPercentage || null,
        maxDiscountAmount: couponData.maxDiscountAmount || null,
        minOrderAmount: couponData.minOrderAmount || null,
        issueReason: "referral",
        referralCode: normalizedCode,
        status: "active",
        issuedAt: now,
        expiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      await userCouponRef.set(userCouponData);

      console.log(`✅ 쿠폰 발급 완료: ${userId} <- ${normalizedCode}`);

      // 6. 추천 코드 사용 통계 업데이트 (옵션)
      await db
        .collection("referralCodes")
        .doc(normalizedCode)
        .update({
          usedCount: admin.firestore.FieldValue.increment(1),
          lastUsedAt: now,
        });

      // 7. 성공 응답
      return {
        success: true,
        userCoupon: {
          id: userCouponRef.id,
          couponName: couponData.name,
          couponDescription: couponData.description,
          discountAmount: couponData.discountAmount || 0,
          expiresAt: expiresAt.toDate().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ 추천 코드 적용 실패:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "추천 코드 적용 중 오류가 발생했습니다."
      );
    }
  });

export const exportReportImageFunction = functions
  .region("asia-northeast3")
  .runWith({
    memory: "2GB",
    timeoutSeconds: 120,
  })
  .https.onCall(
    async (
      data: ExportReportImageRequest,
      context
    ): Promise<ExportReportImageResponse> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "로그인이 필요합니다."
        );
      }

      const { reportId } = data;

      if (!reportId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "reportId가 필요합니다."
        );
      }

      const reportDoc = await db
        .collection("vehicleDiagnosisReports")
        .doc(reportId)
        .get();
      if (!reportDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "리포트를 찾을 수 없습니다."
        );
      }

      const reportData = reportDoc.data();

      const userId = context.auth.uid;

      // 권한 체크: 본인 리포트이거나 admin role이면 허용
      const userDoc = await db.collection("users").doc(userId).get();
      const userRole = userDoc.data()?.role;
      const isAdmin = userRole === "admin";

      if (reportData?.userId !== userId && !isAdmin) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "이 리포트에 접근 권한이 없습니다."
        );
      }

      const baseUrl = 'https://charzing.kr';
      const targetUrl = `${baseUrl}/export/report/${reportId}`

      Sentry.addBreadcrumb({
        category: 'function',
        message: 'exportReportImage 함수 시작',
        level: 'info',
        data: { reportId },
      });

      let browser;
      try {
        browser = await puppeteer.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: {
            width: 980,
            height: 2772,          // 두 페이지 높이 (1386 * 2, A4 비율)
            deviceScaleFactor: 2,  // 고해상도 (2배)
          },
          executablePath: await chromium.executablePath(),
          headless: true,
        });

        const page = await browser.newPage();

        // 페이지 로드 (타임아웃 60초, domcontentloaded로 빠르게)
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });

        // 이미지 로딩 대기 (더 넉넉하게)
        await page.waitForSelector('img', { timeout: 30000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 3000));

        Sentry.addBreadcrumb({
          category: 'function',
          message: '페이지 로드 완료',
          level: 'info',
        });

        // 페이지별 스크린샷 캡처 (A4 비율: 980 × 1386)
        const pageHeight = 1386;
        const pageWidth = 980;
        const screenshots: Buffer[] = [];

        // 첫 번째 페이지
        const screenshot1 = await page.screenshot({
          type: 'png',
          clip: { x: 0, y: 0, width: pageWidth, height: pageHeight }
        }) as Buffer;
        screenshots.push(screenshot1);

        // 두 번째 페이지
        const screenshot2 = await page.screenshot({
          type: 'png',
          clip: { x: 0, y: pageHeight, width: pageWidth, height: pageHeight }
        }) as Buffer;
        screenshots.push(screenshot2);

        await browser.close();

        Sentry.addBreadcrumb({
          category: 'function',
          message: '스크린샷 캡처 완료',
          level: 'info',
          data: { pageCount: screenshots.length },
        });

        // Firebase Storage에 업로드
        const bucket = admin.storage().bucket();
        const timestamp = Date.now();
        const imageUrls: string[] = [];

        for (let i = 0; i < screenshots.length; i++) {
          const fileName = `report-exports/${reportId}/${timestamp}_page${i + 1}.png`;
          const file = bucket.file(fileName);

          await file.save(screenshots[i], {
            metadata: {
              contentType: 'image/png',
              metadata: {
                reportId,
                userId,
                page: String(i + 1),
              }
            },
            public: true,  // 파일을 public으로 설정
          });

          // Public URL 생성 (CORS 문제 없음)
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          imageUrls.push(publicUrl);
        }

        Sentry.captureMessage('리포트 이미지 생성 성공', {
          level: 'info',
          extra: { reportId, pageCount: imageUrls.length },
        });

        return {
          success: true,
          imageUrls,
        };

      } catch (error) {
        Sentry.captureException(error, {
          extra: { reportId, targetUrl },
        });

        if (browser) {
          await browser.close();
        }

        throw new functions.https.HttpsError(
          'internal',
          '이미지 생성 중 오류가 발생했습니다.'
        );
      }
    }
  );
