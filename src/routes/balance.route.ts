// routes/balance.route.ts

import { Router } from 'express';
import BalanceController from '@/controllers/balance.controller';
import { Routes } from '@interfaces/routes.interface';

class BalanceRoute implements Routes {
    public path = '/expenses';
    public router = Router();
    public balanceController = new BalanceController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/balances`, this.balanceController.getBalances);
        this.router.get(`${this.path}/settlements`, this.balanceController.getSettlements);
    }
}

export default BalanceRoute;