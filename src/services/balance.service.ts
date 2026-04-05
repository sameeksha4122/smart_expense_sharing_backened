import expenseModel from "@/models/expenses.model";


type BalanceMap = { [userId: string]: number };

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

class BalanceService {
  public expenses = expenseModel;

  public async getBalances() {
    // 1. Fetch all expenses
    const expenses = await expenseModel
      .find()
      .populate('payer participants.user', 'name');

    const balances: BalanceMap = {};

    // 2. Calculate net balances
    expenses.forEach(expense => {
      const payerId = expense.payer._id.toString();

      if (!balances[payerId]) balances[payerId] = 0;

      expense.participants.forEach((p: any) => {
        const userId = p.user._id.toString();
        const amount = p.amountOwed;

        if (!balances[userId]) balances[userId] = 0;

        if (userId === payerId) return;

        balances[payerId] += amount;
        balances[userId] -= amount;
      });
    });

    // 3. Separate creditors & debtors
    const creditors: { user: string; amount: number }[] = [];
    const debtors: { user: string; amount: number }[] = [];

    Object.entries(balances).forEach(([user, amount]) => {
      if (amount > 0) creditors.push({ user, amount });
      if (amount < 0) debtors.push({ user, amount: -amount });
    });

    // 4. Settlement
    const settlements: Settlement[] = [];

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const settledAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: Number(settledAmount.toFixed(2)),
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    // 5. Convert IDs → Names (Readable Output)
    const userMap = new Map<string, string>();

    expenses.forEach(expense => {
      userMap.set(expense.payer._id.toString(), expense.payer.name);

      expense.participants.forEach((p: any) => {
        userMap.set(p.user._id.toString(), p.user.name);
      });
    });

    // Human-readable settlement instructions
    const readableSettlements = settlements.map(s => {
      const fromName = userMap.get(s.from) || s.from;
      const toName = userMap.get(s.to) || s.to;

      return `${fromName} owes ${toName} ₹${Number(s.amount).toFixed(2)}`;
    });

    // Aggregated net balances per user (positive = owed, negative = owes)
    const readableBalances = Object.entries(balances)
      .map(([userId, amount]) => {
        const name = userMap.get(userId) || userId;
        const rounded = Number(amount).toFixed(2);
        const value = Number(rounded);

        if (value > 0) return `${name} is owed ₹${value.toFixed(2)}`;
        if (value < 0) return `${name} owes ₹${Math.abs(value).toFixed(2)}`;
        return `${name} is settled up`;
      })
      .filter(Boolean);

    return {
      settlements: readableSettlements,
      balances: readableBalances,
    };
  }
}


export default BalanceService;
