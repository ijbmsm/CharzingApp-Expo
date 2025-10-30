import { useState } from 'react';
import { type Vehicle, type VehicleVariant } from '../types';

export const useVehicleSelection = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTrimVariant, setSelectedTrimVariant] = useState<VehicleVariant | null>(null);
  const [yearSpecs, setYearSpecs] = useState<{[year: number]: string}>({});
  
  // 화면 상태 관리
  const [showBrandSelection, setShowBrandSelection] = useState(true);
  const [showYearSelection, setShowYearSelection] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 검색 관련
  const [searchQuery, setSearchQuery] = useState('');

  const resetSelection = () => {
    setSelectedBrand(null);
    setSelectedVehicle(null);
    setSelectedTrimVariant(null);
    setYearSpecs({});
    setShowBrandSelection(true);
    setShowYearSelection(false);
    setExpandedGroups(new Set());
    setSearchQuery('');
  };

  const resetToModelSelection = () => {
    setShowBrandSelection(false);
    setShowYearSelection(false);
    setExpandedGroups(new Set());
    setSearchQuery('');
  };

  return {
    // Selection state
    selectedBrand,
    setSelectedBrand,
    selectedVehicle,
    setSelectedVehicle,
    selectedTrimVariant,
    setSelectedTrimVariant,
    yearSpecs,
    setYearSpecs,
    
    // Screen state
    showBrandSelection,
    setShowBrandSelection,
    showYearSelection,
    setShowYearSelection,
    expandedGroups,
    setExpandedGroups,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Actions
    resetSelection,
    resetToModelSelection,
  };
};