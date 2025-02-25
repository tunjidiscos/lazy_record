import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from 'pages/api';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        const prisma = new PrismaClient();
        // const connection = await connectDatabase();
        const storeId = req.query.store_id;
        const network = req.query.network;

        const address_books = await prisma.address_books.findMany({
          where: {
            store_id: typeof storeId === 'number' ? storeId : 0,
            network: typeof network === 'number' ? network : 0,
            status: 1,
          },
          orderBy: {
            id: 'desc',
          },
        });

        if (address_books) {
          return res.status(200).json({
            message: '',
            result: true,
            data: address_books,
          });
        }

        return res.status(200).json({ message: 'Something wrong', result: false, data: null });

      // const query = 'SELECT * FROM address_books where store_id = ? and network = ? and status = ? order by id desc';
      // const values = [storeId, network, 1];
      // const [rows] = await connection.query(query, values);
      // return res.status(200).json({
      //   message: '',
      //   result: true,
      //   data: rows,
      // });

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
