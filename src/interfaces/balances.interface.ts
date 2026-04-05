import { Types } from 'mongoose';

export interface Balance {
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
}