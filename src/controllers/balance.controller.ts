// controllers/balance.controller.ts

import BalanceService from '@/services/balance.service';
import { Request, Response, NextFunction } from 'express';

class BalanceController {
  public balanceService = new BalanceService();

  public getBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const balances = await this.balanceService.getBalances();

      return res.status(200).json({
        message: "Balances fetched successfully",
        data: balances
      });
    } catch (error) {
      next(error);
    }
  };

  public getSettlements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { settlements } = await this.balanceService.getBalances();
      return res.status(200).json({
        message: "Settlements fetched successfully",
        data: settlements
      });
    } catch (error) {
      next(error);
    }
  };
}

export default BalanceController;