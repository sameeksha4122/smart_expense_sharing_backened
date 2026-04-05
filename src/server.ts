import 'reflect-metadata';
import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import ExpensesRoute from '@routes/expenses.route';
import BalanceRoute from '@routes/balance.route';
import validateEnv from '@utils/validateEnv';

validateEnv();

const app = new App([
    new IndexRoute(),
    new UsersRoute(),
    new AuthRoute(),
    new ExpensesRoute(),
    new BalanceRoute(),
]);

app.listen();
