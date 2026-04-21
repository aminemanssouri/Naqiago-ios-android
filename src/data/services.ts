import { Wrench, Sparkles, Droplets, Brush, SprayCan } from 'lucide-react-native';

export type ServiceItem = {
  key: string;
  title: string;
  desc: string;
  price: number;
  // We store icon name indirectly; consumers can choose icon components
  icon: 'Droplets' | 'Sparkles' | 'Wrench' | 'Brush' | 'SprayCan';
};

export const SERVICES: ServiceItem[] = [
  { key: 'basic', title: 'Basic Wash', desc: 'Exterior wash and dry', price: 60, icon: 'Droplets' },
  { key: 'deluxe', title: 'Deluxe Wash', desc: 'Exterior + interior clean', price: 120, icon: 'Sparkles' },
  { key: 'deep', title: 'Deep Clean', desc: 'Full detailing in/out', price: 220, icon: 'Wrench' },
  { key: 'interior', title: 'Interior Detail', desc: 'Vacuum and interior detail', price: 140, icon: 'Brush' },
  { key: 'pro', title: 'Pro Package', desc: 'Rinse, wax, and shine', price: 260, icon: 'SprayCan' },
];

export function getServiceByKey(key: string): ServiceItem | undefined {
  return SERVICES.find(s => s.key === key);
}

export function iconFor(name: ServiceItem['icon']) {
  switch (name) {
    case 'Droplets': return Droplets;
    case 'Sparkles': return Sparkles;
    case 'Wrench': return Wrench;
    case 'Brush': return Brush;
    case 'SprayCan': return SprayCan;
  }
}
