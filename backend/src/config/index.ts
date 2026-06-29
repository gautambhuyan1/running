export const config = {
  port: parseInt(process.env.PORT || "4000"),
  jwtSecret: process.env.JWT_SECRET || "mymove-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_stub",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "stub_secret",
  },
};
