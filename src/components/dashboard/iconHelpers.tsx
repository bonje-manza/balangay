import React from 'react';
import {
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  Utensils,
  ShoppingCart,
  Bus,
  Zap,
  ShoppingBag,
  Heart,
  Home,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  CircleDollarSign,
  ArrowLeftRight,
  Coffee,
  GraduationCap,
  Dumbbell,
  Plane,
  Car,
  Wrench,
  Tv,
  Music,
  Dog,
  Baby,
  Sparkles,
  Shield,
  Smile,
  Fuel,
  Film,
  BookOpen,
} from 'lucide-react';

export const AVAILABLE_CATEGORY_COLORS = [
  { name: 'Butter', hex: '#FFED9E' },
  { name: 'Blossom', hex: '#F2C0CA' },
  { name: 'Pistachio', hex: '#DAE097' },
  { name: 'Sky', hex: '#A6CFF2' },
  { name: 'Peach', hex: '#FED7AA' },
  { name: 'Mint', hex: '#CCFBF1' },
  { name: 'Lavender', hex: '#E9D5FF' },
  { name: 'Amber', hex: '#FDE68A' },
] as const;

export const AVAILABLE_CATEGORY_ICONS: Array<{ name: string; label: string }> = [
  { name: 'Utensils', label: 'Food & Dining' },
  { name: 'Coffee', label: 'Coffee & Snacks' },
  { name: 'ShoppingCart', label: 'Groceries' },
  { name: 'Bus', label: 'Commute' },
  { name: 'Car', label: 'Car & Gas' },
  { name: 'Plane', label: 'Travel' },
  { name: 'Zap', label: 'Utilities' },
  { name: 'Home', label: 'Housing' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Heart', label: 'Health' },
  { name: 'Dumbbell', label: 'Fitness' },
  { name: 'GraduationCap', label: 'Education' },
  { name: 'BookOpen', label: 'Books & Learning' },
  { name: 'Tv', label: 'Entertainment' },
  { name: 'Music', label: 'Music & Hobbies' },
  { name: 'Dog', label: 'Pets' },
  { name: 'Baby', label: 'Family' },
  { name: 'Sparkles', label: 'Personal Care' },
  { name: 'Wrench', label: 'Maintenance' },
  { name: 'Shield', label: 'Insurance' },
  { name: 'Briefcase', label: 'Work & Salary' },
  { name: 'Laptop', label: 'Freelance & Tech' },
  { name: 'Gift', label: 'Gifts & Charity' },
  { name: 'TrendingUp', label: 'Investments' },
  { name: 'CreditCard', label: 'Fees & Finance' },
];

/**
 * Renders account icon with fallback to Wallet.
 */
export function renderAccountIcon(iconName: string, className = 'w-4 h-4'): React.ReactNode {
  switch (iconName) {
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    default:
      return <Wallet className={className} />;
  }
}

/**
 * Renders category icon with fallback to CircleDollarSign.
 */
export function renderCategoryIcon(iconName?: string, className = 'w-4 h-4'): React.ReactNode {
  switch (iconName) {
    case 'Utensils':
      return <Utensils className={className} />;
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Bus':
      return <Bus className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'ArrowLeftRight':
      return <ArrowLeftRight className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Dog':
      return <Dog className={className} />;
    case 'Baby':
      return <Baby className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Smile':
      return <Smile className={className} />;
    case 'Fuel':
      return <Fuel className={className} />;
    case 'Film':
      return <Film className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    default:
      return <CircleDollarSign className={className} />;
  }
}
