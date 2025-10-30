import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { type VehicleVariant, type VehicleGroup } from '../types';

interface TrimSelectionStepProps {
  selectedGroup: VehicleGroup;
  onTrimSelect: (variant: VehicleVariant, group: VehicleGroup) => void;
  onBack: () => void;
}

const TrimSelectionStep: React.FC<TrimSelectionStepProps> = ({
  selectedGroup,
  onTrimSelect,
  onBack,
}) => {
  const renderTrimItem = (variant: VehicleVariant) => (
    <TouchableOpacity
      key={variant.id}
      style={styles.trimItem}
      onPress={() => onTrimSelect(variant, selectedGroup)}
      activeOpacity={0.7}
    >
      <View style={styles.trimInfo}>
        <View style={styles.trimImageContainer}>
          {selectedGroup.imageUrl ? (
            <Image 
              source={{ uri: selectedGroup.imageUrl }} 
              style={styles.trimImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="car-outline" size={40} color="#9CA3AF" />
          )}
        </View>
        
        <View style={styles.trimDetails}>
          <Text style={[styles.trimName, convertToLineSeedFont(styles.trimName)]}>
            {variant.variantName}
          </Text>
          
          <Text style={[styles.trimFullModel, convertToLineSeedFont(styles.trimFullModel)]}>
            {variant.fullModel}
          </Text>
          
          {variant.batteryCapacity && (
            <Text style={[styles.trimSpecs, convertToLineSeedFont(styles.trimSpecs)]}>
              배터리: {variant.batteryCapacity}
            </Text>
          )}
          
          {variant.range && (
            <Text style={[styles.trimSpecs, convertToLineSeedFont(styles.trimSpecs)]}>
              주행거리: {variant.range}
            </Text>
          )}
          
          {variant.availableYears && variant.availableYears.length > 0 && (
            <Text style={[styles.trimYears, convertToLineSeedFont(styles.trimYears)]}>
              {Math.min(...variant.availableYears)}-{Math.max(...variant.availableYears)}년형
            </Text>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      {/* 선택된 모델 정보 */}
      <View style={styles.selectedModelHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.modelInfo}>
          <View style={styles.modelImageContainer}>
            {selectedGroup.imageUrl ? (
              <Image 
                source={{ uri: selectedGroup.imageUrl }} 
                style={styles.modelImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="car-outline" size={32} color="#9CA3AF" />
            )}
          </View>
          
          <View style={styles.modelDetails}>
            <Text style={[styles.modelName, convertToLineSeedFont(styles.modelName)]}>
              {selectedGroup.baseModel}
            </Text>
            <Text style={[styles.brandName, convertToLineSeedFont(styles.brandName)]}>
              {selectedGroup.make}
            </Text>
          </View>
        </View>
      </View>

      {/* 트림 목록 */}
      <ScrollView 
        style={styles.trimList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.trimListContent}
      >
        <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
          트림 선택
        </Text>
        
        {selectedGroup.variants.map(variant => renderTrimItem(variant))}
      </ScrollView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  selectedModelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    marginRight: 16,
  },
  modelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelImageContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modelImage: {
    width: 40,
    height: 40,
  },
  modelDetails: {
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 14,
    color: '#6B7280',
  },
  trimList: {
    flex: 1,
  },
  trimListContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  trimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trimInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trimImageContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trimImage: {
    width: 40,
    height: 40,
  },
  trimDetails: {
    flex: 1,
  },
  trimName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  trimFullModel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  trimSpecs: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  trimYears: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default TrimSelectionStep;