import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '.';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'PUT':
        const connection = await connectDatabase();
        const id = req.body.id;
        const userId = req.body.user_id;
        const storeId = req.body.store_id;

        const title = req.body.title;
        const amount = req.body.amount;
        const currency = req.body.currency;
        const allowCustomAmount = req.body.allow_custom_amount;
        const expirationDate = req.body.expiration_date;
        const email = req.body.email;
        const requestCustomerData = req.body.request_customer_data;
        const memo = req.body.memo;

        let updateQuery = 'UPDATE payment_requests SET ';
        let updateValues = [];
        if (title) {
          updateQuery += 'title = ?,';
          updateValues.push(title);
        }
        if (amount) {
          updateQuery += 'amount = ?,';
          updateValues.push(amount);
        }
        if (currency) {
          updateQuery += 'currency = ?,';
          updateValues.push(currency);
        }
        if (allowCustomAmount) {
          updateQuery += 'allow_custom_amount = ?,';
          updateValues.push(allowCustomAmount);
        }
        if (expirationDate) {
          updateQuery += 'expiration_date = ?,';
          updateValues.push(expirationDate);
        }
        if (email) {
          updateQuery += 'email = ?,';
          updateValues.push(email);
        }
        if (requestCustomerData) {
          updateQuery += 'request_customer_data = ?,';
          updateValues.push(requestCustomerData);
        }
        if (memo) {
          updateQuery += 'memo = ?,';
          updateValues.push(memo);
        }

        updateQuery = updateQuery.slice(0, -1);

        updateQuery += ' WHERE id = ? and user_id = ? and store_id = ? and status = ?';
        updateValues.push(id, userId, storeId, 1);

        await connection.query(updateQuery, updateValues);

        return res.status(200).json({
          message: '',
          result: true,
          data: null,
        });
      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'no support the api', result: false, data: e });
  }
}
