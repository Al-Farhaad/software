export interface Contributor {
  _id: string;
  contributorId: string;
  name: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContributorInput {
  name: string;
  phoneNo?: string;
  email?: string;
  address?: string;
}
