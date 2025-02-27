import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'PUT':
        const prisma = new PrismaClient();
        const id = req.body.id;
        const tigger = req.body.tigger;
        const recipients = req.body.recipients;
        const showSendToBuyer = req.body.show_send_to_buyer;
        const subject = req.body.subject;
        const body = req.body.body;

        const email_rule_setting = await prisma.email_rule_settings.update({
          data: {
            tigger: tigger,
            recipients: recipients,
            show_send_to_buyer: showSendToBuyer,
            subject: subject,
            body: body,
          },
          where: {
            id: id,
            status: 1,
          },
        });

        if (!email_rule_setting) {
          return res.status(200).json({ message: '', result: false, data: null });
        }

        return res.status(200).json({ message: '', result: true, data: null });

      default:
        throw 'no support the method of api';
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'no support the api', result: false, data: e });
  }
}
