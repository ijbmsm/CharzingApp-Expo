import { Timestamp } from 'firebase-admin/firestore';

/**
 * 쿠폰 정의 (coupons 컬렉션)
 * 쿠폰의 종류와 혜택을 정의하는 마스터 데이터
 */
export interface Coupon {
  /** 쿠폰 ID (문서 ID) */
  id: string;

  /** 쿠폰 이름 */
  name: string;

  /** 쿠폰 설명 */
  description: string;

  /** 쿠폰 타입 */
  type: 'referral' | 'event' | 'promotion' | 'compensation';

  /** 할인 타입 */
  discountType: 'fixed' | 'percentage';

  /** 할인 금액 (fixed인 경우) */
  discountAmount?: number;

  /** 할인 비율 (percentage인 경우, 0-100) */
  discountPercentage?: number;

  /** 최대 할인 금액 (percentage인 경우) */
  maxDiscountAmount?: number;

  /** 최소 주문 금액 */
  minOrderAmount?: number;

  /** 유효 기간 (일 단위, 발급일로부터) */
  validityDays: number;

  /** 쿠폰이 활성화되어 있는지 여부 */
  isActive: boolean;

  /** 생성일 */
  createdAt: Timestamp;

  /** 수정일 */
  updatedAt: Timestamp;
}

/**
 * 사용자 쿠폰 (userCoupons 컬렉션)
 * 특정 사용자에게 발급된 쿠폰 인스턴스
 */
export interface UserCoupon {
  /** 사용자 쿠폰 ID (문서 ID) */
  id: string;

  /** 사용자 ID */
  userId: string;

  /** 쿠폰 정의 ID (coupons 컬렉션 참조) */
  couponId: string;

  /** 쿠폰 이름 (발급 시점 스냅샷) */
  couponName: string;

  /** 쿠폰 설명 (발급 시점 스냅샷) */
  couponDescription: string;

  /** 할인 타입 (발급 시점 스냅샷) */
  discountType: 'fixed' | 'percentage';

  /** 할인 금액 (발급 시점 스냅샷) */
  discountAmount?: number;

  /** 할인 비율 (발급 시점 스냅샷) */
  discountPercentage?: number;

  /** 최대 할인 금액 (발급 시점 스냅샷) */
  maxDiscountAmount?: number;

  /** 최소 주문 금액 (발급 시점 스냅샷) */
  minOrderAmount?: number;

  /** 발급 사유 */
  issueReason: 'referral' | 'event' | 'compensation' | 'admin';

  /** 추천 코드 (referral 쿠폰인 경우) */
  referralCode?: string;

  /** 쿠폰 상태 */
  status: 'active' | 'used' | 'expired';

  /** 발급일 */
  issuedAt: Timestamp;

  /** 만료일 */
  expiresAt: Timestamp;

  /** 사용일 (사용된 경우) */
  usedAt?: Timestamp;

  /** 사용된 예약 ID (사용된 경우) */
  usedInReservationId?: string;

  /** 사용된 결제 ID (사용된 경우) */
  usedInPaymentId?: string;

  /** 생성일 */
  createdAt: Timestamp;

  /** 수정일 */
  updatedAt: Timestamp;
}

/**
 * 추천 코드 적용 요청
 */
export interface ApplyReferralCodeRequest {
  /** 추천 코드 */
  referralCode: string;
}

/**
 * 추천 코드 적용 응답
 */
export interface ApplyReferralCodeResponse {
  /** 성공 여부 */
  success: boolean;

  /** 발급된 쿠폰 정보 */
  userCoupon?: {
    id: string;
    couponName: string;
    couponDescription: string;
    discountAmount: number;
    expiresAt: string; // ISO 날짜 문자열
  };

  /** 오류 메시지 (실패한 경우) */
  error?: string;
}
