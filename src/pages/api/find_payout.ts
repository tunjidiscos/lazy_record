import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '.';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        const connection = await connectDatabase();
        const storeId = req.query.store_id;
        const network = req.query.network;
        const payoutStatus = req.query.payout_status;


        const query = 'SELECT * FROM payouts where payout_status = ? and store_id = ? and network = ? and status = ?';
        const values = [payoutStatus, storeId, network, 1];
        const [rows] = await connection.query(query, values);

        console.log("111", storeId, network, payoutStatus, query)


        return res.status(200).json({ message: '', result: true, data: rows });
      case 'POST':
        break;
      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '', result: false, data: e });
  }
}
