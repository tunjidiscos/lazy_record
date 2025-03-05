import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { ORDER_STATUS } from 'packages/constants';
import { PrismaClient } from '@prisma/client';
import { BLOCKSCAN } from 'packages/web3/block_scan';
import { WEB3 } from 'packages/web3';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        console.log('Schedule Blockscan');
        const prisma = new PrismaClient();
        const now = new Date();

        const invoices = await prisma.invoices.findMany({
          where: {
            order_status: ORDER_STATUS.Processing,
            status: 1,
          },
        });

        if (!invoices) {
          return res.status(200).json({ message: '', result: false, data: null });
        }

        for (const item of invoices) {
          const txs = await BLOCKSCAN.getTransactionsByChainAndAddress(
            WEB3.getChainIds(Number(item.network) === 1 ? true : false, Number(item.chain_id)).toString(),
            item.destination_address,
          );

          if (!txs) {
            continue;
          }

          if (txs.transactions && txs.transactions.length > 0) {
            for (const txItem of txs.transactions) {
              if (
                String(txItem.address).toLowerCase() === String(item.destination_address).toLowerCase() &&
                String(txItem.transact_type) === 'receive' &&
                String(txItem.token) === String(item.crypto) &&
                Number(txItem.amount) === Number(item.crypto_amount) &&
                new Date(txItem.block_timestamp).getTime() > item.created_at.getTime()
              ) {
                const invoice = await prisma.invoices.update({
                  data: {
                    hash: txItem.hash,
                    from_address: txItem.from_address,
                    to_address: txItem.to_address,
                    order_status: ORDER_STATUS.Settled,
                    block_timestamp: txItem.block_timestamp,
                    paid: 1,
                  },
                  where: {
                    id: item.id,
                    order_status: ORDER_STATUS.Processing,
                    status: 1,
                  },
                });

                if (!invoice) {
                  continue;
                }

                let invoice_events = await prisma.invoice_events.createMany({
                  data: [
                    {
                      invoice_id: item.id,
                      order_id: item.order_id,
                      message: `Monitor the transaction hash: ${txItem.hash}`,
                      status: 1,
                    },
                    {
                      invoice_id: item.id,
                      order_id: item.order_id,
                      message: `Invoice status is Settled`,
                      status: 1,
                    },
                  ],
                });

                if (!invoice_events) {
                  continue;
                }

                break;
              }
            }
          }
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
