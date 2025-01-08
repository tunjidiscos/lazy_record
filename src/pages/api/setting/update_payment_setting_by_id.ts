import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { ResponseData, CorsMiddleware, CorsMethod } from '..';

export default async function handle(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    switch (req.method) {
      case 'PUT':
        const connection = await connectDatabase();
        const id = req.body.id;
        const userId = req.body.user_id;
        const chainId = req.body.chain_id;
        const storeId = req.body.store_id;
        const network = req.body.network;

        const paymentExpire = req.body.payment_expire ? req.body.payment_expire : 0;
        const confirmBlock = req.body.confirm_block ? req.body.confirm_block : 0;
        const showRecommendedFee = req.body.show_recommended_fee ? req.body.show_recommended_fee : 0;
        const currentUsedAddressId = req.body.current_used_address_id;

        const query =
          'UPDATE payment_settings set payment_expire = ?, confirm_block = ?, show_recommended_fee = ?, current_used_address_id = ? where id = ? and user_id = ? and store_id = ? and chain_id = ? and network = ? and status = ?';
        const values = [
          paymentExpire,
          confirmBlock,
          showRecommendedFee,
          currentUsedAddressId,
          id,
          userId,
          storeId,
          chainId,
          network,
          1
        ];
        await connection.query(query, values);
        return res.status(200).json({ message: '', result: true, data: null });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '', result: false, data: e });
  }
}
