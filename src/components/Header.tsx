import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import NotificationModal from './NotificationModal';

// Navigation types
type RootStackParamList = {
  Login: { showBackButton?: boolean; message?: string } | undefined;
  // Add other screens as needed
};

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  showNotification?: boolean;
  onLogoPress?: () => void;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showLogo = true,
  showBackButton = false,
  showNotification = true,
  onLogoPress,
  onBackPress,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const { unreadCount } = useSelector((state: RootState) => state.notification);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleNotificationPress = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setIsNotificationModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        )}
        
        {showLogo ? (
          <TouchableOpacity onPress={onLogoPress} style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}

        {showNotification && (
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            {isAuthenticated && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <NotificationModal
        visible={isNotificationModalVisible}
        onClose={() => setIsNotificationModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    height: 40,
    width: 120,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Header;