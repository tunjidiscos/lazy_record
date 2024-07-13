export const APP_NAME = 'CRYPTOPAYSERVER';
export const APP_DESCRIPTION = 'Free services to help you buy and sell products and collect cryptocurrencies.';
export const ENV = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'development';
export const IS_MAINNET = process.env.NODE_ENV ?? 'testnet';
export const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
export const IS_PRODUCATION = !IS_DEVELOPMENT;

export const STATIC_ASSETS = '';
