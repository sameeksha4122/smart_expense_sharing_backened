import { model, Schema, Document } from 'mongoose';
import { Expense, SplitType } from '@interfaces/expenses.interface';

const participantSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amountOwed: { type: Number, required: true },
}, { _id: false });

const expenseSchema: Schema = new Schema({
  description: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  payer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: Object.values(SplitType), required: true },
  participants: { type: [participantSchema], required: true },
}, { timestamps: true });

const expenseModel = model<Expense & Document>('Expense', expenseSchema);

export default expenseModel;
