
// JavaScript version of the VAPID keys for use in API routes
// These must match the keys in src/config/vapid-keys.ts

const VAPID_KEYS = {
  publicKey: 'BKn2JKQCh-yQod3HLXVIAKvjmrgPLGexdNGSv9SNXM4HbWbu6J7pg1Z0pvdvQn2YZQeWx-AYDnAkGL2rFE8fnpM',
  privateKey: 'C_Af9nEg6Gjlwp14KHEI8ftl8FcjpWA4HZF5GMFMr5w'
};

// Export as ES modules only since package.json has "type": "module"
export { VAPID_KEYS };
export const PUBLIC_VAPID_KEY = VAPID_KEYS.publicKey;
export default VAPID_KEYS;
