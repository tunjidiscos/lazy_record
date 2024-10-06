import axios from 'axios';
import { BLOCKCHAINNAMES, CHAINIDS, CHAINS, COINS } from 'packages/constants/blockchain';
import {
  AssetBalance,
  ChainAccountType,
  CreateTransaction,
  ERC20TransactionDetail,
  ETHGasPrice,
  ETHMaxPriorityFeePerGas,
  SendTransaction,
  TransactionDetail,
  TRANSACTIONFUNCS,
  TransactionRequest,
  TRANSACTIONSTATUS,
} from '../types';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import { ethers, Wallet, Contract } from 'ethers';
import { RPC } from '../rpc';
import { ERC20Abi } from '../abi/erc20';
import { FindDecimalsByChainIdsAndContractAddress, FindTokenByChainIdsAndContractAddress } from 'utils/web3';
import { BigMul } from 'utils/number';
import Big from 'big.js';
import { GetBlockchainTxUrl } from 'utils/chain/eth';

export class ETH {
  static chain = CHAINS.ETHEREUM;

  static getChainIds(isMainnet: boolean): CHAINIDS {
    return isMainnet ? CHAINIDS.ETHEREUM : CHAINIDS.ETHEREUM_SEPOLIA;
  }

  static async getProvider(isMainnet: boolean) {
    return new ethers.JsonRpcProvider(RPC.getRpcByChainIds(this.getChainIds(isMainnet)));
  }

  static createAccountBySeed(isMainnet: boolean, seed: Buffer): ChainAccountType {
    const path = `m/44'/60'/0'/0/0`;

    try {
      const hdkey = HDKey.fromMasterSeed(Uint8Array.from(seed)).derive(path);

      const privateKey = Buffer.from(hdkey.privateKey as Uint8Array).toString('hex');
      const wallet = new Wallet(privateKey);
      const address = wallet.address;

      return {
        chain: this.chain,
        address: address,
        privateKey: privateKey,
        note: 'Ethereum',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of eth');
    }
  }

  static createAccountByPrivateKey(isMainnet: boolean, privateKey: string): ChainAccountType {
    try {
      const wallet = new Wallet(privateKey);
      const address = wallet.address;

      return {
        chain: this.chain,
        address: address,
        privateKey: privateKey,
        note: 'Ethereum',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of eth');
    }
  }

  static checkAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  static checkQRCodeText(text: string): boolean {
    const regex = /ethereum:(\w+)(\?value=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;
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
    const regex = /ethereum:(\w+)(\?value=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;

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
    let qrcodeText = `ethereum:${address}`;
    const decimal = contractAddress ? await this.getERC20Decimals(isMainnet, contractAddress) : 18;

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
      items.ETH = await this.getETHBalance(isMainnet, address);

      const coins = BLOCKCHAINNAMES.find((item) => item.chainId === this.getChainIds(isMainnet))?.coins;
      if (coins && coins.length > 0) {
        const tokens = coins.filter((item) => !item.isMainCoin);

        const promises = tokens.map(async (token) => {
          if (token.contractAddress && token.contractAddress !== '') {
            const balance = await this.getERC20Balance(isMainnet, address, token.contractAddress);
            items[token.symbol] = balance;
          }
        });

        await Promise.all(promises);
      }
      return items;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the asset balance of eth');
    }
  }

  static async getETHBalance(isMainnet: boolean, address: string): Promise<string> {
    try {
      const provider = await this.getProvider(isMainnet);
      const balance = await provider.getBalance(address);
      return ethers.formatUnits(balance, 18);
    } catch (e) {
      console.error(e);
      throw new Error('can not get the eth balance of eth');
    }
  }

  static async getERC20Balance(isMainnet: boolean, address: string, contractAddress: string): Promise<string> {
    try {
      const provider = await this.getProvider(isMainnet);
      const contract = new Contract(contractAddress, ERC20Abi, provider);
      const result = await contract.balanceOf(address);
      const tokenDecimals = await this.getERC20Decimals(isMainnet, contractAddress);
      return ethers.formatUnits(result, tokenDecimals);
    } catch (e) {
      console.error(e);
      throw new Error('can not get the erc20 balance of eth');
    }
  }

  static async getERC20Decimals(isMainnet: boolean, contractAddress: string): Promise<number> {
    const decimals = FindDecimalsByChainIdsAndContractAddress(this.getChainIds(isMainnet), contractAddress);
    if (decimals && decimals > 0) {
      return decimals;
    }

    try {
      const provider = await this.getProvider(isMainnet);
      const contract = new Contract(contractAddress, ERC20Abi, provider);
      const decimals = await contract.decimals();
      return decimals;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the decimals of eth');
    }
  }

  static async decodeERC20Transfer(isMainnet: boolean, hash: string): Promise<ERC20TransactionDetail> {
    try {
      const params = [hash];
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETTXBYHASH, params);
      if (!response || response === null) {
        throw new Error('can not get tx by hash');
      }

      const input = response.result.input;
      const { to, amount, token } = await this.getERC20TransferToAmountAndTokenByInput(isMainnet, input);

      return {
        from: response.result.from,
        to: to,
        hash: response.result.hash,
        asset: token.symbol,
        value: amount,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not decode erc20 transfer of eth');
    }
  }

  static async getERC20TransferToAmountAndTokenByInput(isMainnet: boolean, input: string): Promise<any> {
    const iface = new ethers.Interface(ERC20Abi);
    const result = iface.decodeFunctionData('transfer', input);
    const to = result[0];
    const token = FindTokenByChainIdsAndContractAddress(this.getChainIds(isMainnet), to);
    const amount = ethers.formatUnits(result[1]._hex, token.decimals);

    return {
      to,
      amount,
      token,
    };
  }

  static async getTransactionStatus(isMainnet: boolean, hash: string): Promise<TRANSACTIONSTATUS> {
    try {
      const params = [hash];
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETTXRECEIPT, params);
      if (!response || response === null) {
        throw new Error('can not get tx by hash');
      }

      const status = parseInt(response.result.status, 16);
      if (status === 1) {
        return TRANSACTIONSTATUS.SUCCESS;
      } else if (status === 0) {
        return TRANSACTIONSTATUS.FAILED;
      }

      throw new Error('can not get tx status of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not get tx status of eth');
    }
  }

  static async getTransactionResult(isMainnet: boolean, hash: string): Promise<any> {
    try {
      const params = [hash];
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETTXRECEIPT, params);
      if (!response || response === null) {
        throw new Error('can not get tx by hash');
      }

      return response.result;
    } catch (e) {
      console.error(e);
      throw new Error('can not get tx result of eth');
    }
  }

  static async getTransactionDetail(
    isMainnet: boolean,
    hash: string,
    isPending: boolean = false,
  ): Promise<TransactionDetail> {
    const explorerUrl = `${GetBlockchainTxUrl(isMainnet)}/tx/${hash}`;

    try {
      if (isPending) {
      } else {
        const params = [hash];
        const tx_response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETTXBYHASH, params);
        if (!tx_response || tx_response === null) {
          throw new Error('can not get tx by hash');
        }

        let amount: any;
        let to: string;
        let asset: COINS;
        const token = FindTokenByChainIdsAndContractAddress(this.getChainIds(isMainnet), tx_response.result.to);
        if (token) {
          const {
            tokenTo,
            tokenAmount,
            token: COINS,
          } = await this.getERC20TransferToAmountAndTokenByInput(isMainnet, tx_response.result.input);

          amount = tokenAmount;
          to = tokenTo;
          asset = token.symbol;
        } else {
          amount = ethers.formatUnits(tx_response.result.value, 18);
          to = tx_response.to;
          asset = COINS.ETH;
        }

        const receipt_response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETTXRECEIPT, params);
        if (!receipt_response || receipt_response === null) {
          throw new Error('can not get tx by hash');
        }

        let tx_status: TRANSACTIONSTATUS = TRANSACTIONSTATUS.PENDING;
        const status = parseInt(receipt_response.result.status, 16);
        if (status === 1) {
          tx_status = TRANSACTIONSTATUS.SUCCESS;
        } else if (status === 0) {
          tx_status = TRANSACTIONSTATUS.FAILED;
        }

        const gasUsed = parseInt(receipt_response.result.gasUsed, 16).toString();
        const gasPrice = parseInt(receipt_response.result.effectiveGasPrice, 16).toString();
        const fee = ethers.formatEther(BigMul(gasUsed, gasPrice).toString());

        return {
          hash: receipt_response.result.transactionHash,
          from: receipt_response.result.from,
          to: to,
          value: amount,
          asset: asset,
          fee: fee,
          status: tx_status,
          blockNumber: parseInt(receipt_response.result.blockNumber, 16),
          url: explorerUrl,
        };
      }

      throw new Error('can not get the transaction of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transaction of eth');
    }
  }

  static async estimateGas(isMainnet: boolean, txParams: TransactionRequest): Promise<number> {
    try {
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.EstimateGas, [
        {
          from: txParams.from,
          to: txParams.to,
          value: txParams.value,
        },
      ]);
      if (!response || response === null) {
        throw new Error('can not estimate gas of eth');
      }

      const gasLimit = new Big(parseInt(response.result, 16));
      if (gasLimit && gasLimit.gt(0)) {
        return gasLimit.toNumber();
      }

      throw new Error('can not estimate gas of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not estimate gas of eth');
    }
  }

  static async getGasPrice(isMainnet: boolean): Promise<ETHGasPrice> {
    try {
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETGASPRICE, []);
      console.log("response", response)
      if (!response || response === null) {
        throw new Error('can not get the gasPrice');
      }

      const gasPrice = new Big(parseInt(response.result, 16));

      if (gasPrice && gasPrice.gt(0)) {
        return {
          slow: gasPrice.toString(),
          normal: gasPrice.mul(150).div(100).toString(),
          fast: gasPrice.mul(2).toString(),
        };
      }

      throw new Error('can not get gasPrice of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not get gasPrice of eth');
    }
  }

  static async getMaxPriorityFeePerGas(isMainnet: boolean): Promise<ETHMaxPriorityFeePerGas> {
    try {
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.MaxPriorityFeePerGas, []);
      if (!response || response === null) {
        throw new Error('can not get maxPriorityFeePerGas of eth');
      }

      const maxPriorityFeePerGas = new Big(parseInt(response.result, 16));

      if (maxPriorityFeePerGas) {
        return {
          slow: maxPriorityFeePerGas.toString(),
          normal: maxPriorityFeePerGas.mul(150).div(100).toString(),
          fast: maxPriorityFeePerGas.mul(2).toString(),
        };
      }

      throw new Error('can not get maxPriorityFeePerGas of eth');
    } catch (e) {
      console.error(e);

      throw new Error('can not get maxPriorityFeePerGas of eth');
    }
  }

  static async getGasLimit(
    isMainnet: boolean,
    contractAddress: string,
    from: string,
    to: string,
    value: string,
  ): Promise<number> {
    if (contractAddress && contractAddress !== '') {
      return 96000;
    }

    const txParams: TransactionRequest = {
      from: from,
      to: to,
      value: new Big(value).toNumber(),
    };

    return await this.estimateGas(isMainnet, txParams);
  }

  static async createTransaction(isMainnet: boolean, request: CreateTransaction): Promise<CreateTransaction> {
    if (request.contractAddress) {
      return await this.createERC20Transaction(isMainnet, request);
    } else {
      return await this.createETHTransaction(isMainnet, request);
    }
  }

  static async createETHTransaction(isMainnet: boolean, request: CreateTransaction): Promise<CreateTransaction> {
    request.value = ethers.parseEther(request.value).toString();
    request.type = 2;
    if (request.gasPrice) {
      request.maxFeePerGas = request.gasPrice;
    } else {
      const price = await this.getGasPrice(isMainnet);
      request.gasPrice = price.normal;
      request.maxFeePerGas = price.normal;
    }

    if (!request.gasLimit) {
      const limit = await this.getGasLimit(
        isMainnet,
        request.contractAddress as string,
        request.from,
        request.to,
        request.value,
      );
      request.gasLimit = limit;
    }

    if (!request.maxPriorityFeePerGas) {
      const fee = await this.getMaxPriorityFeePerGas(isMainnet);
      request.maxPriorityFeePerGas = fee.normal;
    }
    return request;
  }

  static async createERC20Transaction(isMainnet: boolean, request: CreateTransaction): Promise<CreateTransaction> {
    request.value = '0';
    request.type = 2;

    const decimals = await this.getERC20Decimals(isMainnet, request.contractAddress as string);
    const value = ethers.parseUnits(request.value, decimals).toString();
    const iface = new ethers.Interface(ERC20Abi);
    const data = iface.encodeFunctionData('transfer', [request.to, value]);
    request.data = data;
    request.to = request.contractAddress as string;

    if (request.gasPrice) {
      request.maxFeePerGas = request.gasPrice;
    } else {
      const price = await this.getGasPrice(isMainnet);
      request.gasPrice = price.normal;
      request.maxFeePerGas = price.normal;
    }

    if (!request.gasLimit) {
      const limit = await this.getGasLimit(
        isMainnet,
        request.contractAddress as string,
        request.from,
        request.to,
        request.value,
      );
      request.gasLimit = limit;
    }

    if (!request.maxPriorityFeePerGas) {
      const fee = await this.getMaxPriorityFeePerGas(isMainnet);
      request.maxPriorityFeePerGas = fee.normal;
    }

    return request;
  }

  static async getNonce(isMainnet: boolean, address: string): Promise<number> {
    try {
      const params = [address, 'latest'];
      const response = await RPC.callRPC(this.getChainIds(isMainnet), TRANSACTIONFUNCS.GETNONCE, params);
      if (!response || response === null) {
        throw new Error('can not get nonce of eth');
      }

      const nonce = parseInt(response.result, 16);

      if (nonce) {
        return nonce;
      }

      throw new Error('can not get nonce of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not get nonce of eth');
    }
  }

  static async getFee(isMainnet: boolean, request: CreateTransaction): Promise<string> {
    const tx = await this.createTransaction(isMainnet, request);
    return ethers.formatEther(BigMul(tx.gasPrice, tx.gasLimit.toString()));
  }

  static async sendAccelerateTransaction(isMainnet: boolean, request: CreateTransaction): Promise<string> {
    if (!request.privateKey || request.privateKey === '') {
      throw new Error('can not get private key of eth');
    }

    request.value = ethers.parseUnits(request.value).toString();
    request.type = 2;

    if (request.maxPriorityFeePerGas) {
      request.maxPriorityFeePerGas = new Big(request.maxPriorityFeePerGas).mul(150).div(100).toString();
    } else {
      const priorityFee = await this.getMaxPriorityFeePerGas(isMainnet);
      request.maxPriorityFeePerGas = priorityFee.normal;
    }

    if (request.contractAddress) {
      request.to = request.contractAddress;
    }

    try {
      const provider = await this.getProvider(isMainnet);
      const wallet = new ethers.Wallet(request.privateKey, provider);
      const response = await wallet.sendTransaction(request);
      if (response) {
        return response.hash;
      }

      throw new Error('can not send transaction of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not send transaction of eth');
    }
  }

  static async sendTransaction(isMainnet: boolean, request: SendTransaction): Promise<string> {
    if (!request.privateKey || request.privateKey === '') {
      throw new Error('can not get private key of eth');
    }

    const cRequest: CreateTransaction = {
      chainId: request.coin.chainId,
      from: request.from,
      to: request.to,
      privateKey: request.privateKey,
      value: request.value,
      gasPrice: request.gasPrice as string,
      gasLimit: request.gasLimit as number,
      maxPriorityFeePerGas: request.maxPriorityFeePerGas,
    };

    let tx = await this.createTransaction(isMainnet, cRequest);
    tx.nonce = await this.getNonce(isMainnet, tx.from);

    try {
      const provider = await this.getProvider(isMainnet);
      const wallet = new ethers.Wallet(request.privateKey, provider);
      const response = await wallet.sendTransaction(cRequest);
      if (response) {
        return response.hash;
      }

      throw new Error('can not send transaction of eth');
    } catch (e) {
      console.error(e);
      throw new Error('can not send transaction of eth');
    }
  }

  //   static signMessage(privateKey: string, message: string): string {
  //   }

  static async personalSign(privateKey: string, message: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    const messageBytes = ethers.toUtf8Bytes(message);
    const signature = await wallet.signMessage(messageBytes);
    return signature;
  }
}
