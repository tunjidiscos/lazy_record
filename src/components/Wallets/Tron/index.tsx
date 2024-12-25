import { Settings } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore, useWalletPresistStore } from 'lib/store';
import Link from 'next/link';
import { CHAINS } from 'packages/constants/blockchain';
import { TransactionDetail } from 'packages/web3/types';
import { useEffect, useState } from 'react';
import { GetBlockchainAddressUrl, GetBlockchainTxUrl } from 'utils/chain/tron';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';

type walletType = {
  id: number;
  address: string;
  type: string;
  trxBalance: string;
  usdtBalance: string;
  usdcBalance: string;
  transactions: TransactionDetail[];
};

const Tron = () => {
  const { getWalletId } = useWalletPresistStore((state) => state);
  const { getNetwork, getUserId } = useUserPresistStore((state) => state);
  const { getStoreId } = useStorePresistStore((state) => state);
  const { setSnackMessage, setSnackSeverity, setSnackOpen } = useSnackPresistStore((state) => state);

  const [isSettings, setIsSettings] = useState<boolean>(false);
  const [wallet, setWallet] = useState<walletType[]>([]);
  // const [feeObj, setFeeObj] = useState<feeType>();

  const [settingId, setSettingId] = useState<number>(0);
  const [paymentExpire, setPaymentExpire] = useState<number>(0);
  const [confirmBlock, setConfirmBlock] = useState<number>(0);
  const [showRecommendedFee, setShowRecommendedFee] = useState<boolean>(false);
  const [currentUsedAddressId, setCurrentUsedAddressId] = useState<number>(0);

  const onClickRescanAddress = async () => {
    await getTronWalletAddress();

    setSnackSeverity('success');
    setSnackMessage('Successful rescan!');
    setSnackOpen(true);
  };

  const getTronWalletAddress = async () => {
    try {
      const find_address_resp: any = await axios.get(Http.find_wallet_address_by_chain_and_network, {
        params: {
          user_id: getUserId(),
          wallet_id: getWalletId(),
          chain_id: CHAINS.TRON,
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });

      if (find_address_resp.result && find_address_resp.data.length > 0) {
        let ws: walletType[] = [];
        find_address_resp.data.forEach(async (item: any) => {
          ws.push({
            id: item.id,
            address: item.address,
            type: item.note,
            trxBalance: item.balance.TRX,
            usdtBalance: item.balance.USDT,
            usdcBalance: item.balance.USDC,
            transactions: item.transactions,
          });
        });
        setWallet(ws);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTronPaymentSetting = async () => {
    try {
      const find_setting_resp: any = await axios.get(Http.find_payment_setting_by_chain_id, {
        params: {
          user_id: getUserId(),
          chain_id: CHAINS.TRON,
          store_id: getStoreId(),
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });

      if (find_setting_resp.result && find_setting_resp.data.length === 1) {
        setSettingId(find_setting_resp.data[0].id);
        setPaymentExpire(find_setting_resp.data[0].payment_expire);
        setConfirmBlock(find_setting_resp.data[0].confirm_block);
        setShowRecommendedFee(find_setting_resp.data[0].show_recommended_fee === 1 ? true : false);
        setCurrentUsedAddressId(
          find_setting_resp.data[0].current_used_address_id ? find_setting_resp.data[0].current_used_address_id : 0,
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // const getTronFeeRate = async () => {
  //   try {
  //     const find_fee_resp: any = await axios.get(Http.find_fee_rate, {
  //       params: {
  //         chain_id: CHAINS.TRON,
  //         network: getNetwork() === 'mainnet' ? 1 : 2,
  //       },
  //     });
  //     if (find_fee_resp.result) {
  //       setFeeObj({
  //         high: find_fee_resp.data.fast,
  //         average: find_fee_resp.data.normal,
  //         low: find_fee_resp.data.slow,
  //       });
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  const updatePaymentSetting = async () => {
    try {
      const resp: any = await axios.put(Http.update_payment_setting_by_id, {
        id: settingId,
        user_id: getUserId(),
        chain_id: CHAINS.TRON,
        store_id: getStoreId(),
        network: getNetwork() === 'mainnet' ? 1 : 2,
        payment_expire: paymentExpire,
        confirm_block: confirmBlock,
        show_recommended_fee: showRecommendedFee ? 1 : 2,
        current_used_address_id: currentUsedAddressId,
      });
      if (resp.result) {
        setSnackSeverity('success');
        setSnackMessage('Successful update!');
        setSnackOpen(true);

        await init();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const init = async () => {
    await getTronWalletAddress();
    await getTronPaymentSetting();
    // await getTronFeeRate();
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <Box>
      <Container>
        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} pt={5}>
          <Box>
            <Typography variant="h6">Tron Wallet</Typography>
          </Box>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Box>
              <Button
                variant={'contained'}
                onClick={() => {
                  window.location.href = '/wallets/tron/send';
                }}
              >
                Send
              </Button>
            </Box>
            <Box>
              <Button
                variant={'contained'}
                onClick={() => {
                  window.location.href = '/wallets/tron/receive';
                }}
              >
                Receive
              </Button>
            </Box>
            <Box>
              <Button variant={'contained'} onClick={onClickRescanAddress}>
                Rescan address
              </Button>
            </Box>
            <IconButton
              onClick={() => {
                setIsSettings(!isSettings);
              }}
            >
              <Settings />
            </IconButton>
          </Stack>
        </Stack>

        {/* <Box mt={8}>
          <Typography variant="h6">Tron Gas Tracker</Typography>
          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} mt={2}>
            <Box>
              <Typography>Low</Typography>
              <Typography mt={2} fontWeight={'bold'}>
                {WeiToGwei(feeObj?.low as number)} Gwei
              </Typography>
            </Box>
            <Box>
              <Typography>Average</Typography>
              <Typography mt={2} fontWeight={'bold'}>
                {WeiToGwei(feeObj?.average as number)} Gwei
              </Typography>
            </Box>
            <Box>
              <Typography>High</Typography>
              <Typography mt={2} fontWeight={'bold'}>
                {WeiToGwei(feeObj?.high as number)} Gwei
              </Typography>
            </Box>
          </Stack>
        </Box> */}

        <Box mt={8}>
          {isSettings ? (
            <Box>
              <Box mt={5}>
                <Typography variant="h6">Payment</Typography>
                <Box mt={3}>
                  <Typography>The transaction address currently used</Typography>
                  <Box mt={1}>
                    <FormControl sx={{ minWidth: 300 }}>
                      <Select
                        size={'small'}
                        inputProps={{ 'aria-label': 'Without label' }}
                        value={currentUsedAddressId}
                        onChange={(e: any) => {
                          setCurrentUsedAddressId(e.target.value);
                        }}
                      >
                        <MenuItem value={0}>None</MenuItem>
                        {wallet.map((item, index) => (
                          <MenuItem value={item.id} key={index}>
                            {item.address}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box mt={3}>
                  <Typography>Payment invalid if transactions fails to confirm … after invoice expiration</Typography>
                  <Box mt={1}>
                    <FormControl variant="outlined">
                      <OutlinedInput
                        size={'small'}
                        type="number"
                        endAdornment={<InputAdornment position="end">minutes</InputAdornment>}
                        aria-describedby="outlined-weight-helper-text"
                        inputProps={{
                          'aria-label': 'weight',
                        }}
                        value={paymentExpire}
                        onChange={(e: any) => {
                          setPaymentExpire(e.target.value);
                        }}
                      />
                    </FormControl>
                  </Box>
                </Box>
                <Box mt={3}>
                  <Typography>Consider the invoice settled when the payment transaction …</Typography>
                  <Box mt={1}>
                    <FormControl sx={{ minWidth: 300 }}>
                      <Select
                        size={'small'}
                        inputProps={{ 'aria-label': 'Without label' }}
                        value={confirmBlock}
                        onChange={(e: any) => {
                          setConfirmBlock(e.target.value);
                        }}
                      >
                        <MenuItem value={0}>Is unconfirmed</MenuItem>
                        <MenuItem value={1}>Has at least 1 confirmation</MenuItem>
                        <MenuItem value={2}>Has at least 2 confirmation</MenuItem>
                        <MenuItem value={3}>Has at least 6 confirmation</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box mt={3}>
                  <Stack direction={'row'} alignItems={'center'}>
                    <Switch
                      checked={showRecommendedFee}
                      onChange={(e: any) => {
                        setShowRecommendedFee(e.target.checked);
                      }}
                    />
                    <Box ml={2}>
                      <Typography>Show recommended fee</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box mt={6}>
                  <Button variant={'contained'} onClick={updatePaymentSetting}>
                    Save Payment Settings
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box>
              {wallet &&
                wallet.length > 0 &&
                wallet.map((item, index) => (
                  <Box key={index} mb={10}>
                    <Stack direction={'row'} justifyContent={'space-between'}>
                      <Box>
                        <Typography fontWeight={'bold'} fontSize={18}>
                          {item.type}
                        </Typography>
                        <Typography mt={1}>{item.address}</Typography>
                        <Typography mt={1} fontWeight={'bold'}>
                          {item.trxBalance} TRX
                        </Typography>
                        <Typography mt={1} fontWeight={'bold'}>
                          {item.usdtBalance} USDT
                        </Typography>
                        <Typography mt={1} fontWeight={'bold'}>
                          {item.usdcBalance} USDC
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          href={GetBlockchainAddressUrl(getNetwork() === 'mainnet' ? true : false, item.address)}
                          target={'_blank'}
                        >
                          Check onChain
                        </Button>
                      </Box>
                    </Stack>
                    <Box mt={5}>
                      {item.transactions && item.transactions.length > 0 ? (
                        <TransactionsTab rows={item.transactions} />
                      ) : (
                        <Typography>There are no transactions yet.</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Tron;

function TransactionsTab({ rows }: { rows: TransactionDetail[] }) {
  const { getNetwork } = useUserPresistStore((state) => state);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Hash</TableCell>
            {/* <TableCell>Value</TableCell> */}
            <TableCell>Asset</TableCell>
            {/* <TableCell>Contract Address</TableCell> */}
            <TableCell>Type</TableCell>
            <TableCell>Block Timestamp</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                <Link href={GetBlockchainTxUrl(getNetwork() === 'mainnet' ? true : false, row.hash)} target={'_blank'}>
                  {row.hash}
                </Link>
              </TableCell>
              {/* <TableCell>{row.amount}</TableCell> */}
              <TableCell>{row.asset}</TableCell>
              {/* <TableCell>{row.contractAddress}</TableCell> */}
              <TableCell>{row.type}</TableCell>
              <TableCell>{new Date((row.blockTimestamp as number) * 1000).toLocaleString()}</TableCell>
              <TableCell>{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
