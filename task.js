import cron from 'node-cron';
import axios from 'axios';
import { IS_DEVELOPMENT } from 'packages/constants';

const baseUrl = IS_DEVELOPMENT ? 'http://127.0.0.1:8888/api/schedule' : 'https://cryptopayserver.xyz/api/schedule';

cron.schedule('*/60 * * * * *', async () => {
  try {
    await axios.get(baseUrl + '/scheduler_order_expired');
  } catch (e) {
    console.error(e);
  }
});

cron.schedule('*/10 * * * * *', async () => {
  try {
    await axios.get(baseUrl + '/scheduler_blockscan');
  } catch (e) {
    console.error(e);
  }
});

cron.schedule('*/60 * * * * *', async () => {
  try {
    await axios.get(baseUrl + '/scheduler_pull_payment_expired');
  } catch (e) {
    console.error(e);
  }
});
