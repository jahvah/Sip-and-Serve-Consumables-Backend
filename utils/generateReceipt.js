const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const {
    BRAND_COLOR,
    SHOP_NAME,
    SHIPPING_FEE
} = require("./brandConfig");


/**
 * Generates a branded PDF receipt for an order.
 */
const generateReceiptPDF = ({
    orderId,
    customerName,
    customerEmail,
    date,
    items = []
}) => {

    return new Promise((resolve, reject)=>{


        try {


            const doc = new PDFDocument({
                margin:50
            });


            const chunks = [];


            doc.on("data",(chunk)=>{
                chunks.push(chunk);
            });


            doc.on("error",reject);



            const receiptsDir = path.join(
                __dirname,
                "..",
                "uploads",
                "receipts"
            );


            if(!fs.existsSync(receiptsDir)){

                fs.mkdirSync(
                    receiptsDir,
                    {
                        recursive:true
                    }
                );

            }



            const fileName =
                `receipt-order-${orderId}.pdf`;


            const filePath =
                path.join(
                    receiptsDir,
                    fileName
                );



            const fileStream =
                fs.createWriteStream(filePath);



            doc.pipe(fileStream);





            /*
            ==================================
                HEADER
            ==================================
            */


            doc
            .fillColor(BRAND_COLOR)
            .font("Helvetica-Bold")
            .fontSize(26)
            .text(
                SHOP_NAME,
                {
                    align:"left"
                }
            );


            doc
            .moveDown(.2)
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#6B7280")
            .text(
                "Order Receipt"
            );



            doc
            .moveTo(50,doc.y + 12)
            .lineTo(550,doc.y + 12)
            .strokeColor(BRAND_COLOR)
            .lineWidth(2)
            .stroke();



            doc.moveDown(1.8);






            /*
            ==================================
                CUSTOMER DETAILS
            ==================================
            */


            doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor("#1F2937")
            .text("Order Information");


            doc.moveDown(.5);



            doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#4B5563");


            doc.text(
                `Order #: ${orderId}`
            );


            doc.text(
                `Date: ${date}`
            );


            doc.text(
                `Customer: ${customerName}`
            );



            if(customerEmail){

                doc.text(
                    `Email: ${customerEmail}`
                );

            }




            doc.moveDown(1.5);







            /*
            ==================================
                ITEMS TABLE
            ==================================
            */


            const tableTop = doc.y;


            const col = {

                item:50,
                qty:300,
                price:370,
                subtotal:460

            };



            doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#1F2937");



            doc.text(
                "Item",
                col.item,
                tableTop
            );


            doc.text(
                "Qty",
                col.qty,
                tableTop
            );


            doc.text(
                "Price",
                col.price,
                tableTop
            );


            doc.text(
                "Subtotal",
                col.subtotal,
                tableTop
            );




            doc
            .moveTo(50,tableTop+18)
            .lineTo(550,tableTop+18)
            .strokeColor("#D1D5DB")
            .lineWidth(1)
            .stroke();





            let y =
                tableTop + 30;


            let total = 0;



            doc
            .font("Helvetica")
            .fontSize(10);





            items.forEach((i)=>{


                const price =
                    Number(i.price) || 0;


                const subtotal =
                    price * (i.quantity || 0);



                total += subtotal;



                doc
                .fillColor("#4B5563");



                doc.text(
                    i.name,
                    col.item,
                    y,
                    {
                        width:230
                    }
                );


                doc.text(
                    String(i.quantity),
                    col.qty,
                    y
                );


                doc.text(
                    `PHP ${price.toFixed(2)}`,
                    col.price,
                    y
                );


                doc.text(
                    `PHP ${subtotal.toFixed(2)}`,
                    col.subtotal,
                    y
                );



                y += 22;


            });







            doc
            .moveTo(
                50,
                y+5
            )
            .lineTo(
                550,
                y+5
            )
            .strokeColor("#D1D5DB")
            .stroke();







            /*
            ==================================
                TOTAL SECTION
            ==================================
            */


            const subtotal =
                total;


            const finalTotal =
                total + SHIPPING_FEE;



            y += 20;



            doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#4B5563");



            doc.text(
                `Subtotal:`,
                350,
                y
            );


            doc.text(
                `PHP ${subtotal.toFixed(2)}`,
                460,
                y
            );



            doc.text(
                `Shipping Fee:`,
                350,
                y+20
            );


            doc.text(
                `PHP ${SHIPPING_FEE.toFixed(2)}`,
                460,
                y+20
            );





            doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .fillColor(BRAND_COLOR)
            .text(
                `Total: PHP ${finalTotal.toFixed(2)}`,
                350,
                y+50
            );









            /*
            ==================================
                FOOTER
            ==================================
            */


            doc.moveDown(5);


            doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#9CA3AF")
            .text(
                "Thank you for shopping with SipAndServe!",
                50,
                doc.y,
                {
                    align:"center",
                    width:500
                }
            );



            doc.end();





            fileStream.on(
                "finish",
                ()=>{


                    resolve({

                        buffer:
                            Buffer.concat(chunks),

                        filePath,

                        fileName

                    });


                }
            );



            fileStream.on(
                "error",
                reject
            );




        }
        catch(err){

            reject(err);

        }



    });

};



module.exports = {
    generateReceiptPDF
};