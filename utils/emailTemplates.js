const { BRAND_COLOR, SHOP_NAME, SHIPPING_FEE } = require("./brandConfig");

/**
 * Builds the HTML body for an order confirmation email (sent after checkout).
 * Visually mirrors the attached PDF receipt (same header style, table, and totals)
 * so the emailed receipt and the PDF attachment read as one consistent document.
 *
 * @param {Object} params
 * @param {string} params.customerName
 * @param {number|string} params.orderId
 * @param {string} params.date
 * @param {Array<{name: string, quantity: number, price?: number}>} params.items
 */
const orderConfirmationTemplate = ({ customerName, orderId, date, items = [], receiptUrl }) => {
    let total = 0;

    const itemRows = items.map((i) => {
        const price = Number(i.price) || 0;
        const subtotal = price * (i.quantity || 0);
        total += subtotal;

        return `
            <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;">${i.name}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">₱${price.toFixed(2)}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">₱${subtotal.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    return `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">

            <!-- Header, matches the PDF header -->
            <h1 style="color:${BRAND_COLOR};font-size:24px;margin:0;">${SHOP_NAME}</h1>
            <p style="color:#888888;font-size:11px;margin:2px 0 0;">Order Receipt</p>
            <div style="border-top:2px solid ${BRAND_COLOR};margin:10px 0 20px;"></div>

            <p style="font-size:15px;">Thank you for your order, <strong>${customerName}</strong>!</p>

            <!-- Order info, matches the PDF order-info block -->
            <table style="font-size:13px;margin-bottom:16px;">
                <tr><td style="font-weight:bold;padding:2px 8px 2px 0;">Order #:</td><td>${orderId}</td></tr>
                <tr><td style="font-weight:bold;padding:2px 8px 2px 0;">Date:</td><td>${date}</td></tr>
                <tr><td style="font-weight:bold;padding:2px 8px 2px 0;">Customer:</td><td>${customerName}</td></tr>
            </table>

            <!-- Items table, matches the PDF table columns/order -->
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:13px;">Item</th>
                        <th style="text-align:center;padding:8px;border-bottom:2px solid #333;font-size:13px;">Qty</th>
                        <th style="text-align:right;padding:8px;border-bottom:2px solid #333;font-size:13px;">Price</th>
                        <th style="text-align:right;padding:8px;border-bottom:2px solid #333;font-size:13px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows || `<tr><td colspan="4" style="padding:8px;font-size:13px;">No item details available.</td></tr>`}
                </tbody>
            </table>

            <!-- Subtotal, Shipping Fee, and Total, matches the PDF totals block -->
            <div style="text-align:right;margin-top:14px;font-size:13px;">
                <div style="margin-bottom:4px;">Subtotal: ₱${total.toFixed(2)}</div>
                <div style="margin-bottom:8px;">Shipping Fee: ₱
                ${SHIPPING_FEE.toFixed(2)}</div>
                <div style="font-size:15px;font-weight:bold;color:${BRAND_COLOR};">
                    Total: ₱
                    ${(total + SHIPPING_FEE).toFixed(2)}
                </div>
            </div>

            <p style="margin-top:24px;font-size:13px;color:#666;">
                Your receipt is attached to this email as a PDF for your records${receiptUrl ? `, or you can <a href="${receiptUrl}" style="color:${BRAND_COLOR};" target="_blank">download it here</a>` : ""}.
            </p>
            <p style="margin-top:8px;font-size:13px;color:#666;">
                We'll email you again once your order status changes.
            </p>

            <p style="margin-top:28px;font-size:12px;color:#999999;text-align:center;">
                Thank you for shopping with us!
            </p>
        </div>
    `;
};

/**
 * Builds the HTML body for an order status update email.
 *
 * @param {Object} params
 * @param {string} params.customerName
 * @param {number|string} params.orderId
 * @param {string} params.oldStatus
 * @param {string} params.newStatus
 */
const orderStatusUpdateTemplate = ({ customerName, orderId, oldStatus, newStatus }) => {
    return `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <h1 style="color:${BRAND_COLOR};font-size:22px;margin:0;">${SHOP_NAME}</h1>
            <p style="color:#888888;font-size:11px;margin:2px 0 0;">Order Update</p>
            <div style="border-top:2px solid ${BRAND_COLOR};margin:10px 0 20px;"></div>

            <p style="font-size:14px;">Hi ${customerName},</p>
            <p style="font-size:14px;">
                Your order <strong>#${orderId}</strong> status has changed from
                <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.
            </p>

            <p style="margin-top:24px;font-size:12px;color:#999999;text-align:center;">
                Thanks for shopping with us!
            </p>
        </div>
    `;
};

module.exports = {
    orderConfirmationTemplate,
    orderStatusUpdateTemplate
};