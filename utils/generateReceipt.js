const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { BRAND_COLOR, SHOP_NAME, SHIPPING_FEE } = require("./brandConfig");

/**
 * Generates a branded PDF receipt for an order.
 * - Saves a copy to uploads/receipts/receipt-order-<orderId>.pdf
 * - Resolves with a Buffer of the same PDF (for emailing as an attachment)
 *
 * @param {Object} params
 * @param {number|string} params.orderId
 * @param {string} params.customerName
 * @param {string} [params.customerEmail]
 * @param {string|Date} params.date
 * @param {Array<{name: string, quantity: number, price?: number}>} params.items
 * @returns {Promise<{ buffer: Buffer, filePath: string, fileName: string }>}
 */
const generateReceiptPDF = ({ orderId, customerName, customerEmail, date, items = [] }) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("error", reject);

            // Ensure uploads/receipts exists (relative to project root, alongside server.js)
            const receiptsDir = path.join(__dirname, "..", "uploads", "receipts");
            if (!fs.existsSync(receiptsDir)) {
                fs.mkdirSync(receiptsDir, { recursive: true });
            }

            const fileName = `receipt-order-${orderId}.pdf`;
            const filePath = path.join(receiptsDir, fileName);
            const fileStream = fs.createWriteStream(filePath);
            doc.pipe(fileStream);

            // ===== HEADER =====
            doc
                .fillColor(BRAND_COLOR)
                .font("Helvetica-Bold")
                .fontSize(24)
                .text(SHOP_NAME, { align: "left" });

            doc
                .moveDown(0.2)
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#888888")
                .text("Order Receipt", { align: "left" });

            doc
                .moveTo(50, doc.y + 10)
                .lineTo(550, doc.y + 10)
                .strokeColor(BRAND_COLOR)
                .lineWidth(2)
                .stroke();

            doc.moveDown(1.5);

            // ===== ORDER INFO =====
            doc.fillColor("#333333").fontSize(11);

            doc.font("Helvetica-Bold").text("Order #: ", { continued: true })
               .font("Helvetica").text(`${orderId}`);

            doc.font("Helvetica-Bold").text("Date: ", { continued: true })
               .font("Helvetica").text(`${date}`);

            doc.font("Helvetica-Bold").text("Customer: ", { continued: true })
               .font("Helvetica").text(`${customerName}`);

            if (customerEmail) {
                doc.font("Helvetica-Bold").text("Email: ", { continued: true })
                   .font("Helvetica").text(`${customerEmail}`);
            }

            doc.moveDown(1);

            // ===== ITEMS TABLE =====
            const tableTop = doc.y;
            const col = { item: 50, qty: 300, price: 370, subtotal: 460 };

            doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
            doc.text("Item", col.item, tableTop);
            doc.text("Qty", col.qty, tableTop);
            doc.text("Price", col.price, tableTop);
            doc.text("Subtotal", col.subtotal, tableTop);

            doc
                .moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .strokeColor("#cccccc")
                .lineWidth(1)
                .stroke();

            let y = tableTop + 25;
            let total = 0;

            doc.font("Helvetica").fontSize(10);

            items.forEach((i) => {
                const price = Number(i.price) || 0;
                const subtotal = price * (i.quantity || 0);
                total += subtotal;

                doc.fillColor("#333333");
                doc.text(i.name, col.item, y, { width: 240 });
                doc.text(String(i.quantity), col.qty, y);
                doc.text(`PHP ${price.toFixed(2)}`, col.price, y);
                doc.text(`PHP ${subtotal.toFixed(2)}`, col.subtotal, y);

                y += 20;
            });

            doc
                .moveTo(50, y + 5)
                .lineTo(550, y + 5)
                .strokeColor("#cccccc")
                .stroke();

            const subtotalBeforeShipping = total;
            total += SHIPPING_FEE;

            doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#333333")
                .text("Subtotal:", col.price - 20, y + 15)
                .text(`PHP ${subtotalBeforeShipping.toFixed(2)}`, col.subtotal, y + 15);

            doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#333333")
                .text("Shipping Fee:", col.price - 20, y + 33)
                .text(`PHP ${SHIPPING_FEE.toFixed(2)}`, col.subtotal, y + 33);

            doc
                .font("Helvetica-Bold")
                .fontSize(12)
                .fillColor(BRAND_COLOR)
                .text(`Total: PHP ${total.toFixed(2)}`, col.subtotal - 40, y + 55);

            doc.moveDown(6);

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#999999")
                .text("Thank you for shopping with us!", 50, doc.y, { align: "center", width: 500 });

            doc.end();

            fileStream.on("finish", () => {
                resolve({
                    buffer: Buffer.concat(chunks),
                    filePath,
                    fileName
                });
            });

            fileStream.on("error", reject);

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateReceiptPDF };