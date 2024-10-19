import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDatabase } from 'packages/db/mysql';
import { WEB3 } from 'packages/web3';
import { ResponseData, CorsMiddleware, CorsMethod } from '.';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    await CorsMiddleware(req, res, CorsMethod);

    // const connection = await connectDatabase();
    // await connection.query('SELECT * FROM users;');
    // const me = Bip39.generateMnemonic();
    // const seed = await Bip39.generateSeed(me);

    // const a = await WEB3.generateWallet("")
    // console.log("------", a)

    return res.status(200).json({ message: '', result: true, data: null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '', result: false, data: e });
  }
}

// const generateAddressesFromSeed = async (seed: string, walletCount: number) => {
//   let hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(seed));
//   let wallet_hdpath = "m/44'/60'/0'/0/";

//   let allAccs = [];
//   for (let i = 0; i < walletCount; i++) {
//       let wallet = hdwallet.derivePath(wallet_hdpath + i).getWallet();
//       let address = '0x' + wallet.getAddress().toString('hex');
//       let privateKey = wallet.getPrivateKey().toString('hex');
//       allAccs.push({ value: address, label: address, privateKey });
//   }
//   return allAccs;
// };
