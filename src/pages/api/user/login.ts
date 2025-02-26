import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import CryptoJS from 'crypto-js';
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'POST':
        const prisma = new PrismaClient();
        // const connection = await connectDatabase();
        const email = req.body.email;
        const password = req.body.password;
        const cryptoPassword = CryptoJS.SHA256(password).toString();

        const user = await prisma.users.findFirst({
          where: {
            email: email,
            password: cryptoPassword,
            status: 1,
          },
        });

        if (!user) {
          return res.status(200).json({ message: '', result: false, data: null });
        }

        return res.status(200).json({
          message: '',
          result: true,
          data: {
            id: user?.id,
            email: user?.email,
            username: user?.username,
          },
        });

      // const query = 'SELECT * FROM users where email = ? AND password = ? limit 1';
      // const values = [email, cryptoPassword];
      // const [rows] = await connection.query(query, values);
      // if (Array.isArray(rows) && rows.length === 1) {
      //   const row = rows[0] as mysql.RowDataPacket;
      //   return res.status(200).json({
      //     message: '',
      //     result: true,
      //     data: {
      //       id: row.id,
      //       email: row.email,
      //       username: row.username,
      //     },
      //   });
      // }

      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '', result: false, data: e });
  }
}
