// Centralized branding so the email template and the PDF receipt never visually drift apart.
const BRAND_COLOR = process.env.BRAND_COLOR || "#6B3F2A";
const SHOP_NAME = process.env.SHOP_NAME || "Sip and Serve";
const SHIPPING_FEE = Number(process.env.SHIPPING_FEE) || 100;

module.exports = { BRAND_COLOR, SHOP_NAME, SHIPPING_FEE };