import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';
import { WEB3 } from 'packages/web3';
import { CHAINS, ETHEREUM_CATEGORY_CHAINS } from 'packages/constants/blockchain';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'GET':
        const connection = await connectDatabase();
        const walletId = req.query.wallet_id;
        const chainId = req.query.chain_id;
        const network = req.query.network;

        if (!chainId) {
          return res.status(200).json({ message: 'something wrong', result: false, data: '' });
        }

        let dbChainId = chainId || 0;

        if (ETHEREUM_CATEGORY_CHAINS.includes(parseInt(dbChainId as string))) {
          dbChainId = CHAINS.ETHEREUM;
        }

        const query =
          'SELECT id, address, note FROM addresses where wallet_id = ? and chain_id = ? and network = ? and status = ?';
        const values = [walletId, dbChainId, network, 1];
        const [rows] = await connection.query(query, values);

        let newRows: any[] = [];
        if (Array.isArray(rows) && rows.length > 0) {
          const promises = rows.map(async (item: any) => {
            return {
              id: item.id,
              address: item.address,
              note: item.note,
              balance: await WEB3.getAssetBalance(
                parseInt(network as string) === 1 ? true : false,
                parseInt(chainId as string),
                item.address,
              ),
              status: await WEB3.checkAccountStatus(
                parseInt(network as string) === 1 ? true : false,
                parseInt(chainId as string),
                item.address,
              ),
              transactions: await WEB3.getTransactions(
                parseInt(network as string) === 1 ? true : false,
                parseInt(chainId as string),
                item.address,
              ),
              // transactions: [],
            };
          });
          newRows = await Promise.all(promises);

          return res.status(200).json({ message: '', result: true, data: newRows });
        }

        return res.status(200).json({ message: '', result: false, data: null });
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
