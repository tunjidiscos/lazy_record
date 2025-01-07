import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  Icon,
  InputAdornment,
  OutlinedInput,
  Radio,
  RadioGroup,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore, useWalletPresistStore } from 'lib/store';
import { CHAINS, COINS } from 'packages/constants/blockchain';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import { BigDiv, BigMul, GweiToEther, WeiToGwei } from 'utils/number';
import EthereumSVG from 'assets/chain/ethereum.svg';
import Image from 'next/image';
import { OmitMiddleString } from 'utils/strings';
import { GetBlockchainTxUrl } from 'utils/chain/eth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Link from 'next/link';
import { COINGECKO_IDS, PAYOUT_STATUS } from 'packages/constants';
import { useRouter } from 'next/router';

type feeType = {
  high: number;
  average: number;
  low: number;
};

type maxPriortyFeeType = {
  fast: number;
  normal: number;
  slow: number;
};

type Coin = {
  [currency: string]: string;
};

const EthereumSend = () => {
  const router = useRouter();
  const { payoutId } = router.query;

  const [alignment, setAlignment] = useState<'high' | 'average' | 'low'>('average');
  const [maxPriortyFeeAlignment, setMaxPriortyFeeAlignment] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [feeObj, setFeeObj] = useState<feeType>();
  const [maxPriortyFeeObj, setMaxPriortyFeeObj] = useState<maxPriortyFeeType>();

  const [page, setPage] = useState<number>(1);
  const [fromAddress, setFromAddress] = useState<string>('');
  const [balance, setBalance] = useState<Coin>({});
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [maxFee, setMaxFee] = useState<number>(0);
  const [maxPriortyFee, setMaxPriortyFee] = useState<number>(0);
  const [gasLimit, setGasLimit] = useState<number>(0);

  const [networkFee, setNetworkFee] = useState<string>('');
  const [blockExplorerLink, setBlockExplorerLink] = useState<string>('');
  const [nonce, setNonce] = useState<number>(0);
  const [coin, setCoin] = useState<string>('ETH');
  const [displaySign, setDisplaySign] = useState<boolean>(false);
  const [amountRed, setAmountRed] = useState<boolean>(false);

  const [isDisableDestinationAddress, setIsDisableDestinationAddress] = useState<boolean>(false);
  const [isDisableAmount, setIsDisableAmount] = useState<boolean>(false);

  const { getNetwork, getUserId } = useUserPresistStore((state) => state);
  const { getWalletId } = useWalletPresistStore((state) => state);
  const { getStoreId } = useStorePresistStore((state) => state);
  const { setSnackOpen, setSnackMessage, setSnackSeverity } = useSnackPresistStore((state) => state);

  const handleChangeFees = (e: any) => {
    switch (e.target.value) {
      case 'high':
        setMaxFee(WeiToGwei(feeObj?.high as number));
        break;
      case 'average':
        setMaxFee(WeiToGwei(feeObj?.average as number));
        break;
      case 'low':
        setMaxFee(WeiToGwei(feeObj?.low as number));
        break;
    }
    setAlignment(e.target.value);
  };

  const handleChangeMaxPriortyFee = (e: any) => {
    switch (e.target.value) {
      case 'fast':
        setMaxPriortyFee(WeiToGwei(maxPriortyFeeObj?.fast as number));
        break;
      case 'normal':
        setMaxPriortyFee(WeiToGwei(maxPriortyFeeObj?.normal as number));
        break;
      case 'slow':
        setMaxPriortyFee(WeiToGwei(maxPriortyFeeObj?.slow as number));
        break;
    }
    setMaxPriortyFeeAlignment(e.target.value);
  };

  const getEthereum = async () => {
    try {
      const find_payment_resp: any = await axios.get(Http.find_asset_balance, {
        params: {
          user_id: getUserId(),
          chain_id: CHAINS.ETHEREUM,
          store_id: getStoreId(),
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });
      if (find_payment_resp.result) {
        setFromAddress(find_payment_resp.data.address);
        setBalance(find_payment_resp.data.balance);

        await getEthereumNonce(find_payment_resp.data.address);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getEthereumGasLimit = async (from: string): Promise<boolean> => {
    try {
      const find_gas_limit_resp: any = await axios.get(Http.find_gas_limit, {
        params: {
          chain_id: CHAINS.ETHEREUM,
          network: getNetwork() === 'mainnet' ? 1 : 2,
          coin: coin,
          from: from,
          to: destinationAddress,
          value: amount,
        },
      });
      if (find_gas_limit_resp.result) {
        setGasLimit(find_gas_limit_resp.data);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const getEthereumFeeRate = async () => {
    try {
      const find_fee_resp: any = await axios.get(Http.find_fee_rate, {
        params: {
          chain_id: CHAINS.ETHEREUM,
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });
      if (find_fee_resp.result) {
        setFeeObj({
          high: find_fee_resp.data.fast,
          average: find_fee_resp.data.normal,
          low: find_fee_resp.data.slow,
        });
        setMaxFee(WeiToGwei(find_fee_resp.data.normal));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getEthereumMaxPriortyFee = async () => {
    try {
      const find_max_priorty_fee_resp: any = await axios.get(Http.find_max_priorty_fee, {
        params: {
          chain_id: CHAINS.ETHEREUM,
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });
      if (find_max_priorty_fee_resp.result) {
        setMaxPriortyFeeObj({
          fast: find_max_priorty_fee_resp.data.fast,
          normal: find_max_priorty_fee_resp.data.normal,
          slow: find_max_priorty_fee_resp.data.slow,
        });
        setMaxPriortyFee(WeiToGwei(find_max_priorty_fee_resp.data.normal));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getEthereumNonce = async (address: string) => {
    if (address && address != '') {
      try {
        const find_nonce_resp: any = await axios.get(Http.find_nonce, {
          params: {
            chain_id: CHAINS.ETHEREUM,
            network: getNetwork() === 'mainnet' ? 1 : 2,
            address: address,
          },
        });
        if (find_nonce_resp.result) {
          setNonce(find_nonce_resp.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getPayoutInfo = async (id: any) => {
    try {
      const find_payout_resp: any = await axios.get(Http.find_payout_by_id, {
        params: {
          id: id,
        },
      });

      if (find_payout_resp.result && find_payout_resp.data.length === 1) {
        setDestinationAddress(find_payout_resp.data[0].address);

        const ids = COINGECKO_IDS[find_payout_resp.data[0].crypto as COINS];
        const rate_response: any = await axios.get(Http.find_crypto_price, {
          params: {
            ids: ids,
            currency: find_payout_resp.data[0].currency,
          },
        });

        const rate = rate_response.data[ids][find_payout_resp.data[0].currency.toLowerCase()];
        const totalPrice = parseFloat(BigDiv((find_payout_resp.data[0].amount as number).toString(), rate)).toFixed(4);
        setAmount(totalPrice);
        setCoin(find_payout_resp.data[0].crypto);

        setIsDisableDestinationAddress(true);
        setIsDisableAmount(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkAddress = async (): Promise<boolean> => {
    if (destinationAddress === fromAddress) {
      return false;
    }

    if (!destinationAddress || destinationAddress === '') {
      return false;
    }

    try {
      const checkout_resp: any = await axios.get(Http.checkout_chain_address, {
        params: {
          chain_id: CHAINS.ETHEREUM,
          address: destinationAddress,
          network: getNetwork() === 'mainnet' ? 1 : 2,
        },
      });
      return checkout_resp.result;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const checkAmount = (): boolean => {
    if (amount && parseFloat(amount) != 0 && parseFloat(balance[coin]) >= parseFloat(amount)) {
      return true;
    }

    return false;
  };

  const checkNonce = (): boolean => {
    if (nonce >= 0) {
      return true;
    }

    return false;
  };

  const checkMaxFee = (): boolean => {
    if (maxFee && maxFee >= 0) {
      return true;
    }

    return false;
  };

  const checkMaxPriortyFee = (): boolean => {
    if (maxPriortyFee && maxPriortyFee >= 0) {
      return true;
    }

    return false;
  };

  const checkGasLimit = async (): Promise<boolean> => {
    if (gasLimit && gasLimit > 0) {
      return true;
    }

    return await getEthereumGasLimit(fromAddress);
  };

  const onClickSignTransaction = async () => {
    if (!(await checkAddress())) {
      setSnackSeverity('error');
      setSnackMessage('The destination address cannot be empty or input errors');
      setSnackOpen(true);
      return;
    }

    if (!checkAmount()) {
      setSnackSeverity('error');
      setSnackMessage('Insufficient balance or input error');
      setSnackOpen(true);
      return;
    }

    if (!checkNonce()) {
      setSnackSeverity('error');
      setSnackMessage('Incorrect nonce amount');
      setSnackOpen(true);
      return;
    }

    if (!checkMaxFee()) {
      setSnackSeverity('error');
      setSnackMessage('Incorrect max fee');
      setSnackOpen(true);
      return;
    }

    if (!checkMaxPriortyFee()) {
      setSnackSeverity('error');
      setSnackMessage('Incorrect max priorty fee');
      setSnackOpen(true);
      return;
    }

    if (!(await checkGasLimit())) {
      setSnackSeverity('error');
      setSnackMessage('Incorrect gas limit');
      setSnackOpen(true);
      return;
    } else {
      setDisplaySign(true);
    }

    if (displaySign) {
      if (coin === 'ETH') {
        if (!networkFee || !amount || parseFloat(networkFee) * 2 + parseFloat(amount) > parseFloat(balance['ETH'])) {
          setSnackSeverity('error');
          setSnackMessage('Insufficient balance or input error');
          setSnackOpen(true);
          return;
        }
      }

      if (networkFee && networkFee != '') {
        setPage(2);
      }
    }
  };

  const onClickSignAndPay = async () => {
    try {
      const send_transaction_resp: any = await axios.post(Http.send_transaction, {
        chain_id: CHAINS.ETHEREUM,
        from_address: fromAddress,
        to_address: destinationAddress,
        network: getNetwork() === 'mainnet' ? 1 : 2,
        wallet_id: getWalletId(),
        user_id: getUserId(),
        value: amount,
        coin: coin,
        nonce: nonce,
        max_fee: maxFee,
        max_priorty_fee: maxPriortyFee,
        gas_limit: gasLimit,
      });

      if (send_transaction_resp.result) {
        // update payout order
        if (payoutId) {
          const update_payout_resp: any = await axios.put(Http.update_payout_by_id, {
            user_id: getUserId(),
            store_id: getStoreId(),
            id: payoutId,
            tx: send_transaction_resp.data.hash,
            crypto_amount: amount,
            payout_status: PAYOUT_STATUS.Completed,
          });

          if (!update_payout_resp.result) {
            setSnackSeverity('error');
            setSnackMessage('Can not update the status of payout!');
            setSnackOpen(true);
            return;
          }
        }

        setSnackSeverity('success');
        setSnackMessage('Successful creation!');
        setSnackOpen(true);

        setBlockExplorerLink(GetBlockchainTxUrl(getNetwork() === 'mainnet', send_transaction_resp.data.hash));

        setPage(3);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (maxFee && maxFee > 0 && gasLimit && gasLimit > 0) {
      setNetworkFee(parseFloat(BigMul(GweiToEther(maxFee).toString(), gasLimit.toString())).toFixed(8));
    }
  }, [maxFee, gasLimit]);

  const init = async (payoutId: any) => {
    await getEthereum();
    await getEthereumFeeRate();
    await getEthereumMaxPriortyFee();

    if (payoutId) {
      await getPayoutInfo(payoutId);
    }
  };

  useEffect(() => {
    init(payoutId);
  }, [payoutId]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mb={10}>
      <Typography variant="h4" mt={4}>
        Send Coin on Ethereum
      </Typography>
      <Container>
        {page === 1 && (
          <>
            <Box mt={4}>
              <Stack mt={2} direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                <Typography>From Address</Typography>
              </Stack>
              <Box mt={1}>
                <FormControl fullWidth variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    value={fromAddress}
                    disabled
                  />
                </FormControl>
              </Box>
            </Box>

            <Box mt={4}>
              <Stack mt={2} direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
                <Typography>Destination Address</Typography>
              </Stack>
              <Box mt={1}>
                <FormControl fullWidth variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    value={destinationAddress}
                    onChange={(e: any) => {
                      setDestinationAddress(e.target.value);
                    }}
                    disabled={isDisableDestinationAddress}
                  />
                </FormControl>
              </Box>
            </Box>

            <Box mt={4}>
              <Typography>Coin</Typography>
              <Box mt={1}>
                <FormControl>
                  <RadioGroup
                    value={coin}
                    onChange={(e: any) => {
                      setCoin(e.target.value);
                    }}
                  >
                    {balance &&
                      Object.entries(balance).map((item, index) => (
                        <FormControlLabel
                          value={item[0]}
                          control={<Radio />}
                          label={`${item[0].toUpperCase()} => Balance: ${item[1]}`}
                          key={index}
                          labelPlacement={'end'}
                        />
                      ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>

            <Box mt={4}>
              <Typography>Amount</Typography>
              <Box mt={1}>
                <FormControl fullWidth variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    type="number"
                    value={amount}
                    onChange={(e: any) => {
                      setAmount(e.target.value);
                      if (parseFloat(e.target.value) > parseFloat(balance[coin])) {
                        setAmountRed(true);
                      } else {
                        setAmountRed(false);
                      }
                    }}
                    disabled={isDisableAmount}
                  />
                </FormControl>
              </Box>
              <Typography mt={1} color={amountRed ? 'red' : 'none'} fontWeight={'bold'}>
                Your available balance is {balance[coin]} {coin}
              </Typography>
            </Box>

            <Box mt={4}>
              <Typography>Nonce</Typography>
              <Box mt={1}>
                <FormControl fullWidth variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    type="number"
                    value={nonce}
                    onChange={(e: any) => {
                      setNonce(e.target.value);
                    }}
                  />
                </FormControl>
              </Box>
            </Box>

            <Box mt={4}>
              <Typography>MaxFee (Gwei)</Typography>
              <Box mt={1}>
                <FormControl sx={{ width: '25ch' }} variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    type="number"
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    value={maxFee}
                    onChange={(e: any) => {
                      setMaxFee(e.target.value);
                    }}
                  />
                </FormControl>
              </Box>
            </Box>

            <Stack mt={4} direction={'row'} alignItems={'center'}>
              <Typography>Confirm in the next</Typography>
              <Box ml={2}>
                <ToggleButtonGroup
                  color="primary"
                  value={alignment}
                  exclusive
                  onChange={handleChangeFees}
                  aria-label="type"
                >
                  <ToggleButton value="high">High</ToggleButton>
                  <ToggleButton value="average">Average</ToggleButton>
                  <ToggleButton value="low">Low</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>

            <Box mt={4}>
              <Typography>MaxPriortyFee (Gwei)</Typography>
              <Box mt={1}>
                <FormControl sx={{ width: '25ch' }} variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    type="number"
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    value={maxPriortyFee}
                    onChange={(e: any) => {
                      setMaxPriortyFee(e.target.value);
                    }}
                  />
                </FormControl>
              </Box>
            </Box>

            <Stack mt={4} direction={'row'} alignItems={'center'}>
              <Typography>Confirm in the next</Typography>
              <Box ml={2}>
                <ToggleButtonGroup
                  color="primary"
                  value={maxPriortyFeeAlignment}
                  exclusive
                  onChange={handleChangeMaxPriortyFee}
                  aria-label="type"
                >
                  <ToggleButton value="fast">Fast</ToggleButton>
                  <ToggleButton value="normal">Normal</ToggleButton>
                  <ToggleButton value="slow">Slow</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>

            {displaySign && (
              <>
                <Box mt={4}>
                  <Typography>Gas</Typography>
                  <Box mt={1}>
                    <FormControl sx={{ width: '25ch' }} variant="outlined">
                      <OutlinedInput
                        size={'small'}
                        type="number"
                        aria-describedby="outlined-weight-helper-text"
                        inputProps={{
                          'aria-label': 'weight',
                        }}
                        value={gasLimit}
                        onChange={(e: any) => {
                          setGasLimit(e.target.value);
                        }}
                      />
                    </FormControl>
                  </Box>
                </Box>
                <Box mt={4}>
                  <Typography>
                    Miner Fee: {networkFee} ETH = MaxFee({maxFee}) * Gas({gasLimit})
                  </Typography>
                </Box>
              </>
            )}

            <Box mt={8}>
              <Button variant={'contained'} onClick={onClickSignTransaction}>
                {displaySign ? 'Sign Transaction' : 'Calculate Gas Fee'}
              </Button>
            </Box>
          </>
        )}

        {page === 2 && (
          <>
            <Box textAlign={'center'}>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} mt={4}>
                <Image src={EthereumSVG} alt="" width={25} height={25} />
                <Typography ml={1}>
                  {getNetwork() === 'mainnet' ? 'Ethereum Mainnet' : 'Ethereum Sepolia Testnet'}
                </Typography>
              </Stack>

              <Box mt={4}>
                <Typography>Send to</Typography>
                <Typography mt={1}>{OmitMiddleString(destinationAddress)}</Typography>
              </Box>

              <Box mt={4}>
                <Typography>Spend Amount</Typography>
                <Stack direction={'row'} alignItems={'baseline'} justifyContent={'center'}>
                  <Typography mt={1} variant={'h4'}>
                    {amount}
                  </Typography>
                  <Typography ml={1}>{coin}</Typography>
                </Stack>
                <Stack direction={'row'} alignItems={'baseline'} justifyContent={'center'}>
                  <Typography mt={1}>{networkFee}</Typography>
                  <Typography ml={1}>ETH</Typography>
                  <Typography ml={1}>(network fee)</Typography>
                </Stack>
              </Box>

              <Box mt={4}>
                <Typography>Coin:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={coin}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box mt={4}>
                <Typography>Nonce:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={nonce}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box mt={4}>
                <Typography>Max Fee:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      endAdornment={<InputAdornment position="end">Gwei</InputAdornment>}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={maxFee}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box mt={4}>
                <Typography>Max Priorty Fee:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      endAdornment={<InputAdornment position="end">Gwei</InputAdornment>}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={maxPriortyFee}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box mt={4}>
                <Typography>Gas Limit:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={gasLimit}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box mt={4}>
                <Typography>Network Fee:</Typography>
                <Box mt={1}>
                  <FormControl variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      endAdornment={<InputAdornment position="end">ETH</InputAdornment>}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        'aria-label': 'weight',
                      }}
                      value={networkFee}
                      disabled
                    />
                  </FormControl>
                </Box>
              </Box>

              <Stack mt={8} direction={'row'} alignItems={'center'} justifyContent={'center'}>
                <Button
                  variant={'contained'}
                  onClick={() => {
                    setPage(1);
                  }}
                >
                  Reject
                </Button>
                <Box ml={2}>
                  <Button variant={'contained'} onClick={onClickSignAndPay}>
                    Sign & Pay
                  </Button>
                </Box>
              </Stack>
            </Box>
          </>
        )}

        {page === 3 && (
          <>
            <Box textAlign={'center'} mt={10}>
              <Icon component={CheckCircleIcon} color={'success'} style={{ fontSize: 80 }} />
              <Typography mt={2} fontWeight={'bold'} fontSize={20}>
                Payment Sent
              </Typography>
              <Typography mt={2}>Your transaction has been successfully sent</Typography>
              <Link href={blockExplorerLink} target="_blank">
                <Stack direction={'row'} alignItems={'center'} justifyContent={'center'} mt={2}>
                  <Icon component={RemoveRedEyeIcon} />
                  <Typography ml={1}>View on Block Explorer</Typography>
                </Stack>
              </Link>
              <Box mt={10}>
                <Button
                  size={'large'}
                  variant={'contained'}
                  style={{ width: 500 }}
                  onClick={() => {
                    window.location.href = '/wallets/ethereum';
                  }}
                >
                  Done
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default EthereumSend;
