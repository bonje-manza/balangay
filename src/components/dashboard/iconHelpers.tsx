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
} from 'lucide-react';

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
    default:
      return <CircleDollarSign className={className} />;
  }
}
