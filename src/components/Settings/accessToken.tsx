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

const AccessToken = () => {
  return (
    <Box>
      <Box>
        <Typography variant="h6">Greenfield API Keys</Typography>
        <Typography mt={2}>To generate Greenfield API keys, please click here.</Typography>
      </Box>

      <Box mt={5}>
        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
          <Typography variant="h6">Access Tokens</Typography>
          <Button variant={'contained'}>Create Token</Button>
        </Stack>
        <Typography mt={2}>Authorize a public key to access Bitpay compatible Invoice API.</Typography>
        <Typography mt={3}>No access tokens yet.</Typography>
      </Box>

      <Box mt={5}>
        <Typography variant="h6">Legacy API Keys</Typography>
        <Typography mt={2}>
          Alternatively, you can use the invoice API by including the following HTTP Header in your requests:
        </Typography>
        <Typography mt={2}>Authorization: Basic *API Key*</Typography>

        <Box mt={3}>
          <Typography>API Key</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={2} mt={1}>
            <TextField fullWidth hiddenLabel defaultValue="" size="small" />
            <Button>Generate</Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default AccessToken;
