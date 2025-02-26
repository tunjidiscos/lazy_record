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
        const userId = req.query.user_id;
        const storeId = req.query.store_id;

        const shopify_setting = await prisma.shopify_settings.findFirst({
          where: {
            store_id: Number(storeId),
            user_id: Number(userId),
            status: 1,
          },
        });

        if (shopify_setting) {
          return res.status(200).json({
            message: '',
            result: true,
            data: {
              id: shopify_setting.id,
              shop_name: shopify_setting.shop_name,
              api_key: shopify_setting.api_key,
              admin_api_access_token: shopify_setting.admin_api_access_token,
            },
          });
        }

        return res.status(200).json({ message: '', result: false, data: null });

      // const query = 'SELECT * FROM shopify_settings where user_id = ? and store_id = ? and status = ?';
      // const values = [userId, storeId, 1];
      // const [rows] = await connection.query(query, values);
      // if (Array.isArray(rows) && rows.length === 1) {
      //   const row = rows[0] as mysql.RowDataPacket;
      //   return res.status(200).json({
      //     message: '',
      //     result: true,
      //     data: {
      //       id: row.id,
      //       shop_name: row.shop_name,
      //       api_key: row.api_key,
      //       admin_api_access_token: row.admin_api_access_token,
      //     },
      //   });
      // }

      // return res.status(200).json({ message: '', result: false, data: null });

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
