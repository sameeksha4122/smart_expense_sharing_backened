import { model, Schema, Document } from 'mongoose';
import { Balance } from '@interfaces/balances.interface';

const balanceSchema: Schema = new Schema(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

balanceSchema.index({ user1: 1, user2: 1 }, { unique: true });

const balanceModel = model<Balance & Document>('Balance', balanceSchema);

export default balanceModel;