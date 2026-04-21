// Mock worker data from original app/page.tsx
export interface Worker {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  avatar: any;
  location: { latitude: number; longitude: number };
  services: string[];
  price: number;
  isAvailable: boolean;
  area?: string;
  city?: string;
  country?: string;
}

// Generate random locations around Marrakech city center
const generateRandomLocation = (centerLat: number, centerLng: number, radiusKm: number) => {
  const radiusInDegrees = radiusKm / 111; // Approximate conversion
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: centerLat + x,
    longitude: centerLng + y,
  };
};

// Marrakech city center coordinates
const MARRAKECH_CENTER = { lat: 31.6295, lng: -7.9811 };

// Casablanca city center coordinates
const CASABLANCA_CENTER = { lat: 33.5731, lng: -7.5898 };

export const mockWorkers: Worker[] = [
  {
    id: "1",
    name: "Ahmed Benali",
    rating: 4.8,
    reviewCount: 127,
    services: ["Exterior Wash", "Interior Cleaning"],
    price: 80,
    avatar: require('../../assets/images/professional-car-washer-ahmed.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: true,
    area: "Gueliz",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "2",
    name: "Omar Hassan",
    rating: 4.9,
    reviewCount: 89,
    services: ["Premium Wash", "Wax & Polish"],
    price: 120,
    avatar: require('../../assets/images/professional-car-washer-omar.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: true,
    area: "Medina",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "3",
    name: "Hassan Berrada",
    rating: 4.7,
    reviewCount: 156,
    services: ["Engine Cleaning", "Tire Shine"],
    price: 150,
    avatar: require('../../assets/images/professional-car-washer-hassan.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: true,
    area: "Hivernage",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "4",
    name: "Youssef Alami",
    rating: 4.6,
    reviewCount: 203,
    services: ["Quick Wash", "Interior Vacuum"],
    price: 60,
    avatar: require('../../assets/images/professional-car-washer-youssef.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: false,
    area: "Agdal",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "5",
    name: "Khalid Mansouri",
    rating: 4.5,
    reviewCount: 94,
    services: ["Full Service", "Detailing"],
    price: 100,
    avatar: require('../../assets/images/professional-car-washer-ahmed.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: true,
    area: "Palmeraie",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "6",
    name: "Abdelaziz Tazi",
    rating: 4.9,
    reviewCount: 178,
    services: ["Luxury Wash", "Paint Protection"],
    price: 200,
    avatar: require('../../assets/images/professional-car-washer-hassan.png'),
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    isAvailable: true,
    area: "Gueliz",
    city: "Marrakech",
    country: "Morocco",
  },
  {
    id: "7",
    name: "Rachid El Fassi",
    rating: 4.7,
    reviewCount: 145,
    services: ["Premium Wash", "Interior Detailing"],
    price: 90,
    avatar: require('../../assets/images/professional-car-washer-ahmed.png'),
    location: generateRandomLocation(CASABLANCA_CENTER.lat, CASABLANCA_CENTER.lng, 5),
    isAvailable: true,
    area: "Maarif",
    city: "Casablanca",
    country: "Morocco",
  },
  {
    id: "8",
    name: "Karim Benjelloun",
    rating: 4.8,
    reviewCount: 167,
    services: ["Full Service", "Wax & Polish"],
    price: 110,
    avatar: require('../../assets/images/professional-car-washer-omar.png'),
    location: generateRandomLocation(CASABLANCA_CENTER.lat, CASABLANCA_CENTER.lng, 5),
    isAvailable: true,
    area: "Anfa",
    city: "Casablanca",
    country: "Morocco",
  },
  {
    id: "9",
    name: "Said Alaoui",
    rating: 4.6,
    reviewCount: 132,
    services: ["Quick Wash", "Engine Cleaning"],
    price: 75,
    avatar: require('../../assets/images/professional-car-washer-hassan.png'),
    location: generateRandomLocation(CASABLANCA_CENTER.lat, CASABLANCA_CENTER.lng, 5),
    isAvailable: true,
    area: "Ain Diab",
    city: "Casablanca",
    country: "Morocco",
  },
];
