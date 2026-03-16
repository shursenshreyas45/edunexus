export type UserTier = 'Junior' | 'Senior' | 'Mentor';

export interface User {
  id: string;
  email: string;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;
}
