export enum SplitType {
  EQUAL = 'EQUAL',
  UNEQUAL = 'UNEQUAL',
}

export interface Participant {
  user: string;
  amountOwed: number;
}

export interface Expense {
  _id: string;
  description: string;
  totalAmount: number;
  payer: string;
  splitType: SplitType;
  participants: Participant[];
  createdAt?: Date;
  updatedAt?: Date;
}
