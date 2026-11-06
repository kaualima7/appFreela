export type PublicService = {
  id: number;
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  imageUrl: string | null;
  freelancer: {
    id: number;
    name: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
    } | null;
  };
};

export type FreelancerService = {
  id: number;
  freelancerId: number;
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
