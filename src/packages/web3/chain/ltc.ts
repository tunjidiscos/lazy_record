import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { CHAINIDS, CHAINS, COINS } from 'packages/constants/blockchain';
import {
  AssetBalance,
  BTCFeeRate,
  ChainAccountType,
  SendTransaction,
  TransactionDetail,
  TRANSACTIONSTATUS,
  TRANSACTIONTYPE,
  UnspentTransactionOutput,
} from '../types';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';
import { ECPairFactory } from 'ecpair';
import { GetBlockchainTxUrl, GetNodeApi } from 'utils/chain/ltc';
import { BigAdd, BigDiv, BigMul, BigSub } from 'utils/number';
import Big from 'big.js';
import { ethers } from 'ethers';

export class LTC {
  static chain = CHAINS.LITECOIN;

  static axiosInstance = axios.create({
    timeout: 10000,
  });

  static getNetwork(isMainnet: boolean): bitcoin.Network {
    return isMainnet
      ? {
          messagePrefix: '\x19Litecoin Signed Message:\n',
          bech32: 'ltc',
          bip32: {
            public: 0x019da462,
            private: 0x019d9cfe,
          },
          pubKeyHash: 0x30,
          scriptHash: 0x32,
          wif: 0xb0,
        }
      : {
          messagePrefix: '\x19Litecoin Signed Message:\n',
          bech32: 'tltc',
          bip32: {
            public: 0x043587cf,
            private: 0x04358394,
          },
          pubKeyHash: 0x6f,
          scriptHash: 0x3a,
          wif: 0xef,
        };
  }

  static getChainIds(isMainnet: boolean): CHAINIDS {
    return isMainnet ? CHAINIDS.LITECOIN : CHAINIDS.LITECOIN_TESTNET;
  }

  static createAccountBySeed(isMainnet: boolean, seed: Buffer): ChainAccountType {
    bitcoin.initEccLib(ecc);

    let accounts: Array<ChainAccountType> = [];

    const nativeSegwitPath = isMainnet ? `m/84'/0'/0'/0/0` : `m/84'/1'/0'/0/0`;

    try {
      const bip32 = BIP32Factory(ecc);
      const node = bip32.fromSeed(seed, this.getNetwork(isMainnet));

      // nativeSegwit
      const nativeSegwitPrivateKey = node.derivePath(nativeSegwitPath).privateKey?.toString('hex');
      const nativeSegwitAddress = this.getAddressP2wpkhFromPrivateKey(isMainnet, nativeSegwitPrivateKey as string);

      return {
        chain: this.chain,
        address: nativeSegwitAddress as string,
        privateKey: nativeSegwitPrivateKey,
        note: 'Litecoin',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of ltc');
    }
  }

  static createAccountByPrivateKey(isMainnet: boolean, privateKey: string): ChainAccountType {
    try {
      // nativeSegwit
      const nativeSegwitAddress = this.getAddressP2wpkhFromPrivateKey(isMainnet, privateKey);

      return {
        chain: this.chain,
        address: nativeSegwitAddress as string,
        privateKey: privateKey,
        note: 'Native Segwit',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of ltc');
    }
  }

  static toWifStaring(isMainnet: boolean, privateKey: string): string {
    const ECPair = ECPairFactory(ecc);
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const keyPair = ECPair.fromPrivateKey(privateKeyBytes, { network: this.getNetwork(isMainnet) });
    return keyPair.toWIF();
  }

  // p2wpkh
  static getAddressP2wpkhFromPrivateKey(isMainnet: boolean, privateKey: string): string {
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromWIF(this.toWifStaring(isMainnet, privateKey), this.getNetwork(isMainnet));
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: this.getNetwork(isMainnet) });
    return p2wpkh.address as string;
  }

  static checkAddress(isMainnet: boolean, address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, this.getNetwork(isMainnet));
      return true;
    } catch (e) {
      return false;
    }
  }

  static checkQRCodeText(text: string): boolean {
    const regex = /litecoin:(\w+)\?amount=([\d.]+)/;
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
    const regex = /litecoin:(\w+)\?amount=([\d.]+)/;

    try {
      const matchText = text.match(regex);
      if (matchText) {
        const address = matchText[1];
        const amount = matchText[2] || 0;

        return {
          address,
          amount,
        };
      } else {
        return;
      }
    } catch (e) {
      console.error(e);
      return;
    }
  }

  static async getAssetBalance(isMainnet: boolean, address: string, toLTC: boolean = true): Promise<AssetBalance> {
    let items = {} as AssetBalance;
    items.LTC = await this.getBalance(isMainnet, address, toLTC);
    return items;
  }

  static async getBalance(isMainnet: boolean, address: string, toLTC: boolean = true): Promise<string> {
    try {
      const url = `${GetNodeApi(isMainnet)}/address/${address}/utxo`;
      const response = await this.axiosInstance.get(url);

      if (response && response.data && response.data.length > 0) {
        let balance = '0';
        response.data.map((utxo: any) => {
          if (utxo.status.confirmed) {
            balance = BigAdd(balance, parseInt(utxo.value).toString());
          }
        });

        return toLTC ? BigDiv(balance, '100000000') : balance;
      }

      return '0';
    } catch (e) {
      console.error(e);
      throw new Error('can not get the balance of ltc');
    }
  }

  static async getAddressUtxo(isMainnet: boolean, address: string): Promise<UnspentTransactionOutput[]> {
    try {
      const url = `${GetNodeApi(isMainnet)}/address/${address}/utxo`;
      const response = await this.axiosInstance.get(url);

      if (response.data.length > 0) {
        return response.data.map((utxo: any) => {
          if (utxo.status.confirmed) {
            return {
              txid: utxo.txid,
              vout: utxo.vout,
              value: utxo.value,
            };
          }
        });
      }

      return [];
    } catch (e) {
      console.error(e);
      throw new Error('can not get the utxo of ltc');
    }
  }

  static async getCurrentFeeRate(isMainnet: boolean): Promise<BTCFeeRate> {
    try {
      const url = `${GetNodeApi(isMainnet)}/v1/fees/recommended`;
      const response = await this.axiosInstance.get(url);
      if (response.data) {
        return {
          fastest: parseInt(response.data.fastestFee),
          halfHour: parseInt(response.data.halfHourFee),
          hour: parseInt(response.data.hourFee),
          economy: parseInt(response.data.economyFee),
          minimum: parseInt(response.data.minimumFee),
        };
      }
      throw new Error('can not get the fee rate of ltc');
    } catch (e) {
      console.error(e);
      throw new Error('can not get the fee rate of ltc');
    }
  }

  static async broadcastTransaction(isMainnet: boolean, data: string): Promise<string> {
    try {
      const url = `${GetNodeApi(isMainnet)}/tx`;
      const response = await this.axiosInstance.post(url, data);

      if (response.data) {
        return response.data;
      }

      throw new Error('can not broadcast tx of ltc');
    } catch (e) {
      console.error(e);
      throw new Error('can not broadcast tx of ltc');
    }
  }

  static async getTransactions(isMainnet: boolean, address: string): Promise<TransactionDetail[]> {
    try {
      const url = `${GetNodeApi(isMainnet)}/address/${address}/txs`;
      const response = await this.axiosInstance.get(url);
      if (response.data.length > 0) {
        let txs: TransactionDetail[] = [];
        response.data.map((item: any) => {
          let status = TRANSACTIONSTATUS.PENDING;
          if (item.status.confirmed) {
            status = TRANSACTIONSTATUS.SUCCESS;
          }

          let txType = TRANSACTIONTYPE.SEND;
          let value = 0;
          item.vin.map((vinItem: any) => {
            if (
              vinItem.prevout.scriptpubkey_address &&
              address.toLowerCase() === vinItem.prevout.scriptpubkey_address.toLowerCase()
            ) {
              txType = TRANSACTIONTYPE.SEND;
              value += parseInt(vinItem.prevout.value);
            } else {
              txType = TRANSACTIONTYPE.RECEIVED;
            }
          });

          item.vout.map((voutItem: any) => {
            if (txType === TRANSACTIONTYPE.SEND) {
              if (
                voutItem.scriptpubkey_address &&
                address.toLowerCase() !== voutItem.scriptpubkey_address.toLowerCase()
              ) {
                value -= parseInt(voutItem.value);
              }
            } else if (txType === TRANSACTIONTYPE.RECEIVED) {
              if (
                voutItem.scriptpubkey_address &&
                address.toLowerCase() === voutItem.scriptpubkey_address.toLowerCase()
              ) {
                value += parseInt(voutItem.value);
              }
            }
          });

          let blockTimestamp = 0,
            blockNumber = 0;
          if (item.status.confirmed) {
            blockTimestamp = item.status.block_time;
            blockNumber = item.status.block_height;
          }

          const url = GetBlockchainTxUrl(isMainnet, item.txid);

          txs.push({
            hash: item.txid,
            value: value.toString(),
            asset: COINS.LTC,
            fee: item.fee,
            type: txType,
            status: status,
            blockTimestamp: blockTimestamp,
            blockNumber: blockNumber,
            url: url,
          });
        });

        return txs;
      } else {
        return [];
      }
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transactions of ltc');
    }
  }

  static async getTransactionDetail(isMainnet: boolean, hash: string, address?: string): Promise<TransactionDetail> {
    try {
      const url = `${GetNodeApi(isMainnet)}/tx/${hash}`;
      const response = await this.axiosInstance.get(url);
      if (response.data) {
        let status = TRANSACTIONSTATUS.PENDING;
        if (response.data.status.confirmed) {
          status = TRANSACTIONSTATUS.SUCCESS;
        }

        let txType;
        let value = 0;

        if (address) {
          response.data.vin.map((vinItem: any) => {
            if (
              vinItem.prevout.scriptpubkey_address &&
              address.toLowerCase() === vinItem.prevout.scriptpubkey_address.toLowerCase()
            ) {
              txType = TRANSACTIONTYPE.SEND;
              value += parseInt(vinItem.prevout.value);
            }
          });

          if (txType !== TRANSACTIONTYPE.SEND) {
            txType = TRANSACTIONTYPE.RECEIVED;
          }

          response.data.vout.map((voutItem: any) => {
            if (
              voutItem.scriptpubkey_address &&
              address.toLowerCase() === voutItem.scriptpubkey_address.toLowerCase()
            ) {
              value -= parseInt(voutItem.value);
            }
          });
        }

        let blockTimestamp = 0,
          blockNumber = 0;
        if (response.data.status.confirmed) {
          blockTimestamp = response.data.status.block_time;
          blockNumber = response.data.status.block_height;
        }

        const explorerUrl = GetBlockchainTxUrl(isMainnet, response.data.txid);

        if (address) {
          return {
            hash: response.data.txid,
            value: value.toString(),
            asset: COINS.LTC,
            fee: response.data.fee,
            type: txType,
            status: status,
            blockTimestamp: blockTimestamp,
            blockNumber: blockNumber,
            url: explorerUrl,
          };
        } else {
          return {
            hash: response.data.txid,
            asset: COINS.LTC,
            fee: response.data.fee,
            status: status,
            blockTimestamp: blockTimestamp,
            blockNumber: blockNumber,
            url: explorerUrl,
          };
        }
      }

      throw new Error('can not get the transaction of ltc');
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transaction of ltc');
    }
  }

  static async sendTransaction(isMainnet: boolean, req: SendTransaction): Promise<string> {
    try {
      const ECPair = ECPairFactory(ecc);
      const keyPair = ECPair.fromWIF(this.toWifStaring(isMainnet, req.privateKey), this.getNetwork(isMainnet));

      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: this.getNetwork(isMainnet) });
      let script = p2wpkh.output as Buffer;

      const txb = new bitcoin.Psbt({ network: this.getNetwork(isMainnet) });
      txb.setVersion(2);
      txb.setLocktime(0);

      let totalBalance = '0';
      const utxos = await this.getAddressUtxo(isMainnet, req.from);
      utxos &&
        utxos.length > 0 &&
        utxos.forEach((item, index) => {
          totalBalance = BigAdd(totalBalance, item.value.toString());
          txb.addInput({
            hash: item.txid,
            index: item.vout,
            witnessUtxo: {
              script: script,
              value: item.value,
            },
          });
        });

      const sendBalance = new Big(ethers.parseUnits(req.value, 8).toString()).toNumber();
      txb.addOutput({
        address: req.to,
        value: sendBalance,
      });

      const feeRate = req.feeRate ? req.feeRate : (await this.getCurrentFeeRate(isMainnet)).fastest;
      const size = 1000;
      const feeBalance = BigMul(size.toString(), feeRate.toString());

      const remainValue = parseFloat(BigSub(BigSub(totalBalance, sendBalance.toString()), feeBalance));
      if (remainValue < 0) {
        throw new Error('can not create the transactions of ltc');
      }

      txb.addOutput({
        address: req.from,
        value: remainValue,
      });

      txb.signAllInputs(keyPair);
      txb.finalizeAllInputs();

      const tx = txb.extractTransaction();
      const txid = await this.broadcastTransaction(isMainnet, tx.toHex());
      return txid;
    } catch (e) {
      console.error(e);
      throw new Error('can not create the transactions of ltc');
    }
  }
}
