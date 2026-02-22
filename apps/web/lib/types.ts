export type Accompanist = {
  uid: string;
  displayName: string;
  region: string;
  specialties: string[];
  purposes: string[];
  priceMin: number;
  priceMax: number;
  bio: string;
  education: string;
  experience: string;
  portfolioLinks: string[];
  availableSlots: string;
  isPublic: boolean;
};

export type RequestDoc = {
  id: string;
  accompanistUid: string;
  status: "pending" | "accepted" | "rejected";
  purpose: string;
  instrument: string;
  repertoire: string;
  schedule: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  options: {
    sightReading: boolean;
    sameDayRehearsal: boolean;
    recording: boolean;
    provideSheet: boolean;
  };
  note?: string;
  contactUnlocked: boolean;
  createdAt?: any;
};
