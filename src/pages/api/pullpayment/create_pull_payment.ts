import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { GenerateOrderIDByTime } from 'utils/number';
import { PULL_PAYMENT_STATUS } from 'packages/constants';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'POST':
        const prisma = new PrismaClient();
        const userId = req.body.user_id;
        const storeId = req.body.store_id;
        const network = req.body.network;

        const pullPaymentId = GenerateOrderIDByTime();
        const name = req.body.name;
        const amount = req.body.amount;
        const currency = req.body.currency;
        const showAutoApproveClaim = req.body.show_auto_approve_claim;
        const description = req.body.description;
        const createdDate = new Date();

        // const expirationDate = createdDate.setDate(createdDate + 7)

        const expirationDate = new Date(createdDate.setDate(createdDate.getDate() + 7));

        const pull_payment = await prisma.pull_payments.create({
          data: {
            user_id: userId,
            store_id: storeId,
            network: network,
            pull_payment_id: pullPaymentId,
            name: name,
            amount: amount,
            currency: currency,
            show_auto_approve_claim: showAutoApproveClaim,
            description: description,
            pull_payment_status: PULL_PAYMENT_STATUS.Active,
            expiration_at: expirationDate,
            status: 1,
          },
        });

        if (!pull_payment) {
          return res.status(200).json({ message: 'Something wrong', result: false, data: null });
        }

        return res.status(200).json({
          message: '',
          result: true,
          data: {
            id: pull_payment.id,
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
