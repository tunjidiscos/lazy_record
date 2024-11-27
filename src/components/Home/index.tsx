import MetaTags from 'components/Common/MetaTags';
import HomeSidebar from 'components/Sidebar';
import { useRouter } from 'next/router';
import Dashboard from 'components/Dashboard';
import Settings from 'components/Settings';
import Bitcoin from 'components/Wallets/Bitcoin';
import Lightning from 'components/Wallets/Bitcoin/Lightning';
import PaymentInvoices from 'components/Payments/Invoices/index';
import PaymentInvoiceDetails from 'components/Payments/Invoices/id';
import Reporting from 'components/Payments/Reporting';
import Requests from 'components/Payments/Requests';
import Pullpayments from 'components/Payments/Pullpayments';
import Payouts from 'components/Payments/Payouts';
import Shopify from 'components/Plugins/Shopify';
import Pointofsale from 'components/Plugins/Pointofsale';
import Paybutton from 'components/Plugins/Paybutton';
import Crowdfund from 'components/Plugins/Crowdfund';
import { Alert, Box, IconButton, Snackbar, Stack } from '@mui/material';
import Footer from './Footer';
import Account from 'components/Account';
import Notifications from 'components/Notifications';
import { useEffect, useState } from 'react';
import Login from 'components/Login';
import Register from 'components/Register';
import CreateStore from 'components/Stores/Create';
import CreateWallet from 'components/Wallet/Create';
import WalletImport from 'components/Wallet/Import';
import GenerateWallet from 'components/Wallet/Generate';
import SetPassword from 'components/Wallet/SetPassword';
import PhraseIntro from 'components/Wallet/Phrase/Intro';
import PhraseBackup from 'components/Wallet/Phrase/Backup';
import PhraseBackupConfirm from 'components/Wallet/Phrase/Backup/Confirm';
import { useWalletPresistStore, useSnackPresistStore, useUserPresistStore, useStorePresistStore } from 'lib/store';
import ImportMnemonicPhraseOrPrivateKey from 'components/Wallet/Import/MnemonicPhraseOrPrivateKey';
import Ethereum from 'components/Wallets/Ethereum';
import Litecoin from 'components/Wallets/Litecoin';
import Solana from 'components/Wallets/Solana';
import Ton from 'components/Wallets/Ton';
import Tron from 'components/Wallets/Tron';
import Bsc from 'components/Wallets/Bsc';
import BitcoinSend from 'components/Wallets/Bitcoin/Send';
import BitcoinReceive from 'components/Wallets/Bitcoin/Receive';
import ControlCameraIcon from '@mui/icons-material/ControlCamera';
// import Invoices from 'components/Invoices/index';
import InvoicesDetails from 'components/Invoices/id';
import BlockScan from 'components/Wallets/BlockScan';
import EthereumSend from 'components/Wallets/Ethereum/Send';
import EthereumReceive from 'components/Wallets/Ethereum/Receive';
import SolanaSend from 'components/Wallets/Solana/Send';
import SolanaReceive from 'components/Wallets/Solana/Receive';
import BscSend from 'components/Wallets/Bsc/Send';
import BscReceive from 'components/Wallets/Bsc/Receive';
import PaymentTransactions from 'components/Payments/Transactions';

const Home = () => {
  const router = useRouter();

  const { snackOpen, snackMessage, snackSeverity, setSnackOpen } = useSnackPresistStore((state) => state);
  const { getIsLogin, resetUser, getNetwork, setShowSidebar, getShowSidebar } = useUserPresistStore((state) => state);
  const { getIsWallet, resetWallet } = useWalletPresistStore((state) => state);
  const { resetStore, getIsStore } = useStorePresistStore((state) => state);

  const [isLogin, setLogin] = useState<boolean>(false);
  const [isStore, setStore] = useState<boolean>(false);
  const [isWallet, setWallet] = useState<boolean>(false);

  const unLoginWhiteList: any = {
    '/login': <Login />,
    '/register': <Register />,
  };

  const storeCreationWhiteList: any = {
    '/stores/create': <CreateStore />,
  };

  const walletCreationWhiteList: any = {
    '/wallet/create': <CreateWallet />,
    '/wallet/import': <WalletImport />,
    '/wallet/import/mnemonicphrase': <ImportMnemonicPhraseOrPrivateKey />,
    '/wallet/generate': <GenerateWallet />,
    '/wallet/setPassword': <SetPassword />,
    '/wallet/phrase/intro': <PhraseIntro />,
    '/wallet/phrase/backup': <PhraseBackup />,
    '/wallet/phrase/backup/confirm': <PhraseBackupConfirm />,
  };

  const otherWhiteList: any = {
    '/wallets/bitcoin/send': <BitcoinSend />,
    '/wallets/bitcoin/receive': <BitcoinReceive />,
    '/wallets/ethereum/send': <EthereumSend />,
    '/wallets/ethereum/receive': <EthereumReceive />,
    '/wallets/solana/send': <SolanaSend />,
    '/wallets/solana/receive': <SolanaReceive />,
    '/wallets/bsc/send': <BscSend />,
    '/wallets/bsc/receive': <BscReceive />,
    '/invoices/[id]': <InvoicesDetails />,
  };

  const dashboardWhiteList: any = {
    '/': <Dashboard />,
    '/dashboard': <Dashboard />,
    '/settings': <Settings />,
    '/wallets/bitcoin': <Bitcoin />,
    '/wallets/bitcoin/send': <BitcoinSend />,
    '/wallets/bitcoin/receive': <BitcoinReceive />,
    '/wallets/bitcoin/lightning': <Lightning />,
    '/wallets/ethereum': <Ethereum />,
    '/wallets/ethereum/send': <EthereumSend />,
    '/wallets/ethereum/receive': <EthereumReceive />,
    '/wallets/litecoin': <Litecoin />,
    '/wallets/solana': <Solana />,
    '/wallets/solana/send': <SolanaSend />,
    '/wallets/solana/receive': <SolanaReceive />,
    '/wallets/bsc/send': <BscSend />,
    '/wallets/bsc/receive': <BscReceive />,
    '/wallets/ton': <Ton />,
    '/wallets/tron': <Tron />,
    '/wallets/bsc': <Bsc />,
    '/wallets/blockscan': <BlockScan />,
    '/payments/transactions': <PaymentTransactions />,
    '/payments/invoices': <PaymentInvoices />,
    '/payments/invoices/[id]': <PaymentInvoiceDetails />,
    '/payments/reporting': <Reporting />,
    '/payments/requests': <Requests />,
    '/payments/pullpayments': <Pullpayments />,
    '/payments/payouts': <Payouts />,
    '/plugins/shopify': <Shopify />,
    '/plugins/pointofsale': <Pointofsale />,
    '/plugins/paybutton': <Paybutton />,
    '/plugins/crowdfund': <Crowdfund />,
    '/account': <Account />,
    '/notifications': <Notifications />,

    '/stores/create': <CreateStore />,

    '/wallet/create': <CreateWallet />,
    '/wallet/import': <WalletImport />,
    '/wallet/import/mnemonicphrase': <ImportMnemonicPhraseOrPrivateKey />,
    '/wallet/generate': <GenerateWallet />,
    '/wallet/setPassword': <SetPassword />,
    '/wallet/phrase/intro': <PhraseIntro />,
    '/wallet/phrase/backup': <PhraseBackup />,
    '/wallet/phrase/backup/confirm': <PhraseBackupConfirm />,

    '/invoices/[id]': <InvoicesDetails />,
  };

  useEffect(() => {
    const checkState = async () => {
      const loginStatus = getIsLogin();
      const storeStatus = getIsStore();
      const walletStatus = getIsWallet();

      setLogin(loginStatus);
      setStore(storeStatus);
      setWallet(walletStatus);

      if (!loginStatus) {
        if (unLoginWhiteList[router.pathname]) {
          return;
        } else {
          window.location.href = '/login';
        }
      } else if (!storeStatus) {
        if (storeCreationWhiteList[router.pathname]) {
          return;
        } else {
          window.location.href = '/stores/create';
        }
      } else if (!walletStatus) {
        if (walletCreationWhiteList[router.pathname]) {
          return;
        } else {
          window.location.href = '/wallet/create';
        }
      } else {
        if (router.pathname === '/') {
          window.location.href = '/dashboard';
        } else if (!dashboardWhiteList[router.pathname]) {
          window.location.href = '/';
        }
      }
    };

    checkState();
  }, [router.pathname, getIsLogin, getIsStore, getIsWallet]);

  return (
    <Box height={'100%'}>
      <MetaTags title="Home" />

      {isLogin && (
        <Stack direction={'row'} height={'100%'}>
          {storeCreationWhiteList[router.pathname] ||
          walletCreationWhiteList[router.pathname] ||
          otherWhiteList[router.pathname] ? null : getShowSidebar() ? (
            <HomeSidebar />
          ) : null}

          <Box width={'100%'}>
            {dashboardWhiteList[router.pathname] ? (
              <Box m={2}>
                <IconButton
                  onClick={() => {
                    setShowSidebar(!getShowSidebar());
                  }}
                >
                  <ControlCameraIcon />
                </IconButton>
              </Box>
            ) : null}

            <Box>
              {getNetwork() === 'testnet' && (
                <Box p={2}>
                  <Alert severity="warning">This is a test network. The currency has no value.</Alert>
                </Box>
              )}

              {dashboardWhiteList[router.pathname] || null}
              <Box>
                <Footer />
              </Box>
            </Box>
          </Box>
        </Stack>
      )}

      {!isLogin && (
        <Box width={'100%'}>
          {unLoginWhiteList[router.pathname] || null}
          <Box>
            <Footer />
          </Box>
        </Box>
      )}

      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={snackOpen}>
        <Alert
          onClose={() => {
            setSnackOpen(false);
          }}
          severity={snackSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;
