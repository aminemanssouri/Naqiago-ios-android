export interface Booking {
  id: string;
  workerId: string;
  workerName: string;
  workerAvatar: string;
  workerRating: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  date: string;
  time: string;
  location: string;
  carType: string;
  price: number;
  bookingDate: string;
  notes?: string;
  canCancel: boolean;
  canReschedule: boolean;
  canRate: boolean;
}

export const mockBookings: Booking[] = [
  {
    id: "CW123456",
    workerId: "1",
    workerName: "Ahmed Benali",
    workerAvatar: "/professional-car-washer-ahmed.png",
    workerRating: 4.8,
    status: "confirmed",
    date: "2024-01-25",
    time: "10:00",
    location: "123 Avenue Mohammed V, Marrakech",
    carType: "Sedan",
    price: 80,
    bookingDate: "2024-01-20",
    notes: "Please focus on the interior cleaning",
    canCancel: true,
    canReschedule: true,
    canRate: false,
  },
  {
    id: "CW123455",
    workerId: "2",
    workerName: "Youssef Alami",
    workerAvatar: "/professional-car-washer-youssef.png",
    workerRating: 4.9,
    status: "in-progress",
    date: "2024-01-22",
    time: "14:30",
    location: "456 Rue de la Liberté, Marrakech",
    carType: "SUV",
    price: 98,
    bookingDate: "2024-01-18",
    canCancel: false,
    canReschedule: false,
    canRate: false,
  },
  {
    id: "CW123454",
    workerId: "3",
    workerName: "Hassan Idrissi",
    workerAvatar: "/professional-car-washer-hassan.png",
    workerRating: 4.7,
    status: "completed",
    date: "2024-01-15",
    time: "09:00",
    location: "789 Boulevard Zerktouni, Marrakech",
    carType: "Hatchback",
    price: 72,
    bookingDate: "2024-01-12",
    canCancel: false,
    canReschedule: false,
    canRate: true,
  },
  {
    id: "CW123453",
    workerId: "4",
    workerName: "Omar Tazi",
    workerAvatar: "/professional-car-washer-omar.png",
    workerRating: 4.6,
    status: "completed",
    date: "2024-01-08",
    time: "16:00",
    location: "321 Avenue Hassan II, Marrakech",
    carType: "Van",
    price: 98,
    bookingDate: "2024-01-05",
    canCancel: false,
    canReschedule: false,
    canRate: false,
  },
  {
    id: "CW123452",
    workerId: "1",
    workerName: "Ahmed Benali",
    workerAvatar: "/professional-car-washer-ahmed.png",
    workerRating: 4.8,
    status: "cancelled",
    date: "2024-01-10",
    time: "11:00",
    location: "654 Rue Yougoslavie, Marrakech",
    carType: "Sedan",
    price: 80,
    bookingDate: "2024-01-07",
    canCancel: false,
    canReschedule: false,
    canRate: false,
  },
];
