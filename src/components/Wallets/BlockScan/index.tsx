import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { useSnackPresistStore, useUserPresistStore, useWalletPresistStore } from 'lib/store';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import Image from 'next/image';
import { BLOCKCHAIN, BLOCKCHAINNAMES, CHAINS } from 'packages/constants/blockchain';

type walletType = {
  id: number;
  address: string;
  type: string;
  network: number;
  chainId: number;
};

const BlockScan = () => {
  const { getUserId, getNetwork } = useUserPresistStore((state) => state);
  const { getWalletId } = useWalletPresistStore((state) => state);
  const { setSnackOpen, setSnackMessage, setSnackSeverity } = useSnackPresistStore((state) => state);

  const [wallet, setWallet] = useState<walletType[]>([]);
  const [blockchain, setBlcokchain] = useState<BLOCKCHAIN[]>([]);

  const checkScanStatus = async () => {
    if (!wallet || wallet.length <= 0) {
      return;
    }

    try {
      const save_wallet_resp: any = await axios.post(Http.create_wallet_to_block_scan, {
        user_id: getUserId(),
        wallet_id: getWalletId(),
        network: getNetwork() === 'mainnet' ? 1 : 2,
      });

      if (save_wallet_resp.result) {
        setSnackSeverity('success');
        setSnackMessage('Verification success, all addresses have been added to the queue');
        setSnackOpen(true);
      } else {
        setSnackSeverity('error');
        setSnackMessage('Verification failed, please try again');
        setSnackOpen(true);
      }
    } catch (e) {
      console.error(e);

      setSnackSeverity('error');
      setSnackMessage('Verification failed, please try again');
      setSnackOpen(true);
    }
  };

  const checkNetworkStatus = async () => {
    await getNetworkInfo();

    setSnackSeverity('success');
    setSnackMessage('Successful check!');
    setSnackOpen(true);
  };

  const checkRequestTime = async (url: string): Promise<number> => {
    const start = performance.now();

    try {
      await axios.get(url);
    } catch (e) {
      console.error(e);
    }

    const end = performance.now();
    return end - start;
  };

  const getWalletAddress = async () => {
    try {
      const find_address_resp: any = await axios.get(Http.find_wallet_address_by_network, {
        params: {
          user_id: getUserId(),
          wallet_id: getWalletId(),
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });

      if (find_address_resp.result && find_address_resp.data.length > 0) {
        let ws: walletType[] = [];
        find_address_resp.data.forEach(async (item: any) => {
          ws.push({
            id: item.id,
            address: item.address,
            type: item.chain_id === CHAINS.BITCOIN ? 'BITCOIN ' + item.note : item.note,
            network: item.network,
            chainId: item.chain_id,
          });
        });
        setWallet(ws);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getNetworkInfo = async () => {
    const value = BLOCKCHAINNAMES.filter((item) => (getNetwork() === 'mainnet' ? item.isMainnet : !item.isMainnet));
    value.forEach(async (item) => {
      if (item.rpc) {
        const time = await checkRequestTime(item.rpc[0]);
        item.time = parseInt(time.toString());
      }
    });

    setBlcokchain(value);
  };

  const init = async () => {
    await getWalletAddress();
    await getNetworkInfo();
  };

  useEffect(() => {
    init();
  }, []);
  return (
    <Box>
      <Container>
        <Typography variant="h6">Blockchain Scan</Typography>

        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} mt={4}>
          <Typography variant="h6">Wallet Address</Typography>
          <Stack direction={'row'} alignItems={'center'}>
            <Button variant={'contained'} onClick={checkScanStatus}>
              Check Scan Status
            </Button>
          </Stack>
        </Stack>

        <Box mt={4}>
          {wallet &&
            wallet.length > 0 &&
            wallet.map((item, index) => (
              <Box key={index} mb={4}>
                <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                  <Box>
                    <Typography fontWeight={'bold'} fontSize={14}>
                      {item.type}
                    </Typography>
                    <Typography mt={1}>{item.address}</Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
        </Box>

        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} mt={4}>
          <Typography variant="h6">Network</Typography>
          <Stack direction={'row'} alignItems={'center'}>
            <Button variant={'contained'} onClick={checkNetworkStatus}>
              Check network Status
            </Button>
          </Stack>
        </Stack>

        {blockchain &&
          blockchain.map((item) => (
            <Box mt={4}>
              <Box mt={2}>
                <Card>
                  <CardContent>
                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                      <Stack direction={'row'}>
                        <Image src={item.icon} alt="image" width={50} height={50} />
                        <Box ml={2}>
                          <Typography fontSize={16} fontWeight={'bold'}>
                            {item.name}
                          </Typography>
                          <Typography fontSize={16} fontWeight={'bold'}>
                            {item.desc}
                          </Typography>
                          <Typography fontSize={16} fontWeight={'bold'} mt={2}>
                            {item.explorerUrl}
                          </Typography>
                          <Typography fontSize={16} fontWeight={'bold'}>
                            {item.websiteUrl}
                          </Typography>
                          <Typography fontSize={16} fontWeight={'bold'} mt={4}>
                            Support Coins:
                          </Typography>
                          {item.coins.map((coin) => (
                            <Stack direction={'row'} alignItems={'center'} pt={2}>
                              <Image src={coin.icon} alt="coinImage" width={40} height={40} />
                              <Typography fontSize={14} fontWeight={'bold'} ml={1}>
                                {coin.name}
                              </Typography>
                            </Stack>
                          ))}
                          <Typography fontSize={16} fontWeight={'bold'} mt={4}>
                            RPC:
                          </Typography>
                          <Typography mt={1}>{item.rpc && item.rpc[0]}</Typography>
                        </Box>
                      </Stack>
                      <Typography color={'green'} width={70}>
                        {item.time} ms
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ))}
      </Container>
    </Box>
  );
};

export default BlockScan;
