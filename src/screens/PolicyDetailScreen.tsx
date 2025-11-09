import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { RootStackParamList } from '../navigation/RootNavigator';

type PolicyDetailRouteProp = RouteProp<RootStackParamList, 'PolicyDetail'>;

interface ParsedSection {
  type: 'article' | 'heading' | 'bullet' | 'numberedList' | 'text';
  content: string;
  number?: string;
}

const PolicyDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyDetailRouteProp>();
  const { title, content } = route.params;

  // 텍스트를 섹션별로 파싱
  const parseContent = (text: string): ParsedSection[] => {
    const lines = text.split('\n');
    const sections: ParsedSection[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue; // 빈 줄 무시
      }

      // 제N조 패턴 (예: "제1조 (목적)")
      if (/^제\d+조\s+\(.+\)/.test(trimmedLine)) {
        sections.push({
          type: 'article',
          content: trimmedLine,
        });
      }
      // 숫자. 패턴 (예: "1. 전액 환불 (100%)")
      else if (/^\d+\.\s+/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (match && match[1] && match[2]) {
          sections.push({
            type: 'heading',
            content: match[2],
            number: match[1],
          });
        }
      }
      // 불렛 포인트 (예: "• 필수 항목: ...")
      else if (trimmedLine.startsWith('•')) {
        sections.push({
          type: 'bullet',
          content: trimmedLine.substring(1).trim(),
        });
      }
      // 일반 텍스트
      else {
        sections.push({
          type: 'text',
          content: trimmedLine,
        });
      }
    }

    return sections;
  };

  const renderSection = (section: ParsedSection, index: number) => {
    switch (section.type) {
      case 'article':
        return (
          <View key={index} style={styles.articleContainer}>
            <View style={styles.articleBadge}>
              <Ionicons name="document-text" size={16} color="#06B6D4" />
            </View>
            <Text style={styles.articleText}>{section.content}</Text>
          </View>
        );

      case 'heading':
        return (
          <View key={index} style={styles.headingContainer}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{section.number}</Text>
            </View>
            <Text style={styles.headingText}>{section.content}</Text>
          </View>
        );

      case 'bullet':
        return (
          <View key={index} style={styles.bulletContainer}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{section.content}</Text>
          </View>
        );

      case 'text':
        return (
          <Text key={index} style={styles.regularText}>
            {section.content}
          </Text>
        );

      default:
        return null;
    }
  };

  const parsedSections = parseContent(content);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        title={title}
        showLogo={false}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          {parsedSections.map((section, index) => renderSection(section, index))}
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
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 조항 스타일 (제N조)
  articleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginBottom: 12,
  },
  articleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
  },
  // 숫자 헤딩 스타일
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    marginTop: 16,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  numberBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  // 불렛 포인트 스타일
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    marginLeft: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06B6D4',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  // 일반 텍스트 스타일
  regularText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginVertical: 4,
    marginLeft: 8,
  },
});

export default PolicyDetailScreen;
