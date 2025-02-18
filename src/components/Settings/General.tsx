import { AccountCircle, CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  FormControl,
  Icon,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  styled,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore } from 'lib/store';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import Image from 'next/image';
import Link from 'next/link';
import { CURRENCY } from 'packages/constants';

const General = () => {
  const [storeName, setStoreName] = useState<string>('');
  const [storeWebsite, setStoreWebsite] = useState<string>('');
  const [brandColor, setBrandColor] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [customCssUrl, setCustomCssUrl] = useState<string>('');
  const [currency, setCurrency] = useState<string>(CURRENCY[0]);
  const [allowAnyoneCreateInvoice, setAllowAnyoneCreateInvoice] = useState<boolean>(false);
  const [addAdditionalFeeToInvoice, setAddAdditionalFeeToInvoice] = useState<number>(1 || 2 || 3);
  const [invoiceExpiresIfNotPaidFullAmount, setInvoiceExpiresIfNotPaidFullAmount] = useState<number>(0);
  const [invoicePaidLessThanPrecent, setInvoicePaidLessThanPrecent] = useState<number>(0);
  const [minimumExpiraionTimeForRefund, setMinimumExpiraionTimeForRefund] = useState<number>(0);

  const { getStoreId } = useStorePresistStore((state) => state);
  const { getUserId } = useUserPresistStore((state) => state);
  const { setSnackSeverity, setSnackOpen, setSnackMessage } = useSnackPresistStore((state) => state);

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  const init = async () => {
    try {
      const response: any = await axios.get(Http.find_store_by_id, {
        params: {
          id: getStoreId(),
        },
      });

      if (response.result) {
        setStoreName(response.data.name);
        setStoreWebsite(response.data.website);
        setCurrency(response.data.currency);
        setBrandColor(response.data.brand_color);
        setLogoUrl(response.data.logo_url);
        setCustomCssUrl(response.data.custom_css_url);
        setAllowAnyoneCreateInvoice(response.data.allow_anyone_create_invoice === 1 ? true : false);
        setAddAdditionalFeeToInvoice(response.data.add_additional_fee_to_invoice);
        setInvoiceExpiresIfNotPaidFullAmount(response.data.invoice_expires_if_not_paid_full_amount);
        setInvoicePaidLessThanPrecent(response.data.invoice_paid_less_than_precent);
        setMinimumExpiraionTimeForRefund(response.data.minimum_expiraion_time_for_refund);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClickSaveStore = async () => {
    try {
      if (!CURRENCY.includes(currency)) {
        setSnackSeverity('error');
        setSnackMessage('Incorrect currency');
        setSnackOpen(true);
        return;
      }

      const response: any = await axios.put(Http.update_store_by_id, {
        id: getStoreId(),
        brand_color: brandColor ? brandColor : '',
        logo_url: logoUrl ? logoUrl : '',
        custom_css_url: customCssUrl ? customCssUrl : '',
        currency: currency ? currency : '',
        allow_anyone_create_invoice: allowAnyoneCreateInvoice ? 1 : 2,
        add_additional_fee_to_invoice: addAdditionalFeeToInvoice,
        invoice_expires_if_not_paid_full_amount: invoiceExpiresIfNotPaidFullAmount,
        invoice_paid_less_than_precent: invoicePaidLessThanPrecent,
        minimum_expiraion_time_for_refund: minimumExpiraionTimeForRefund,
      });

      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Save successful!');
        setSnackOpen(true);

        await init();
      } else {
        setSnackSeverity('error');
        setSnackMessage('The update failed, please try again later.');
        setSnackOpen(true);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  const onClickArchiveStore = async () => {
    try {
      const response: any = await axios.put(Http.archive_store_by_id, {
        id: getStoreId(),
      });

      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Archive successful!');
        setSnackOpen(true);
      } else {
        setSnackSeverity('error');
        setSnackMessage('The update failed, please try again later.');
        setSnackOpen(true);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  const onClickDeleteStore = async () => {
    try {
      const response: any = await axios.put(Http.delete_store_by_id, {
        id: getStoreId(),
      });

      if (response.result) {
        setSnackSeverity('success');
        setSnackMessage('Delete successful!');
        setSnackOpen(true);
      } else {
        setSnackSeverity('error');
        setSnackMessage('The update failed, please try again later.');
        setSnackOpen(true);
      }
    } catch (e) {
      setSnackSeverity('error');
      setSnackMessage('The network error occurred. Please try again later.');
      setSnackOpen(true);
      console.error(e);
    }
  };

  return (
    <Box>
      <Box>
        <Typography variant="h6">General</Typography>
        <Box mt={4}>
          <Typography>Store ID</Typography>
          <Box mt={1}>
            <TextField fullWidth hiddenLabel value={getStoreId()} size="small" disabled />
          </Box>
        </Box>
        <Box mt={2}>
          <Typography>Store Name</Typography>
          <Box mt={1}>
            <TextField fullWidth hiddenLabel value={storeName} size="small" disabled />
          </Box>
        </Box>
        <Box mt={2}>
          <Typography>Store Website</Typography>
          <Box mt={1}>
            <TextField fullWidth hiddenLabel value={storeWebsite} size="small" disabled />
          </Box>
        </Box>
      </Box>

      <Box mt={6}>
        <Typography variant="h6">Branding</Typography>
        <Box mt={4}>
          <Typography>Brand Color</Typography>
          <Box mt={1}>
            <TextField
              value={brandColor}
              onChange={(e: any) => {
                setBrandColor(e.target.value);
              }}
              hiddenLabel
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle />
                  </InputAdornment>
                ),
              }}
              variant="standard"
            />
          </Box>
        </Box>
        <Box mt={6}>
          <Typography>Logo</Typography>
          <Box mt={1}>
            {logoUrl && (
              <Box mt={4} mb={4}>
                <Image src={logoUrl} alt="logo" width={100} height={100} />
              </Box>
            )}

            <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUpload />}>
              Upload file
              <VisuallyHiddenInput type="file" />
            </Button>
          </Box>
        </Box>
        <Box mt={6}>
          <Typography>Custom CSS</Typography>
          <Box mt={1}>
            {customCssUrl && (
              <Box mt={4} mb={4}>
                <Link href={customCssUrl} target="_blank">
                  {customCssUrl}
                </Link>
              </Box>
            )}

            <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUpload />}>
              Upload file
              <VisuallyHiddenInput type="file" />
            </Button>
          </Box>
          <Typography mt={2}>
            Use this CSS to customize the public/customer-facing pages of this store. (Invoice, Payment Request, Pull
            Payment, etc.)
          </Typography>
        </Box>
      </Box>

      <Box mt={6}>
        <Typography variant="h6">Payment</Typography>
        <Box mt={4}>
          <Typography>Default currency</Typography>
          <Box mt={1}>
            <FormControl sx={{ minWidth: 300 }}>
              <Select
                size={'small'}
                inputProps={{ 'aria-label': 'Without label' }}
                onChange={(e) => {
                  setCurrency(e.target.value);
                }}
                value={currency}
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
          <Stack direction={'row'} alignItems={'center'} mt={4}>
            <Switch
              checked={allowAnyoneCreateInvoice}
              onChange={() => {
                setAllowAnyoneCreateInvoice(!allowAnyoneCreateInvoice);
              }}
            />
            <Typography ml={2} pr={1}>
              Allow anyone to create invoice
            </Typography>
            <Icon component={ReportGmailerrorredIcon} />
          </Stack>

          <Stack direction={'row'} alignItems={'center'} mt={4}>
            <Typography pr={1}>Add additional fee (network fee) to invoice …</Typography>
            <Icon component={ReportGmailerrorredIcon} />
          </Stack>

          <Box mt={1}>
            <FormControl sx={{ minWidth: 500 }}>
              <Select
                size={'small'}
                inputProps={{ 'aria-label': 'Without label' }}
                value={addAdditionalFeeToInvoice}
                onChange={(e: any) => {
                  setAddAdditionalFeeToInvoice(e.target.value);
                }}
              >
                <MenuItem value={1}>Only if the customer makes more than one payment for the invoice</MenuItem>
                <MenuItem value={2}>On every payment</MenuItem>
                <MenuItem value={3}>Never add network fee</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box mt={3}>
            <Stack direction={'row'} alignItems={'center'} mt={4}>
              <Typography pr={1}>Invoice expires if the full amount has not been paid after …</Typography>
              <Icon component={ReportGmailerrorredIcon} />
            </Stack>

            <Box mt={1}>
              <FormControl sx={{ width: '25ch' }} variant="outlined">
                <OutlinedInput
                  size={'small'}
                  type="number"
                  endAdornment={<InputAdornment position="end">minutes</InputAdornment>}
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{
                    'aria-label': 'weight',
                  }}
                  value={invoiceExpiresIfNotPaidFullAmount}
                  onChange={(e: any) => {
                    setInvoiceExpiresIfNotPaidFullAmount(e.target.value);
                  }}
                />
              </FormControl>
            </Box>
          </Box>

          <Box mt={3}>
            <Stack direction={'row'} alignItems={'center'} mt={4}>
              <Typography pr={1}>
                Consider the invoice paid even if the paid amount is ... % less than expected
              </Typography>
              <Icon component={ReportGmailerrorredIcon} />
            </Stack>

            <Box mt={1}>
              <FormControl sx={{ width: '25ch' }} variant="outlined">
                <OutlinedInput
                  size={'small'}
                  endAdornment={<InputAdornment position="end">percent</InputAdornment>}
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{
                    'aria-label': 'weight',
                  }}
                  value={invoicePaidLessThanPrecent}
                  onChange={(e: any) => {
                    setInvoicePaidLessThanPrecent(e.target.value);
                  }}
                />
              </FormControl>
            </Box>
          </Box>

          <Box mt={3}>
            <Stack direction={'row'} alignItems={'center'} mt={4}>
              <Typography pr={1}>Minimum acceptable expiration time for BOLT11 for refunds</Typography>
              <Icon component={ReportGmailerrorredIcon} />
            </Stack>

            <Box mt={1}>
              <FormControl sx={{ width: '25ch' }} variant="outlined">
                <OutlinedInput
                  size={'small'}
                  type="number"
                  endAdornment={<InputAdornment position="end">days</InputAdornment>}
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{
                    'aria-label': 'weight',
                  }}
                  value={minimumExpiraionTimeForRefund}
                  onChange={(e: any) => {
                    setMinimumExpiraionTimeForRefund(e.target.value);
                  }}
                />
              </FormControl>
            </Box>
          </Box>
          <Box mt={4}>
            <Button variant="contained" size="large" onClick={onClickSaveStore}>
              Save
            </Button>
          </Box>
        </Box>
      </Box>

      <Box mt={6}>
        <Typography variant="h6">Additional Actions</Typography>
        <Stack mt={2} direction={'row'} columnGap={3}>
          <Button variant="contained" onClick={onClickArchiveStore}>
            Archive this store
          </Button>

          <Button variant="contained" onClick={onClickDeleteStore}>
            Delete this store
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default General;
