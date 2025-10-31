import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

interface PolicyItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: string;
}

const TERMS_CONTENT = `제1조 (목적)
본 약관은 주식회사 블루코어(이하 "회사")가 운영하는 차징(CHARZING) 전기차 배터리 진단 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
• "서비스"란 회사가 운영하는 모바일 애플리케이션 및 웹사이트를 통해 제공되는 전기차 배터리 진단, 리포트 제공, 예약, 결제 등의 일체의 행위를 말합니다.
• "이용자"란 회사의 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 고객을 말합니다.
• "진단 기사"란 회사 또는 회사와 계약한 제3자 중 실제 진단 서비스를 수행하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
• 본 약관은 서비스를 이용하는 모든 이용자에게 적용됩니다.
• 회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경 시 앱 또는 홈페이지에 공지합니다.
• 변경된 약관은 공지 시점부터 효력이 발생합니다.

제4조 (서비스의 제공 및 성격)
• 회사는 전기차 배터리의 상태를 측정하여 데이터와 리포트를 제공하는 정보제공형 기술 서비스 사업자입니다.
• 회사는 자동차관리법상 정비업이 아니며, 차량의 수리·정비·보증 행위를 수행하지 않습니다.
• 진단 결과는 측정 시점의 데이터에 한정되며, 향후 차량 상태를 보증하지 않습니다.

제5조 (회원가입 및 로그인)
• 이용자는 카카오, 구글, 애플 계정을 통해 회원가입을 진행합니다.
• 이용자는 등록된 정보가 정확하지 않을 경우 서비스 이용이 제한될 수 있습니다.
• 회사는 허위 정보 입력, 비정상적 이용행위가 확인될 경우 사전 통보 없이 이용을 제한할 수 있습니다.

제6조 (이용계약의 성립)
• 이용자는 앱 또는 웹페이지에서 서비스 예약 및 결제를 완료함으로써 이용계약이 성립됩니다.
• 결제는 PG사를 통한 전자결제로 처리되며, 결제 금액은 회사 계좌로 직접 입금됩니다.

제7조 (회사의 의무)
• 회사는 관련 법령 및 본 약관에서 정한 바에 따라 서비스를 안정적으로 제공합니다.
• 회사는 이용자의 개인정보를 보호하며, 개인정보 처리방침을 준수합니다.
• 회사는 진단 결과에 대해 기술적·물리적 안정성을 확보하기 위해 합리적인 노력을 다합니다.

제8조 (이용자의 의무)
• 이용자는 차량의 합법적인 소유자이거나 소유자의 동의를 얻은 자여야 합니다.
• 이용자는 진단 과정에서 차량 접근 및 OBD2 포트 연결을 허용해야 합니다.
• 이용자는 회사의 서비스를 부정 사용하거나 타인의 권리를 침해하는 행위를 해서는 안 됩니다.

제9조 (서비스의 중단)
• 회사는 천재지변, 장비 고장, 통신 장애 등의 불가항력적인 사유로 인해 일시적으로 서비스를 중단할 수 있습니다.
• 이 경우 회사는 사전 또는 사후에 이용자에게 통보합니다.

제10조 (지식재산권)
• 서비스 내에서 제공되는 이미지, 데이터, 리포트 등 일체의 저작권은 회사에 귀속됩니다.
• 이용자는 회사의 사전 동의 없이 이를 복제, 배포, 전송할 수 없습니다.

제11조 (분쟁 해결 및 관할 법원)
• 본 약관에 따른 분쟁은 회사의 본사 소재지 관할 법원(서울중앙지방법원)을 제1심 전속 관할 법원으로 합니다.`;

const PRIVACY_CONTENT = `1. 개인정보의 수집 항목 및 방법

수집 항목
• 필수 항목: 이름, 연락처(전화번호), 차량번호, 차량모델, 예약일시, 결제정보
• 선택 항목: 이메일, 주행거리, 진단 요청 내용

수집 방법
• 앱 회원가입, 예약 페이지, 고객 문의, 제휴 플랫폼

2. 개인정보의 이용 목적
• 서비스 예약, 진단 수행, 리포트 발급, 고객 응대
• 결제 및 환불 처리
• 서비스 품질 향상 및 통계 분석

3. 개인정보의 보유 및 이용 기간
• 진단 리포트: 앱 내에서만 열람 가능하며, 서버에는 일시 저장 후 삭제
• 결제 및 거래정보: 「전자상거래법」에 따라 5년간 보관
• 민원·분쟁 처리 기록: 3년간 보관

4. 개인정보 제3자 제공 및 위탁
• 회사는 진단 수행을 위해 진단 기사에게 최소한의 정보를 제공합니다.
• 회사는 개인정보처리 위탁 시 개인정보보호법 제26조에 따른 계약을 체결하고 관리·감독합니다.

5. 개인정보의 파기 절차 및 방법
• 보유기간이 경과하거나 목적이 달성된 개인정보는 지체 없이 삭제됩니다.
• 전자 파일은 복구 불가능한 기술적 방법으로, 서류는 분쇄 또는 소각을 통해 파기합니다.

6. 이용자의 권리 및 행사 방법
• 이용자는 언제든지 본인의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
• 문의: info@charzing.kr / 070-8027-8903

7. 개인정보 보호책임자
• 성명: 주민성
• 직책: 대표이사
• 연락처: info@charzing.kr

8. 고지의 의무
• 본 방침은 2025년 10월 31일부터 적용됩니다.
• 변경 시 홈페이지 및 앱 공지사항을 통해 안내합니다.`;

const DISCLAIMER_CONTENT = `차징(CHARZING) 면책조항

차징(CHARZING)은 전기차 배터리 진단 데이터를 제공하는 기술 서비스로서, 배터리 성능, 안전, 수명, 결함 등을 보증하지 않습니다.

1. 진단 결과의 한계
• 진단 결과는 측정 시점의 데이터에 한정되며, 환경 조건·주행 이력·온도 등에 따라 변동될 수 있습니다.
• 회사는 진단 이후 발생하는 배터리 상태 변화에 대해 책임을 지지 않습니다.

2. 고객 판단 행위에 대한 면책
• 회사는 진단 결과를 근거로 한 매매, 수리, 운행 등 고객의 판단 행위에 대해 법적 책임을 지지 않습니다.
• 이용자는 진단 결과를 참고 자료로만 활용하며, 최종 의사결정은 본인의 책임 하에 이루어집니다.

3. 손해배상 책임의 한계
• 회사의 손해배상 책임은 이용자가 지불한 진단비 한도를 초과하지 않습니다.
• 단, 회사의 고의 또는 중대한 과실로 인한 손해는 예외로 합니다.

4. 서비스 이용 동의
• 이용자는 본 면책 조항의 내용을 충분히 이해하고 이에 동의한 경우에만 서비스를 이용합니다.
• 본 조항에 동의하지 않는 경우, 서비스 이용을 중단하시기 바랍니다.

5. 불가항력
• 천재지변, 전쟁, 테러, 정부의 규제 등 불가항력적 사유로 인한 서비스 중단 및 손해에 대해서는 책임을 지지 않습니다.`;

const REFUND_CONTENT = `제1조 (취소 및 환불 기준)

1. 전액 환불 (100%)
• 진단 예약 시간 48시간 이전 취소 시 전액 환불됩니다.

2. 환불 불가
• 진단 예약 시간 48시간 이내 취소
• 예약 시간에 미방문
• 연락두절

제2조 (예약 변경)

1. 변경 가능 조건
• 예약 변경은 1회에 한해 가능합니다.
• 변경 시점 기준 24시간 이상 남아있어야 합니다.

2. 변경 후 취소
• 변경 후 재취소 시 본 약관 제1조의 환불 기준이 동일하게 적용됩니다.

제3조 (서비스 불가 사유 발생 시)

1. 회사 귀책 사유
• 회사의 귀책 사유로 서비스가 중단된 경우, 해당 건은 전액 환불합니다.
• 추가 배상 책임은 없습니다.

2. 고객 귀책 사유
• 고객의 귀책 사유(차량 접근 불가, OBD2 포트 연결 불가 등)로 진단이 불가능한 경우 환불되지 않습니다.

제4조 (환불 절차)

1. 환불 요청
• 환불 요청은 고객센터 또는 이메일(info@charzing.kr)을 통해 접수합니다.
• 요청 시 예약번호, 결제정보를 함께 제공해야 합니다.

2. 환불 처리
• 회사는 접수일 기준 3영업일 이내에 환불을 처리합니다.
• 환불은 결제수단과 동일한 방법으로 이루어집니다.
• PG사 및 카드사 정책에 따라 실제 입금까지 추가 시일이 소요될 수 있습니다.

제5조 (유의사항)
• 본 약관은 「전자상거래 등에서의 소비자보호에 관한 법률」을 준수합니다.
• 약관 외 특별한 사정이 있는 경우 고객센터를 통해 개별 상담이 가능합니다.`;

const POLICIES: PolicyItem[] = [
  {
    id: 'terms',
    title: '이용약관',
    description: '서비스 이용에 관한 기본 약관 및 규정',
    icon: 'document-text-outline',
    content: TERMS_CONTENT,
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    description: '개인정보 수집 및 이용에 대한 정책',
    icon: 'shield-checkmark-outline',
    content: PRIVACY_CONTENT,
  },
  {
    id: 'disclaimer',
    title: '면책조항',
    description: '서비스 제공자의 책임 범위 및 한계',
    icon: 'alert-circle-outline',
    content: DISCLAIMER_CONTENT,
  },
  {
    id: 'refund',
    title: '환불 및 취소 약관',
    description: '예약 취소 및 환불 정책에 관한 사항',
    icon: 'card-outline',
    content: REFUND_CONTENT,
  },
];

const PolicyListScreen: React.FC = () => {
  const navigation = useNavigation();

  const handlePolicyPress = (policy: PolicyItem) => {
    navigation.navigate('PolicyDetail' as never, {
      title: policy.title,
      content: policy.content,
    } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="서비스 이용 정책"
        showLogo={false}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 안내 메시지 */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#06B6D4" />
          <Text style={styles.infoText}>
            차징 서비스 이용을 위한 필수 약관 및 정책입니다.{'\n'}
            각 항목을 눌러 자세한 내용을 확인하세요.
          </Text>
        </View>

        {/* 정책 목록 */}
        {POLICIES.map((policy, index) => (
          <TouchableOpacity
            key={policy.id}
            style={styles.policyCard}
            onPress={() => handlePolicyPress(policy)}
            activeOpacity={0.7}
          >
            <View style={styles.policyIconContainer}>
              <Ionicons name={policy.icon} size={28} color="#06B6D4" />
            </View>
            <View style={styles.policyContent}>
              <Text style={styles.policyTitle}>{policy.title}</Text>
              <Text style={styles.policyDescription}>{policy.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* 하단 안내 */}
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>
            정책은 관련 법령 및 회사 운영 방침에 따라 변경될 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  policyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomInfo: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  bottomInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PolicyListScreen;
