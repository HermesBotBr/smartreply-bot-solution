
// JavaScript version of the VAPID keys for use in API routes
// These must match the keys in src/config/vapid-keys.ts

const VAPID_KEYS = {
  publicKey: 'BG8J-PHbRd2rvyen2PBFpSRu4X-NgGWxTu-l1B2ihuL1FFezmKZsaXizsWC69liXaRTnYXtkjHXFDlC4A8h0FwI',
  privateKey: 'Rcy3ZpFjpm5CpVaNfgjf7zE_HfrXFChj8M6Pxkk7aRs'
};

// Export as ES modules only since package.json has "type": "module"
export { VAPID_KEYS };
export const PUBLIC_VAPID_KEY = VAPID_KEYS.publicKey;
export default VAPID_KEYS;
