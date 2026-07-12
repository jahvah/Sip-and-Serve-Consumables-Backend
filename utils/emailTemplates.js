const { BRAND_COLOR, SHOP_NAME, SHIPPING_FEE } = require("./brandConfig");


const baseStyle = `
    font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
    background:#F6F8F7;
    padding:30px;
    color:#4B5563;
`;

const containerStyle = `
    max-width:620px;
    margin:auto;
    background:#FFFFFF;
    border-radius:18px;
    overflow:hidden;
    box-shadow:0 4px 16px rgba(0,0,0,.05);
`;

const headerStyle = `
    background:${BRAND_COLOR};
    padding:30px;
    color:white;
`;

const contentStyle = `
    padding:30px;
`;



/**
 * Order confirmation email
 */
const orderConfirmationTemplate = ({
    customerName,
    orderId,
    date,
    items = [],
    receiptUrl
}) => {

    let total = 0;


    const itemRows = items.map((i)=>{

        const price = Number(i.price) || 0;

        const subtotal = price * (i.quantity || 0);

        total += subtotal;


        return `
        <tr>

            <td style="
                padding:12px;
                border-bottom:1px solid #E5E7EB;
            ">
                ${i.name}
            </td>


            <td style="
                padding:12px;
                text-align:center;
                border-bottom:1px solid #E5E7EB;
            ">
                ${i.quantity}
            </td>


            <td style="
                padding:12px;
                text-align:right;
                border-bottom:1px solid #E5E7EB;
            ">
                PHP ${price.toFixed(2)}
            </td>


            <td style="
                padding:12px;
                text-align:right;
                border-bottom:1px solid #E5E7EB;
            ">
                PHP ${subtotal.toFixed(2)}
            </td>

        </tr>
        `;

    }).join("");



    return `

<div style="${baseStyle}">

<div style="${containerStyle}">


    <div style="${headerStyle}">

        <h1 style="
            margin:0;
            font-size:26px;
        ">
            ${SHOP_NAME}
        </h1>


        <p style="
            margin:5px 0 0;
            opacity:.9;
        ">
            Order Confirmation
        </p>

    </div>



    <div style="${contentStyle}">


        <h2 style="
            color:#1F2937;
            font-size:22px;
        ">
            Thank you, ${customerName}! ☕
        </h2>



        <p>
            Your order has been successfully placed.
            Here are your order details:
        </p>



        <div style="
            background:#F8FAFC;
            border-radius:12px;
            padding:18px;
            margin:20px 0;
        ">


            <p>
                <strong>Order #:</strong>
                ${orderId}
            </p>


            <p>
                <strong>Date:</strong>
                ${date}
            </p>


            <p>
                <strong>Customer:</strong>
                ${customerName}
            </p>


        </div>





        <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
        ">


            <thead>

                <tr style="
                    background:${BRAND_COLOR};
                    color:white;
                ">


                    <th style="padding:12px;text-align:left;">
                        Item
                    </th>


                    <th style="padding:12px;">
                        Qty
                    </th>


                    <th style="padding:12px;text-align:right;">
                        Price
                    </th>


                    <th style="padding:12px;text-align:right;">
                        Subtotal
                    </th>


                </tr>

            </thead>


            <tbody>

                ${
                    itemRows ||
                    `
                    <tr>
                        <td colspan="4"
                        style="padding:15px;text-align:center;">
                            No items found
                        </td>
                    </tr>
                    `
                }


            </tbody>


        </table>





        <div style="
            margin-top:25px;
            text-align:right;
        ">


            <p>
                Subtotal:
                <strong>
                PHP ${total.toFixed(2)}
                </strong>
            </p>


            <p>
                Shipping Fee:
                <strong>
                PHP ${SHIPPING_FEE.toFixed(2)}
                </strong>
            </p>



            <h2 style="
                color:${BRAND_COLOR};
            ">
                Total:
                PHP ${(total + SHIPPING_FEE).toFixed(2)}
            </h2>


        </div>





        <div style="
            margin-top:30px;
            padding:15px;
            background:#E8F5E9;
            border-radius:12px;
            color:#1B5E20;
        ">


            Your receipt is attached as a PDF.

            ${
                receiptUrl
                ?
                `
                <br><br>

                You can also
                <a href="${receiptUrl}"
                style="
                    color:${BRAND_COLOR};
                    font-weight:bold;
                ">
                view your receipt online
                </a>
                `
                :
                ""
            }


        </div>




        <p style="
            margin-top:30px;
            text-align:center;
            color:#9CA3AF;
            font-size:13px;
        ">
            Thank you for shopping with ${SHOP_NAME}.
        </p>



    </div>


</div>


</div>

`;

};





/**
 * Order status update email
 */
const orderStatusUpdateTemplate = ({
    customerName,
    orderId,
    oldStatus,
    newStatus
})=>{


return `

<div style="${baseStyle}">


<div style="${containerStyle}">


<div style="${headerStyle}">

<h1 style="margin:0;">
${SHOP_NAME}
</h1>

<p>
Order Update
</p>


</div>



<div style="${contentStyle}">


<h2 style="
color:#1F2937;
">
Hello ${customerName}
</h2>



<p>
Your order status has been updated.
</p>



<div style="
background:#F8FAFC;
padding:20px;
border-radius:12px;
">


<p>
Order:
<strong>
#${orderId}
</strong>
</p>


<p>
${oldStatus}
&nbsp;
→
&nbsp;
<strong style="color:${BRAND_COLOR}">
${newStatus}
</strong>
</p>


</div>



<p style="
margin-top:30px;
text-align:center;
color:#999;
">
Thank you for choosing ${SHOP_NAME}.
</p>


</div>


</div>

</div>

`;

};






const emailVerificationTemplate = ({
    verifyUrl
})=>{


return `

<div style="${baseStyle}">


<div style="${containerStyle}">


<div style="${headerStyle}">

<h1>
${SHOP_NAME}
</h1>

<p>
Welcome!
</p>

</div>


<div style="${contentStyle}">


<h2>
Verify your email address
</h2>


<p>
Thank you for creating your account.
Please verify your email before logging in.
</p>



<div style="
text-align:center;
margin:30px 0;
">


<a href="${verifyUrl}"

style="
background:${BRAND_COLOR};
color:white;
padding:14px 28px;
border-radius:999px;
text-decoration:none;
font-weight:bold;
">

Verify Email

</a>


</div>



<p>
If the button does not work, copy this link:
</p>


<p style="
word-break:break-all;
color:${BRAND_COLOR};
">

${verifyUrl}

</p>



</div>


</div>

</div>

`;

};





const passwordResetTemplate = ({
    resetUrl
})=>{


return `

<div style="${baseStyle}">


<div style="${containerStyle}">


<div style="${headerStyle}">

<h1>
${SHOP_NAME}
</h1>

<p>
Password Reset
</p>


</div>



<div style="${contentStyle}">


<h2>
Reset your password
</h2>


<p>
We received a request to reset your SipAndServe password.
</p>



<div style="
text-align:center;
margin:30px 0;
">


<a href="${resetUrl}"

style="
background:${BRAND_COLOR};
color:white;
padding:14px 28px;
border-radius:999px;
text-decoration:none;
font-weight:bold;
">

Reset Password

</a>


</div>



<p>
This link will expire in 1 hour.
</p>



</div>


</div>

</div>

`;

};





module.exports = {

    orderConfirmationTemplate,

    orderStatusUpdateTemplate,

    emailVerificationTemplate,

    passwordResetTemplate

};