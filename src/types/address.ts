export type Address = {
  id: string;
  user_id: string;
  title?: string | null;
  address_line_1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instructions?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type NewAddressInput = {
  title?: string | null;
  address_line_1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instructions?: string | null;
  is_default?: boolean;
};

export type UpdateAddressInput = Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & {
  id: string;
};
