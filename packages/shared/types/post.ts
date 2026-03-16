export interface PostMetadata {
    tags: string[];
    upvotes: number;
}

export interface Post {
    id: string;
    authorId: string;
    title: string;
    content: string;
    metadata: PostMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostFeedItem extends Post {
    authorFullName: string;
    authorSchoolName: string | null;
}

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}
