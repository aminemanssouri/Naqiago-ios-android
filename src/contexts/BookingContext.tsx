import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BookingData {
  // Worker info
  workerId: string;
  workerName: string;
  basePrice: number;
  
  // Service info (required for database)
  serviceId: string;
  serviceName?: string;
  estimatedDuration: number;
  
  // Location
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Date & Time
  date: string;
  time: string;
  
  // Vehicle info (mapped to database fields)
  vehicleType: string; // Dynamic - comes from API type field (e.g. 'Berline', 'Citadine', 'Suv', 'Motorcycles', etc.)
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  licensePlate?: string;
  
  // Legacy fields for backward compatibility
  carType: string;
  carBrand: string;
  carModel?: string;
  carYear?: string;
  
  // Services
  selectedServices: string[];
  servicesTotal: number;
  
  // Payment
  paymentMethod: string;
  change?: number;
  
  // Additional info
  notes: string;
  
  // Calculated
  finalPrice: number;
}

interface BookingContextType {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBookingData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const defaultBookingData: BookingData = {
  workerId: '',
  workerName: '',
  basePrice: 0,
  serviceId: '',
  serviceName: '',
  estimatedDuration: 60, // Default 60 minutes
  address: '',
  date: '',
  time: '',
  vehicleType: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: undefined,
  vehicleColor: '',
  licensePlate: '',
  // Legacy fields for backward compatibility
  carType: '',
  carBrand: '',
  carModel: '',
  carYear: '',
  selectedServices: [],
  servicesTotal: 0,
  paymentMethod: 'cash',
  change: undefined,
  notes: '',
  finalPrice: 0,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(defaultBookingData);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // DateTime, Vehicle, Services, Location, Payment

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const resetBookingData = () => {
    setBookingData(defaultBookingData);
    setCurrentStep(1);
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        updateBookingData,
        resetBookingData,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

