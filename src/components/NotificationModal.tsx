import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { markAsRead, markAllAsRead, removeNotification } from '../store/slices/notificationSlice';
import { InAppNotification } from '../store/slices/notificationSlice';
import notificationService from '../services/notificationService';
import devLog from '../utils/devLog';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;
    
    try {
      // Firebase와 Redux 모두 업데이트
      await notificationService.markInAppNotificationAsRead(user.uid, notificationId);
    } catch (error) {
      devLog.error('알림 읽음 처리 실패:', error);
      // 에러 발생 시 Redux만 업데이트
      dispatch(markAsRead(notificationId));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      // Firebase와 Redux 모두 업데이트
      await notificationService.markAllInAppNotificationsAsRead(user.uid);
    } catch (error) {
      devLog.error('모든 알림 읽음 처리 실패:', error);
      // 에러 발생 시 Redux만 업데이트
      dispatch(markAllAsRead());
    }
  };

  const handleRemoveNotification = async (notificationId: string) => {
    if (!user?.uid) return;
    
    try {
      // Firebase와 Redux 모두 업데이트
      await notificationService.removeInAppNotification(user.uid, notificationId);
    } catch (error) {
      devLog.error('알림 삭제 실패:', error);
      // 에러 발생 시 Redux만 업데이트
      dispatch(removeNotification(notificationId));
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return '방금 전';
    } else if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getCategoryColor = (category: InAppNotification['category']) => {
    switch (category) {
      case 'reservation':
        return '#3B82F6';
      case 'report':
        return '#10B981';
      case 'announcement':
        return '#F59E0B';
      case 'marketing':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getCategoryLabel = (category: InAppNotification['category']) => {
    switch (category) {
      case 'reservation':
        return '예약';
      case 'report':
        return '리포트';
      case 'announcement':
        return '공지사항';
      case 'marketing':
        return '마케팅';
      default:
        return '일반';
    }
  };

  const renderNotificationItem = ({ item }: { item: InAppNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadItem
      ]}
      onPress={() => !item.isRead && handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) }
            ]}
          >
            <Text style={styles.categoryText}>
              {getCategoryLabel(item.category)}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveNotification(item.id)}
          style={styles.removeButton}
        >
          <Ionicons name="close" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
        {item.title}
      </Text>
      <Text style={styles.notificationBody}>
        {item.body}
      </Text>
      <Text style={styles.notificationDate}>
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>알림</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>모두 읽음</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
            <Text style={styles.emptyDescription}>
              새로운 알림이 있을 때 여기에 표시됩니다
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  markAllText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadItem: {
    backgroundColor: '#F8FAFC',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  removeButton: {
    padding: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationModal;