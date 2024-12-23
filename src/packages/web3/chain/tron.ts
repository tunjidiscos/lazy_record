import axios from 'axios';
import { BLOCKCHAINNAMES, CHAINIDS, CHAINS } from 'packages/constants/blockchain';
import { AssetBalance, ChainAccountType, SendTransaction, TransactionDetail, TRANSACTIONSTATUS } from '../types';
import { HDKey } from 'ethereum-cryptography/hdkey';
import { TronWeb } from 'tronweb';
import { ethers } from 'ethers';
import { FindDecimalsByChainIdsAndContractAddress } from 'utils/web3';
import { TRC20Abi } from '../abi/trc20';
import { GetBlockchainTxUrl } from 'utils/chain/tron';

export class TRON {
  static chain = CHAINS.TRON;

  static axiosInstance = axios.create({
    timeout: 10000,
  });

  static getChainIds(isMainnet: boolean): CHAINIDS {
    return isMainnet ? CHAINIDS.TRON : CHAINIDS.TRON_NILE;
  }

  static async getTronClient(isMainnet: boolean) {
    return new TronWeb({
      fullHost: isMainnet ? 'https://api.trongrid.io' : 'https://nile.trongrid.io',
      headers: {
        'TRON-PRO-API-KEY': isMainnet ? process.env.TRON_API_KEY_MAINNET : process.env.TRON_API_KEY_NILE,
      },
    });
  }

  static createAccountBySeed(isMainnet: boolean, seed: Buffer): ChainAccountType {
    const path = `m/44'/195'/0'/0/0`;

    try {
      const hdkey = HDKey.fromMasterSeed(Uint8Array.from(seed)).derive(path);

      const privateKey = Buffer.from(hdkey.privateKey as Uint8Array).toString('hex');
      const address = TronWeb.address.fromPrivateKey(privateKey) as string;

      return {
        chain: this.chain,
        address: address,
        privateKey: privateKey,
        note: 'Tron',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of tron');
    }
  }

  static createAccountByPrivateKey(isMainnet: boolean, privateKey: string): ChainAccountType {
    try {
      const address = TronWeb.address.fromPrivateKey(privateKey) as string;

      return {
        chain: this.chain,
        address: address,
        privateKey: privateKey,
        note: 'Tron',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of tron');
    }
  }

  static checkAddress(address: string): boolean {
    return TronWeb.isAddress(address);
  }

  static checkQRCodeText(text: string): boolean {
    const regex = /tron:(\w+)(\?value=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;
    try {
      const matchText = text.match(regex);
      if (matchText) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static parseQRCodeText(text: string): any {
    const regex = /tron:(\w+)(\?value=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;

    try {
      const matchText = text.match(regex);
      if (matchText) {
        const address = matchText[1];
        const value = matchText[3] || 0;
        const decimal = matchText[4] || 18;
        const amount = ethers.formatUnits(value, decimal);
        const contractAddress = matchText[6] || undefined;

        return {
          address,
          amount,
          decimal,
          contractAddress,
        };
      } else {
        return;
      }
    } catch (e) {
      console.error(e);
      return;
    }
  }

  static async generateQRCodeText(
    isMainnet: boolean,
    address: string,
    contractAddress?: string,
    amount?: string,
  ): Promise<string> {
    let qrcodeText = `tron:${address}`;
    const decimal = contractAddress ? await this.getTRC20Decimals(isMainnet, contractAddress) : 6;

    amount = amount || '0';
    const value = ethers.parseUnits(amount, decimal).toString();

    qrcodeText += `?value=${value}&decimal=${decimal}`;

    if (contractAddress) {
      qrcodeText += `&contractAddress=${contractAddress}`;
    }

    return qrcodeText;
  }

  static async getAssetBalance(isMainnet: boolean, address: string): Promise<AssetBalance> {
    try {
      let items = {} as AssetBalance;
      items.TRX = await this.getTRXBalance(isMainnet, address);

      const coins = BLOCKCHAINNAMES.find((item) => item.chainId === this.getChainIds(isMainnet))?.coins;
      if (coins && coins.length > 0) {
        const tokens = coins.filter((item) => !item.isMainCoin);

        const promises = tokens.map(async (token) => {
          if (token.contractAddress && token.contractAddress !== '') {
            const balance = await this.getTRC20Balance(isMainnet, address, token.contractAddress);
            items[token.symbol] = balance;
          }
        });

        await Promise.all(promises);
      }
      return items;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the asset balance of tron');
    }
  }

  static async getTRXBalance(isMainnet: boolean, address: string): Promise<string> {
    try {
      const tronWeb = await this.getTronClient(isMainnet);
      const balance = await tronWeb.trx.getBalance(address);
      return ethers.formatUnits(balance, 6);
    } catch (e) {
      console.error(e);
      throw new Error('can not get the eth balance of tron');
    }
  }

  static async getTRC20Balance(isMainnet: boolean, address: string, contractAddress: string): Promise<string> {
    try {
      const tronWeb = await this.getTronClient(isMainnet);
      tronWeb.setAddress(contractAddress);
      const contract = tronWeb.contract(TRC20Abi, contractAddress);
      const result = await contract.balanceOf(address).call();
      const tokenDecimals = await this.getTRC20Decimals(isMainnet, contractAddress);
      return ethers.formatUnits(result, tokenDecimals);
    } catch (e) {
      console.error(e);
      throw new Error('can not get the trc20 balance of tron');
    }
  }

  static async getTRC20Decimals(isMainnet: boolean, contractAddress: string): Promise<number> {
    const decimals = FindDecimalsByChainIdsAndContractAddress(this.getChainIds(isMainnet), contractAddress);
    if (decimals && decimals > 0) {
      return decimals;
    }

    try {
      const tronWeb = await this.getTronClient(isMainnet);
      tronWeb.setAddress(contractAddress);

      const contract = tronWeb.contract(TRC20Abi, contractAddress);
      const decimals = await contract.decimals().call();
      return decimals;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the decimals of tron');
    }
  }

  static async getTransactionDetail(isMainnet: boolean, hash: string): Promise<TransactionDetail> {
    try {
      const tronWeb = await this.getTronClient(isMainnet);
      const explorerUrl = GetBlockchainTxUrl(isMainnet, hash);

      const [transaction, transactionInfo]: any = await Promise.all([
        tronWeb.trx.getTransaction(hash),
        tronWeb.trx.getTransactionInfo(hash),
      ]);

      const from = transaction.raw_data.contract[0].parameter.value.owner_address;
      const status =
        transaction.ret[0].contractRet === 'SUCCESS' ? TRANSACTIONSTATUS.SUCCESS : TRANSACTIONSTATUS.FAILED;

      const type = transaction.raw_data.contract[0].type;
      let to = transaction.raw_data.contract[0].parameter.value.to_address;
      let amount = TronWeb.fromSun(transaction.raw_data.contract[0].parameter.value.amount);

      let isContract = false;

      if (type == 'TriggerSmartContract') {
        isContract = true;
        const data = transaction.raw_data.contract[0].parameter.value.data;
        const contractAddress = transaction.raw_data.contract[0].parameter.value.contract_address;
        const decodeData = await this.decodeTransferTrc20(data);
        // if (decodeData == null) {
        //   return url;
        // }
        const { address, value } = decodeData;

        const decimals = await this.getTRC20Decimals(isMainnet, contractAddress);

        to = address;

        amount = ethers.formatUnits(value, decimals);
      }

      return {
        blockNumber: transactionInfo.blockNumber,
        blockTimestamp: transactionInfo.blockTimeStamp,
        hash: hash,
        from: await this.fromBase58Address(isMainnet, from),
        to: await this.fromBase58Address(isMainnet, to),
        value: amount.toString(),
        status: status,
        fee: TronWeb.fromSun(transactionInfo.fee).toString(),
        url: explorerUrl,
        asset: '',
        // isContract: isContract,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transaction of tron');
    }
  }

  static async getTransactions(isMainnet: boolean, address: string, symbol?: string): Promise<TransactionDetail[]> {
    try {
      return [];
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transactions of tron');
    }
  }

  static async sendTransaction(isMainnet: boolean, request: SendTransaction): Promise<string> {
    return '';
  }

  static decodeTransferTrc20(txData: string): any {
    if (txData.slice(0, 8) !== 'a9059cbb') {
      return null;
    }
    try {
      const abiCoder = new ethers.AbiCoder();
      const decodedData = abiCoder.decode(['address', 'uint256'], '0x' + txData.slice(8));
      const [address, value] = decodedData;
      return { address, value };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  static async fromBase58Address(isMainnet: boolean, address: string): Promise<string> {
    try {
      const tronWeb = await this.getTronClient(isMainnet);
      const tronAddress = tronWeb.address.fromHex(address);
      return tronAddress;
    } catch (e) {
      console.error(e);
      return '';
    }
  }
}
