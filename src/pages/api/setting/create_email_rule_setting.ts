import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'POST':
        const prisma = new PrismaClient();
        // const connection = await connectDatabase();
        const userId = req.body.user_id;
        const storeId = req.body.store_id;

        const tigger = req.body.tigger;
        const recipients = req.body.recipients;
        const showSendToBuyer = req.body.show_send_to_buyer;
        const subject = req.body.subject;
        const body = req.body.body;

        const email_rule_setting = await prisma.email_rule_settings.create({
          data: {
            user_id: userId,
            store_id: storeId,
            tigger: tigger,
            recipients: recipients,
            show_send_to_buyer: showSendToBuyer,
            subject: subject,
            body: body,
            status: 1,
          },
        });

        if (!email_rule_setting) {
          return res.status(200).json({ message: '', result: false, data: null });
        } else {
          return res.status(200).json({
            message: '',
            result: true,
            data: {
              id: email_rule_setting.id,
            },
          });
        }

      // const createQuery =
      //   'INSERT INTO email_rule_settings (user_id, store_id, tigger, recipients, show_send_to_buyer, subject, body, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      // const createValues = [userId, storeId, tigger, recipients, showSendToBuyer, subject, body, 1];
      // const [ResultSetHeader]: any = await connection.query(createQuery, createValues);
      // const id = ResultSetHeader.insertId;
      // if (id === 0) {
      //   return res.status(200).json({ message: 'Something wrong', result: false, data: null });
      // }

      // return res.status(200).json({
      //   message: '',
      //   result: true,
      //   data: {
      //     id: id,
      //   },
      // });
      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'no support the api', result: false, data: e });
  }
}
