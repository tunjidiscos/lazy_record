import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        const prisma = new PrismaClient();
        // const connection = await connectDatabase();
        const id = req.query.id;

        const webhook_setting = await prisma.webhook_settings.findFirst({
          where: {
            id: typeof id === 'number' ? id : 0,
            status: 1,
          },
        });

        if (webhook_setting) {
          return res.status(200).json({ message: '', result: true, data: webhook_setting });
        }

        return res.status(200).json({ message: '', result: false, data: null });

      // const query = 'SELECT * FROM webhook_settings where id = ? and status = ? ';
      // const values = [id, 1];
      // const [rows] = await connection.query(query, values);
      // return res.status(200).json({ message: '', result: true, data: rows });
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
