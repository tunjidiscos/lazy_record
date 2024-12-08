import { ContentCopy, CopyAll, QrCode } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { useSnackPresistStore } from 'lib/store';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import { PAYOUT_SOURCE_TYPE, PAYOUT_STATUS } from 'packages/constants';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BLOCKCHAIN, BLOCKCHAINNAMES, CHAINS, COIN } from 'packages/constants/blockchain';
import Image from 'next/image';
import { FindChainNamesByChains } from 'utils/web3';
import { QRCodeSVG } from 'qrcode.react';
import { OmitMiddleString } from 'utils/strings';

type pullPaymentType = {
  userId: number;
  storeId: number;
  pullPaymentId: number;
  network: number;
  name: string;
  amount: number;
  currency: string;
  showAutoApproveClaim: boolean;
  description: string;
  pullPaymentStatus: string;
  createdDate: string;
  updateDate: string;
};

type PayoutType = {
  address: string;
  chainName: string;
  amount: number;
  currency: string;
  status: string;
};

const PullPaymentsDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const [page, setPage] = useState<number>(1);

  const [pullPaymentData, setPullPaymentData] = useState<pullPaymentType>();
  const [payoutRows, setPayoutRows] = useState<PayoutType[]>([]);
  const [alreadyClaim, setAlreadyClaim] = useState<number>(0);
  const [showQR, setShowQR] = useState<boolean>(false);

  const { setSnackSeverity, setSnackMessage, setSnackOpen } = useSnackPresistStore((state) => state);

  const getClaimsHistory = async (storeId: number, network: number, pullPaymentId: number) => {
    try {
      const response: any = await axios.get(Http.find_payout_by_source_type, {
        params: {
          store_id: storeId,
          network: network,
          source_type: PAYOUT_SOURCE_TYPE.PullPayment,
          external_payment_id: pullPaymentId,
        },
      });

      if (response.result && response.data.length > 0) {
        let rt: PayoutType[] = [];
        let paid = 0;
        response.data.forEach((item: any) => {
          rt.push({
            chainName: FindChainNamesByChains(item.chain_id as CHAINS),
            address: item.address,
            amount: item.amount,
            currency: item.currency,
            status: item.payout_status,
          });

          if (item.payout_status === PAYOUT_STATUS.Completed) {
            paid += parseFloat(item.amount);
          }
        });
        setPayoutRows(rt);

        setAlreadyClaim(paid);
      } else {
        setPayoutRows([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const init = async (id: any) => {
    try {
      if (!id) return;

      const response: any = await axios.get(Http.find_pull_payment_by_id, {
        params: {
          id: id,
        },
      });

      if (response.result && response.data.length === 1) {
        setPullPaymentData({
          userId: response.data[0].user_id,
          storeId: response.data[0].store_id,
          network: response.data[0].network,
          pullPaymentId: response.data[0].pull_payment_id,
          name: response.data[0].title,
          amount: response.data[0].amount,
          currency: response.data[0].currency,
          description: response.data[0].description,
          showAutoApproveClaim: response.data[0].show_auto_approve_claim === 1 ? true : false,
          createdDate: new Date(response.data[0].created_date).toLocaleString(),
          updateDate: new Date(response.data[0].created_date).toLocaleString(),
          pullPaymentStatus: response.data[0].status,
        });

        await getClaimsHistory(response.data[0].store_id, response.data[0].network, response.data[0].pull_payment_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    id && init(id);
  }, [id]);

  const onClickShowQR = async () => {
    setShowQR(true);
  };

  const onClickCoin = async (item: COIN, address: string, amount: number) => {
    try {
      const checkout_resp: any = await axios.get(Http.checkout_chain_address, {
        params: {
          chain_id: CHAINS.BITCOIN,
          address: address,
          network: pullPaymentData?.network,
        },
      });

      if (!checkout_resp.result) {
        setSnackSeverity('error');
        setSnackMessage('The input address is invalid, please try it again!');
        setSnackOpen(true);
        return;
      }

      const create_payout_resp: any = await axios.post(Http.create_payout, {
        user_id: pullPaymentData?.userId,
        store_id: pullPaymentData?.storeId,
        network: pullPaymentData?.network,
        chain_id: item.chainId,
        address: address,
        source_type: PAYOUT_SOURCE_TYPE.PullPayment,
        amount: amount,
        currency: pullPaymentData?.currency,
        external_payment_id: pullPaymentData?.pullPaymentId,
      });

      if (create_payout_resp.result) {
        setSnackSeverity('success');
        setSnackMessage('Successful creation!');
        setSnackOpen(true);

        await init(id);

        setPage(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box mt={4}>
      <Container>
        {pullPaymentData && alreadyClaim >= pullPaymentData?.amount && (
          <Box mt={2}>
            <Alert variant="filled" severity="success">
              The pull payment has reached its limit, and you can read the detail of the payout.
            </Alert>
          </Box>
        )}

        {page === 1 && (
          <Box>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <Card style={{ height: 260 }}>
                  <CardContent>
                    <Stack direction={'row'} alignItems={'center'}>
                      <Typography>Start Date</Typography>
                      <Typography ml={1}>{pullPaymentData?.createdDate}</Typography>
                    </Stack>
                    <Stack direction={'row'} alignItems={'center'} mt={1}>
                      <Typography>Last Updated</Typography>
                      <Typography ml={1}>{pullPaymentData?.updateDate}</Typography>
                    </Stack>
                    <Stack direction={'row'} alignItems={'center'} mt={2}>
                      <Button
                        variant={'outlined'}
                        onClick={async () => {
                          await navigator.clipboard.writeText(window.location.href);

                          setSnackMessage('Successfully copy');
                          setSnackSeverity('success');
                          setSnackOpen(true);
                        }}
                      >
                        Copy Link
                      </Button>
                      <Box ml={1}>
                        <Button
                          component="label"
                          role={undefined}
                          variant={'outlined'}
                          tabIndex={-1}
                          startIcon={<QrCode />}
                          onClick={onClickShowQR}
                        >
                          Show QR
                        </Button>
                      </Box>
                    </Stack>

                    <Typography mt={4}>{pullPaymentData?.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card style={{ height: 260 }}>
                  <CardContent>
                    <Typography variant="h5">Payment Details</Typography>
                    <Stack mt={4} direction={'row'} color={'green'}>
                      <Typography fontWeight={'bold'}>
                        {((pullPaymentData?.amount as number) - alreadyClaim).toFixed(2)}
                      </Typography>
                      <Typography fontWeight={'bold'} ml={1}>
                        {pullPaymentData?.currency}
                      </Typography>
                    </Stack>
                    <Typography mt={1}>Available claim</Typography>

                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} mt={4}>
                      <Box>
                        <Stack direction={'row'} alignItems={'center'} justifyContent={'left'}>
                          <Typography fontWeight={'bold'}>{alreadyClaim}</Typography>
                          <Typography fontWeight={'bold'} ml={1}>
                            {pullPaymentData?.currency}
                          </Typography>
                        </Stack>
                        <Typography>Already claimed</Typography>
                      </Box>
                      <Box>
                        <Stack direction={'row'} alignItems={'center'} justifyContent={'right'}>
                          <Typography mr={1} fontWeight={'bold'}>
                            {pullPaymentData?.amount}
                          </Typography>
                          <Typography fontWeight={'bold'}>{pullPaymentData?.currency}</Typography>
                        </Stack>
                        <Typography>Claim limit</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box mt={4}>
              <Card>
                <CardContent>
                  <Typography variant="h5">Claims</Typography>
                  <Box mt={4}>
                    {payoutRows && payoutRows.length > 0 ? (
                      <TableContainer component={Paper}>
                        <Table aria-label="simple table">
                          <TableHead>
                            <TableRow>
                              <TableCell>Destination</TableCell>
                              <TableCell>Method</TableCell>
                              <TableCell>Amount requested</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {payoutRows.map((row, index) => (
                              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">
                                  {row.address}
                                </TableCell>
                                <TableCell>{row.chainName}</TableCell>
                                <TableCell>
                                  <Typography>
                                    {row.amount} {row.currency}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography>{row.status}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography mt={2}>No claims have been made yet.</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {pullPaymentData && alreadyClaim < pullPaymentData?.amount && (
              <Box mt={4}>
                <Button
                  variant={'contained'}
                  fullWidth
                  size="large"
                  onClick={() => {
                    setPage(2);
                  }}
                >
                  Claim Funds
                </Button>
              </Box>
            )}
          </Box>
        )}
        {page === 2 && (
          <Box mt={2}>
            <SelectChainAndCrypto
              network={pullPaymentData?.network as number}
              amount={pullPaymentData?.amount as number}
              currency={pullPaymentData?.currency as string}
              onClickCoin={onClickCoin}
            />
          </Box>
        )}
      </Container>

      <Dialog
        onClose={() => {
          setShowQR(false);
        }}
        open={showQR}
        fullWidth
      >
        <DialogTitle>Pull Payment QR</DialogTitle>
        <DialogContent>
          <Box mt={2} textAlign={'center'}>
            <QRCodeSVG
              value={window.location.href}
              width={250}
              height={250}
              imageSettings={{
                src: '',
                width: 35,
                height: 35,
                excavate: false,
              }}
            />
          </Box>

          <Box mt={4}>
            <Typography>PULL PAYMENT QR</Typography>
            <Stack direction={'row'} alignItems={'center'}>
              <Typography mr={1}>{OmitMiddleString(window.location.href, 20)}</Typography>
              <IconButton
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href);

                  setSnackMessage('Successfully copy');
                  setSnackSeverity('success');
                  setSnackOpen(true);
                }}
              >
                <CopyAll />
              </IconButton>
            </Stack>
          </Box>

          <Box mt={4}>
            <Typography>Scan this QR code to open this page on your mobile device.</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PullPaymentsDetails;

type SelectType = {
  network: number;
  amount: number;
  currency: string;
  onClickCoin: (item: COIN, address: string, amount: number) => Promise<void>;
};

const SelectChainAndCrypto = (props: SelectType) => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [blockchain, setBlcokchain] = useState<BLOCKCHAIN[]>([]);
  const [selectCoinItem, setSelectCoinItem] = useState<COIN>();

  const [address, setAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    const value = BLOCKCHAINNAMES.filter((item: any) => (props.network === 1 ? item.isMainnet : !item.isMainnet));
    setBlcokchain(value);
  }, [props.network]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant={'h5'} textAlign={'center'} mt={1}>
            Select Chain and Crypto
          </Typography>
        </CardContent>
      </Card>
      <Box mt={2}>
        {blockchain &&
          blockchain.length > 0 &&
          blockchain.map((item, index) => (
            <Accordion expanded={expanded === item.name} onChange={handleChange(item.name)} key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1bh-content">
                <Typography sx={{ width: '33%', flexShrink: 0 }}>{item.name}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>{item.desc}</Typography>
              </AccordionSummary>
              {item.coins &&
                item.coins.length > 0 &&
                item.coins.map((coinItem, coinIndex) => (
                  <AccordionDetails key={coinIndex}>
                    <Button
                      fullWidth
                      onClick={async () => {
                        setSelectCoinItem(coinItem);
                      }}
                    >
                      <Image src={coinItem.icon} alt="icon" width={50} height={50} />
                      <Typography ml={2}>{coinItem.name}</Typography>
                    </Button>
                  </AccordionDetails>
                ))}
            </Accordion>
          ))}
      </Box>

      {selectCoinItem && (
        <Box mt={2}>
          <Card>
            <CardContent>
              <Grid container mt={2} gap={1} justifyContent={'space-between'} alignItems={'center'}>
                <Grid item xs={5}>
                  <FormControl variant="outlined" fullWidth>
                    <OutlinedInput
                      type="text"
                      endAdornment={
                        <InputAdornment position="end">{FindChainNamesByChains(selectCoinItem.chainId)}</InputAdornment>
                      }
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={address}
                      onChange={(e: any) => {
                        setAddress(e.target.value);
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <FormControl variant="outlined" fullWidth>
                    <OutlinedInput
                      type="number"
                      endAdornment={<InputAdornment position="end">{props.currency}</InputAdornment>}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={amount}
                      onChange={(e: any) => {
                        setAmount(e.target.value);
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <Button
                    size={'large'}
                    variant={'contained'}
                    fullWidth
                    onClick={async () => {
                      await props.onClickCoin(selectCoinItem, address, amount);
                    }}
                  >
                    Claim Funds
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};
