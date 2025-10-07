import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddVehicleCardProps {
  onPress: () => void;
  isAuthenticated: boolean;
}

const AddVehicleCard: React.FC<AddVehicleCardProps> = ({ onPress, isAuthenticated }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="car-outline" size={48} color="#6B7280" />
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isAuthenticated ? '내 차량 추가' : '로그인하고 내 차량 추가하기'}
          </Text>
          <Text style={styles.subtitle}>
            {isAuthenticated 
              ? '차량을 등록하여 맞춤 진단을 받아보세요'
              : '로그인 후 차량을 등록할 수 있습니다'
            }
          </Text>
        </View>
        
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    height: 150,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  plusBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4495E8',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default AddVehicleCard;