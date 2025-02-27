import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'POST':
        const prisma = new PrismaClient();
        const userId = req.body.user_id;
        const storeId = req.body.store_id;

        const smtpServer = req.body.smtp_server;
        const port = req.body.port;
        const senderEmail = req.body.sender_email;
        const login = req.body.login;
        const password = req.body.password;
        const showTls = req.body.show_tls;

        const email_setting = await prisma.email_settings.create({
          data: {
            user_id: userId,
            store_id: storeId,
            smtp_server: smtpServer,
            port: port,
            sender_email: senderEmail,
            login: login,
            password: password,
            show_tls: showTls,
            status: 1,
          },
        });

        if (!email_setting) {
          return res.status(200).json({ message: '', result: false, data: null });
        }
        return res.status(200).json({
          message: '',
          result: true,
          data: {
            id: email_setting.id,
          },
        });

      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'no support the api', result: false, data: e });
  }
}
