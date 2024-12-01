import { Box, Button, Container, Grid, Icon, Stack, Typography } from '@mui/material';
import { Twitter, GitHub, Telegram, Favorite, Article, HelpOutline } from '@mui/icons-material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Link from 'next/link';
const Footer = () => {
  return (
    <>
      <Box pt={20} pb={5}>
        <Container maxWidth={'md'}>
          <Grid container justifyContent={'center'} color={'#8f979e'} gap={4}>
            <Grid item>
              <Link href={'https://github.com/cryptopayserver00/cryptopayserver'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={GitHub} fontSize={'small'} />
                  <Typography pl={1}>Github</Typography>
                </Stack>
              </Link>
            </Grid>
            <Grid item>
              <Link href={'https://github.com/viper-00'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={Twitter} fontSize={'small'} />
                  <Typography pl={1}>X</Typography>
                </Stack>
              </Link>
            </Grid>
            <Grid item>
              <Link href={'https://t.me/cryptopayserver'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={Telegram} fontSize={'small'} />
                  <Typography pl={1}>Telegram</Typography>
                </Stack>
              </Link>
            </Grid>
            <Grid item>
              <Link href={'https://cryptopayserver.gitbook.io/cryptopayserver'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={Favorite} fontSize={'small'} />
                  <Typography pl={1}>Donate</Typography>
                </Stack>
              </Link>
            </Grid>
            <Grid item>
              <Link href={'https://cryptopayserver.gitbook.io/cryptopayserver'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={Article} fontSize={'small'} />
                  <Typography pl={1}>API</Typography>
                </Stack>
              </Link>
            </Grid>
            <Grid item>
              <Link href={'https://cryptopayserver.gitbook.io/cryptopayserver'} target="_blank">
                <Stack direction={'row'} alignItems={'center'}>
                  <Icon component={HelpOutline} fontSize={'small'} />
                  <Typography pl={1}>Docs</Typography>
                </Stack>
              </Link>
            </Grid>
          </Grid>
          <Box color={'#8f979e'} mt={2}>
            <Typography textAlign={'center'}>© CryptoPay Server v1.0.0</Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Footer;
