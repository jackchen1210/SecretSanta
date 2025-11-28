
export interface Participant {
  id: string;
  name: string;
  assigneeId: string | null; // The ID of the person this participant is giving a gift to
  wishlist: string[];
  viewed: boolean; // Has this person revealed their target yet?
  secretToken: string; // Unique token for URL access
  isClaimed: boolean; // Has the participant set up their account/password?
  password?: string; // Optional password for re-entry from the main screen
}

export enum AppStage {
  SETUP = 'SETUP',
  ACTIVE = 'ACTIVE'
}

export interface GiftSuggestion {
  item: string;
  reason: string;
  estimatedPrice: string;
}
