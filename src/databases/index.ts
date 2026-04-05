import { DB_URL, DB_HOST, DB_PORT, DB_DATABASE } from '@config';

export const dbConnection = {
  url: DB_URL || `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
