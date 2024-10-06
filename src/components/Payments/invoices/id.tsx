import { Box, Button, Container, Divider, Grid, List, ListItem, Stack, Typography } from '@mui/material';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore } from 'lib/store';
import { useRouter } from 'next/router';
import { ORDER_STATUS } from 'packages/constants';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';
import { InvoiceEventDataTab } from '../Invoice/invoiceEventDataTab';
import { GetBlockchainAddressUrlByChainIds, GetBlockchainTxUrlByChainIds } from 'utils/web3';
import Link from 'next/link';

type OrderType = {
  orderId: number;
  amount: number;
  buyerEmail: string;
  crypto: string;
  currency: string;
  description: string;
  destinationAddress: string;
  metadata: string;
  notificationEmail: string;
  notificationUrl: string;
  orderStatus: string;
  paid: number;
  paymentMethod: string;
  createdDate: number;
  expirationDate: number;
  rate: number;
  totalPrice: string;
  amountDue: string;
  fromAddress: string;
  toAddress: string;
  hash: string;
  blockTimestamp: number;
  network: number;
  chainId: number;
};

const PaymentInvoiceDetails = () => {
  const router = useRouter();
  const { id } = router.query;

  const { getStoreName } = useStorePresistStore((state) => state);
  const { setSnackSeverity, setSnackMessage, setSnackOpen } = useSnackPresistStore((state) => state);

  const [order, setOrder] = useState<OrderType>({
    orderId: 0,
    amount: 0,
    buyerEmail: '',
    crypto: '',
    currency: '',
    description: '',
    destinationAddress: '',
    metadata: '',
    notificationEmail: '',
    notificationUrl: '',
    orderStatus: '',
    paid: 0,
    paymentMethod: '',
    createdDate: 0,
    expirationDate: 0,
    rate: 0,
    totalPrice: '0',
    amountDue: '0',
    fromAddress: '',
    toAddress: '',
    hash: '',
    blockTimestamp: 0,
    network: 0,
    chainId: 0,
  });

  const init = async (id: any) => {
    try {
      const invoice_resp: any = await axios.get(Http.find_invoice_by_id, {
        params: {
          id: id,
        },
      });

      if (invoice_resp.result && invoice_resp.data.length === 1) {
        setOrder({
          orderId: invoice_resp.data[0].order_id,
          amount: invoice_resp.data[0].amount,
          buyerEmail: invoice_resp.data[0].buyer_email,
          crypto: invoice_resp.data[0].crypto,
          currency: invoice_resp.data[0].currency,
          description: invoice_resp.data[0].description,
          destinationAddress: invoice_resp.data[0].destination_address,
          metadata: invoice_resp.data[0].metadata,
          notificationEmail: invoice_resp.data[0].notification_email,
          notificationUrl: invoice_resp.data[0].notification_url,
          orderStatus: invoice_resp.data[0].order_status,
          paid: invoice_resp.data[0].paid,
          paymentMethod: invoice_resp.data[0].payment_method,
          createdDate: invoice_resp.data[0].created_date,
          expirationDate: invoice_resp.data[0].expiration_date,
          rate: invoice_resp.data[0].rate,
          totalPrice: invoice_resp.data[0].crypto_amount,
          amountDue: invoice_resp.data[0].crypto_amount,
          fromAddress: invoice_resp.data[0].from_address,
          toAddress: invoice_resp.data[0].to_address,
          hash: invoice_resp.data[0].hash,
          blockTimestamp: invoice_resp.data[0].block_timestamp,
          network: invoice_resp.data[0].network,
          chainId: invoice_resp.data[0].chain_id,
        });
      } else {
        setSnackSeverity('error');
        setSnackMessage('Can not find the invoice!');
        setSnackOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    id && init(id);
  }, [id]);

  const onClickArchive = async () => {
    try {
      const resposne: any = await axios.put(Http.update_invoice_order_status_by_order_id, {
        order_id: order.orderId,
        order_status: ORDER_STATUS.Invalid,
      });

      if (resposne.result) {
        setSnackSeverity('success');
        setSnackMessage('Successful update!');
        setSnackOpen(true);

        window.location.reload();
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
        <Stack direction={'row'} alignItems={'center'}>
          <Typography variant={'h5'} fontWeight={'bold'}>
            Invoice
          </Typography>
          <Typography variant={'h5'} fontWeight={'bold'} ml={1}>
            {order.orderId}
          </Typography>
        </Stack>

        <Stack direction={'row'} alignItems={'center'} mt={4}>
          <Button
            variant={'outlined'}
            onClick={() => {
              window.location.href = '/invoices/' + order.orderId;
            }}
          >
            Checkout
          </Button>
          {order.orderStatus !== ORDER_STATUS.Invalid && (
            <Button variant={'outlined'} onClick={onClickArchive} style={{ marginLeft: 20 }}>
              Archive
            </Button>
          )}
        </Stack>

        <Box mt={4}>
          <Typography variant="h5" fontWeight={'bold'}>
            General Information
          </Typography>
          <List style={{ marginTop: 10 }}>
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Store</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{getStoreName()}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Order Id</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.orderId}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>State</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography
                    color={
                      order.orderStatus === ORDER_STATUS.Expired
                        ? 'red'
                        : order.orderStatus === ORDER_STATUS.Settled
                        ? 'green'
                        : order.orderStatus === ORDER_STATUS.Processing
                        ? 'orange'
                        : order.orderStatus === ORDER_STATUS.Invalid
                        ? 'red'
                        : ''
                    }
                  >
                    {order.orderStatus}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Created Date</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{new Date(order.createdDate).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Expiration Date</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{new Date(order.expirationDate).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Total Amount Due</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>
                    {order.amount} {order.currency}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Refund Email</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.buyerEmail}</Typography>
                </Grid>
              </Grid>
            </ListItem>
          </List>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" fontWeight={'bold'}>
            Product Information
          </Typography>

          <List style={{ marginTop: 10 }}>
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Item Description</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.description}</Typography>
                </Grid>
              </Grid>
            </ListItem>
          </List>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" fontWeight={'bold'}>
            Buyer Information
          </Typography>

          <List style={{ marginTop: 10 }}>
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Email</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.buyerEmail}</Typography>
                </Grid>
              </Grid>
            </ListItem>
          </List>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" fontWeight={'bold'}>
            Invoice Summary
          </Typography>

          <List style={{ marginTop: 10 }}>
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Payment method</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.paymentMethod}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Destination</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.destinationAddress}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Rate</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>
                    {order.rate} {order.currency}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Total due</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>
                    {order.amountDue} {order.crypto}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            <ListItem>
              <Grid container>
                <Grid item xs={3}>
                  <Typography>Paid</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>{order.paid === 1 ? 'True' : 'False'}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            <Divider />
            {order.orderStatus === ORDER_STATUS.Settled && (
              <>
                <ListItem>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography>From Address</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Link
                        target="_blank"
                        href={
                          GetBlockchainAddressUrlByChainIds(order.network === 1 ? true : false, order.chainId) +
                          '/' +
                          order.fromAddress
                        }
                      >
                        {order.fromAddress}
                      </Link>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider />
                <ListItem>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography>To Address</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Link
                        target="_blank"
                        href={
                          GetBlockchainAddressUrlByChainIds(order.network === 1 ? true : false, order.chainId) +
                          '/' +
                          order.toAddress
                        }
                      >
                        {order.toAddress}
                      </Link>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider />
                <ListItem>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography>Hash</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Link
                        target="_blank"
                        href={
                          GetBlockchainTxUrlByChainIds(order.network === 1 ? true : false, order.chainId) +
                          '/' +
                          order.hash
                        }
                      >
                        {order.hash}
                      </Link>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider />
                <ListItem>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography>Block Timestamp</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography>{new Date(order.blockTimestamp).toLocaleString()}</Typography>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider />
              </>
            )}
          </List>
        </Box>

        <Box mt={4}>
          <Typography variant="h5" fontWeight={'bold'}>
            Events
          </Typography>

          <Box mt={4}>
            <InvoiceEventDataTab orderId={order.orderId} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PaymentInvoiceDetails;
