import { ExpandMore, ReportGmailerrorred } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CURRENCY, PULL_PAYMENT_STATUS } from 'packages/constants';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore } from 'lib/store';
import PullPaymentDataGrid from 'components/DataList/PullPaymentDataGrid';

const Pullpayments = () => {
  const [openPullPayment, setOpenPullPayment] = useState<boolean>(false);
  const [openCreatePullPayment, setOpenCreatePullPayment] = useState<boolean>(false);

  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>(CURRENCY[0]);
  const [showAutoApproveClaim, setShowAutoApproveClaim] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [showNameAlert, setShowNameAlert] = useState<boolean>(false);
  const [showAmountAlert, setShowAmountAlert] = useState<boolean>(false);

  const { getUserId, getNetwork } = useUserPresistStore((state) => state);
  const { getStoreId } = useStorePresistStore((state) => state);
  const { setSnackOpen, setSnackMessage, setSnackSeverity } = useSnackPresistStore((state) => state);

  const clearData = () => {
    setName('');
    setAmount(0);
    setCurrency(CURRENCY[0]);
    setShowAutoApproveClaim(false);
    setDescription('');
  };

  const checkName = (): boolean => {
    if (name && name != '') {
      setShowNameAlert(false);
      return true;
    }

    setShowNameAlert(true);
    return false;
  };

  const checkAmount = (): boolean => {
    if (amount && amount > 0) {
      setShowAmountAlert(false);
      return true;
    }

    setShowAmountAlert(true);
    return false;
  };

  const onClickCreate = async () => {
    try {
      if (!checkName()) {
        return;
      }

      if (!checkAmount()) {
        return;
      }

      const response: any = await axios.post(Http.create_pull_payment, {
        user_id: getUserId(),
        store_id: getStoreId(),
        network: getNetwork() === 'mainnet' ? 1 : 2,
        name: name,
        amount: amount,
        currency: currency,
        show_auto_approve_claim: showAutoApproveClaim ? 1 : 2,
        description: description,
      });

      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Successful create!');
        setSnackOpen(true);

        clearData();
        setOpenCreatePullPayment(false);
      } else {
        setSnackSeverity('error');
        setSnackMessage('Something wrong, please try it again');
        setSnackOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Container>
        {openCreatePullPayment ? (
          <Box>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} pt={5}>
              <Typography variant="h6">Create pull payment</Typography>
              <Button variant={'contained'} onClick={onClickCreate}>
                Create
              </Button>
            </Stack>

            <Box mt={4}>
              <Typography>Name</Typography>
              <Box mt={1}>
                <FormControl sx={{ width: 500 }} variant="outlined">
                  <OutlinedInput
                    size={'small'}
                    aria-describedby="outlined-weight-helper-text"
                    inputProps={{
                      'aria-label': 'weight',
                    }}
                    value={name}
                    onChange={(e: any) => {
                      setName(e.target.value);
                    }}
                  />
                </FormControl>
              </Box>
              {showNameAlert && (
                <Typography mt={1} color={'red'}>
                  The Name field is required.
                </Typography>
              )}
            </Box>

            <Stack mt={4} alignItems={'baseline'} direction={'row'} gap={3}>
              <Box>
                <Typography>Amount</Typography>
                <Box mt={1}>
                  <FormControl sx={{ width: 500 }} variant="outlined">
                    <OutlinedInput
                      size={'small'}
                      type="number"
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
                </Box>
                {showAmountAlert && (
                  <Typography mt={1} color={'red'}>
                    Please provide an amount greater than 0
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography>Currency</Typography>
                <Box mt={1}>
                  <FormControl sx={{ width: 200 }}>
                    <Select
                      size={'small'}
                      inputProps={{ 'aria-label': 'Without label' }}
                      value={currency}
                      onChange={(e: any) => {
                        setCurrency(e.target.value);
                      }}
                    >
                      {CURRENCY &&
                        CURRENCY.length > 0 &&
                        CURRENCY.map((item, index) => (
                          <MenuItem value={item} key={index}>
                            {item}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Stack>

            <Box mt={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAutoApproveClaim}
                    onChange={() => {
                      setShowAutoApproveClaim(!showAutoApproveClaim);
                    }}
                  />
                }
                label="Automatically approve claims"
              />
            </Box>

            {/* <Box mt={4}>
              <Typography>Payout Methods</Typography>
              <Box mt={1}>
                <FormControlLabel control={<Checkbox defaultChecked />} label="chain" />
              </Box>
            </Box> */}

            <Box mt={4}>
              <Typography>Description</Typography>
              <Box mt={1}>
                <TextField
                  multiline
                  rows={10}
                  fullWidth
                  value={description}
                  onChange={(e: any) => {
                    setDescription(e.target.value);
                  }}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} pt={5}>
              <Stack direction={'row'} alignItems={'center'}>
                <Typography variant="h6">Pull payments</Typography>
                <IconButton
                  onClick={() => {
                    setOpenPullPayment(!openPullPayment);
                  }}
                >
                  <ReportGmailerrorred />
                </IconButton>
              </Stack>
              <Button
                variant={'contained'}
                onClick={() => {
                  setOpenCreatePullPayment(true);
                }}
              >
                Create pull payment
              </Button>
            </Stack>

            <Box mt={5}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
                  <Tab label={PULL_PAYMENT_STATUS.Active} {...a11yProps(0)} />
                  <Tab label={PULL_PAYMENT_STATUS.Expired} {...a11yProps(1)} />
                  <Tab label={PULL_PAYMENT_STATUS.Archived} {...a11yProps(2)} />
                  <Tab label={PULL_PAYMENT_STATUS.Future} {...a11yProps(3)} />
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                <PullPaymentDataGrid status={'Active'} />
              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                <PullPaymentDataGrid status={'Expired'} />
              </CustomTabPanel>
              <CustomTabPanel value={value} index={2}>
                <PullPaymentDataGrid status={'Archived'} />
              </CustomTabPanel>
              <CustomTabPanel value={value} index={3}>
                <PullPaymentDataGrid status={'Future'} />
              </CustomTabPanel>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Pullpayments;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
