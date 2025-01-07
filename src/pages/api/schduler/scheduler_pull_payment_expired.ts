import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { PULL_PAYMENT_STATUS } from 'packages/constants';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        console.log('Schduler Task: Checkout status of pull payment');
        const connection = await connectDatabase();
        const query = 'SELECT * FROM pull_payments where pull_payment_status = ? and status = ?';
        const values = [PULL_PAYMENT_STATUS.Active, 1];
        const [rows] = await connection.query(query, values);

        if (Array.isArray(rows) && rows.length > 0) {
          const items = rows as mysql.RowDataPacket[];

          items.forEach(async (item) => {
            const currentTime = Date.now();
            const remainingTime = item.expiration_date - currentTime;

            if (remainingTime <= 0) {
              // update status from processing to expired
              const update_query = 'UPDATE pull_payments set pull_payment_status = ? where id = ? and status = 1';
              const update_values = [PULL_PAYMENT_STATUS.Expired, item.id];
              await connection.query(update_query, update_values);
            }
          });
        }

        return res.status(200).json({ message: '', result: true, data: null });
      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '', result: false, data: e });
  }
}
