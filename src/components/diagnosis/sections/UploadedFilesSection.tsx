import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface UploadedFilesSectionProps {
  pdfReports?: string[]; // PDF URL 배열
}

// 파일명 추출 (URL에서)
const getFileName = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    if (!fileNameWithParams) {
      return 'PDF 파일';
    }
    const fileName = fileNameWithParams.split('?')[0];
    if (!fileName) {
      return 'PDF 파일';
    }
    return decodeURIComponent(fileName);
  } catch (error) {
    return 'PDF 파일';
  }
};

// 파일 크기 가져오기 (실제로는 서버에서 가져와야 하지만, 여기서는 표시만)
const getFileSize = (): string => {
  return '-'; // 실제 구현 시 파일 크기 조회 필요
};

export const UploadedFilesSection: React.FC<UploadedFilesSectionProps> = ({ pdfReports }) => {
  if (!pdfReports || pdfReports.length === 0) {
    return null;
  }

  const handleFilePress = async (url: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('오류', '파일을 열 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '파일을 여는 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        업로드된 파일
      </Text>

      {/* 파일 목록 */}
      <View style={styles.filesList}>
        {pdfReports.map((url, index) => {
          const fileName = getFileName(url);
          const fileSize = getFileSize();

          return (
            <TouchableOpacity
              key={index}
              style={styles.fileCard}
              onPress={() => handleFilePress(url, fileName)}
              activeOpacity={0.7}
            >
              {/* 파일 아이콘 */}
              <View style={styles.fileIcon}>
                <Ionicons name="document-text" size={32} color="#EF4444" />
              </View>

              {/* 파일 정보 */}
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, convertToLineSeedFont(styles.fileName)]} numberOfLines={1}>
                  {fileName}
                </Text>
                <View style={styles.fileMetadata}>
                  <Text style={[styles.fileType, convertToLineSeedFont(styles.fileType)]}>
                    PDF 문서
                  </Text>
                  {fileSize !== '-' && (
                    <>
                      <Text style={[styles.fileSeparator, convertToLineSeedFont(styles.fileSeparator)]}>
                        •
                      </Text>
                      <Text style={[styles.fileSize, convertToLineSeedFont(styles.fileSize)]}>
                        {fileSize}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* 다운로드 버튼 */}
              <View style={styles.downloadButton}>
                <Ionicons name="download-outline" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 안내 메시지 */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={[styles.infoText, convertToLineSeedFont(styles.infoText)]}>
          파일을 탭하면 PDF 뷰어로 열립니다
        </Text>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  filesList: {
    gap: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileType: {
    fontSize: 13,
    color: '#6B7280',
  },
  fileSeparator: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  fileSize: {
    fontSize: 13,
    color: '#6B7280',
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
