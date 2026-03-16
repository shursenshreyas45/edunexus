export type ListingCategory = 'Book' | 'Notes' | 'Bundle' | 'Tech';
export type ListingStatus = 'Available' | 'Reserved' | 'Sold';

export interface Listing {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    category: ListingCategory;
    condition: number; // 1 to 5
    price: number;
    status: ListingStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ListingFeedItem extends Listing {
    ownerFullName: string;
    ownerSchoolName: string | null;
}
