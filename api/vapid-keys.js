
// JavaScript version of the VAPID keys for use in API routes
// These must match the keys in src/config/vapid-keys.ts

const VAPID_KEYS = {
  publicKey: 'BPdifDqItbFmUtgI1PjwhcwjQUKXUZDFYFX95rBC9K6_NlAjMkhoVbKd2Ivm8f5rHUYFfMC4tvxaMtbovaTJr6A',
  privateKey: 'C_Af9nEg6Gjlwp14KHEI8ftl8FcjpWA4HZF5GMFMr5w'
};

// Export as CommonJS for Node.js API routes
module.exports = {
  VAPID_KEYS,
  PUBLIC_VAPID_KEY: VAPID_KEYS.publicKey
};
