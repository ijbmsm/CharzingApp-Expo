import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../components/Header';
import { RootStackParamList } from '../navigation/RootNavigator';

type PolicyDetailRouteProp = RouteProp<RootStackParamList, 'PolicyDetail'>;

const PolicyDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PolicyDetailRouteProp>();
  const { title, content } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={title}
        showLogo={false}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{content}</Text>
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
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
  },
});

export default PolicyDetailScreen;
