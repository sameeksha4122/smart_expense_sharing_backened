import { CreateExpenseDto, SplitType } from '@dtos/expenses.dto';
import { HttpException } from '@exceptions/HttpException';
import { Expense } from '@interfaces/expenses.interface';
import balanceModel from '@models/balances.model';
import expenseModel from '@models/expenses.model';
import userModel from '@models/users.model';

type NormalizeResult = {
  user1: string;
  user2: string;
  amount: number;
};

export const normalize = (
  userA: string,
  userB: string,
  amount: number
): NormalizeResult => {
  if (userA < userB) {
    return { user1: userA, user2: userB, amount };
  } else {
    return { user1: userB, user2: userA, amount: -amount };
  }
};
class ExpenseService {
  public expenses = expenseModel;
  public users = userModel;
  public balances = balanceModel;

  public async findAllExpenses(): Promise<Expense[]> {
    const expenses: Expense[] = await this.expenses.find().populate('payer', 'name email').populate('participants.user', 'name email');
    return expenses;
  }

  public async deleteExpense(expenseId: string): Promise<Expense> {
    const deleteExpenseById: Expense = await this.expenses.findByIdAndDelete(expenseId);
    if (!deleteExpenseById) throw new HttpException(404, "Expense not found");

    const payerStr = deleteExpenseById.payer.toString();
    for (const p of deleteExpenseById.participants) {
      const debtorStr = p.user.toString();
      if (debtorStr === payerStr) continue;

      const user1 = debtorStr < payerStr ? debtorStr : payerStr;
      const user2 = debtorStr < payerStr ? payerStr : debtorStr;
      const amountChange = debtorStr < payerStr ? p.amountOwed : -p.amountOwed;

      await this.balances.findOneAndUpdate(
        { user1, user2 },
        { $inc: { amount: amountChange } }
      );
    }

    return deleteExpenseById;
  }


  public async createExpense(expenseData: CreateExpenseDto): Promise<Expense> {
    const { description, totalAmount, payer, splitType, participants } = expenseData;

    if (!description || !totalAmount || !payer || !splitType || !participants || participants.length === 0) {
      throw new HttpException(400, "Missing required fields");
    }

    if (totalAmount <= 0) {
      throw new HttpException(400, "Total amount must be greater than zero");
    }
    //verification
    const payerUser = await this.users.findById(payer);
    if (!payerUser) throw new HttpException(404, "Payer not found");

    let participantIds = participants.map(p => p.user.toString());

    // Ensure payer is included
    if (!participantIds.includes(payer.toString())) {
      participantIds.push(payer.toString());
    }

    const uniqueParticipants = [...new Set(participantIds)];

    const existingUsers = await this.users.find({ _id: { $in: uniqueParticipants } });
    if (existingUsers.length !== uniqueParticipants.length) {
      throw new HttpException(404, "One or more participants not found");
    }

    let calculatedParticipants: { user: string; amountOwed: number }[] = [];

    //handling splitype
    if (splitType === SplitType.EQUAL) {
      const count = uniqueParticipants.length;
      const splitAmount = Number((totalAmount / count).toFixed(2));

      let totalCalculated = 0;

      calculatedParticipants = uniqueParticipants.map((userId) => {
        totalCalculated += splitAmount;
        return { user: userId, amountOwed: splitAmount };
      });

      // Handle rounding remainder
      const remainder = Number((totalAmount - totalCalculated).toFixed(2));
      if (remainder !== 0) {
        calculatedParticipants[0].amountOwed = Number(
          (calculatedParticipants[0].amountOwed + remainder).toFixed(2)
        );
      }

    } else if (splitType === SplitType.UNEQUAL) {
      const totalProvided = participants.reduce((sum, p) => sum + (p.amountOwed || 0), 0);

      if (Math.abs(totalProvided - totalAmount) > 0.01) {
        throw new HttpException(
          400,
          `Total of split amounts (${totalProvided}) does not match expense total (${totalAmount})`
        );
      }

      calculatedParticipants = participants.map(p => ({
        user: p.user.toString(),
        amountOwed: Number((p.amountOwed).toFixed(2))
      }));

    }


    try {
      //Create Expense
      const createdExpense = await this.expenses.create({
        description,
        totalAmount,
        payer,
        splitType,
        participants: calculatedParticipants,
      });


      // Update Balances (Parallel)
      await Promise.all(
        calculatedParticipants.map(p => {
          const debtor = p.user.toString();
          const creditor = payer.toString();

          if (debtor === creditor) return Promise.resolve();

          // debtor owes creditor → creditor should get money
          const { user1, user2, amount } = normalize(
            creditor,
            debtor,
            p.amountOwed
          );

          return this.balances.findOneAndUpdate(
            { user1, user2 },
            {
              $inc: { amount }
            },
            {
              upsert: true,
              new: true
            }
          );
        })
      );
      return createdExpense;

    } catch (error) {
      throw error;
    }
  }




}

export default ExpenseService;
