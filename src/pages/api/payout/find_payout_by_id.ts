import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        const prisma = new PrismaClient();
        // const connection = await connectDatabase();
        const payoutId = req.query.id;

        const payout = await prisma.payouts.findFirst({
          where: {
            payout_id: typeof payoutId === 'number' ? payoutId : 0,
            status: 1,
          },
        });

        if (!payout) {
          return res.status(200).json({ message: 'Something wrong', result: false, data: null });
        }
        return res.status(200).json({
          message: '',
          result: true,
          data: {
            address: payout.address,
            crypto: payout.crypto,
            currency: payout.currency,
            amount: payout.amount,
          },
        });

      // const query = 'SELECT * FROM payouts where payout_id = ? and status = ? ';
      // const values = [payoutId, 1];
      // const [rows] = await connection.query(query, values);
      // if (Array.isArray(rows) && rows.length === 1) {
      //   const row = rows[0] as mysql.RowDataPacket;
      //   return res.status(200).json({
      //     message: '',
      //     result: true,
      //     data: {
      //       address: row.address,
      //       crypto: row.crypto,
      //       currency: row.currency,
      //       amount: row.amount,
      //     },
      //   });
      // }

      // return res.status(200).json({ message: 'Something wrong', result: false, data: null });

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
