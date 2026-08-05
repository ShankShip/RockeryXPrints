// src/utils/email.service.js
// Dedicated service for sending transactional emails via Brevo REST API

/**
 * Core function to dispatch email via Brevo API using native fetch
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.toName] - Recipient name
 * @param {string} options.subject - Email subject line
 * @param {string} options.htmlContent - HTML string content of the email
 * @returns {Promise<boolean>} Whether the email dispatch succeeded
 */
export async function sendEmail({ to, toName, subject, htmlContent }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@rockeryxprints.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'RockeryXPrints';

    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
        console.warn(`[Email Service] BREVO_API_KEY not configured or placeholder in .env. Skipping email dispatch to ${to}. Subject: "${subject}"`);
        // Return true in development so backend flow does not get blocked when testing without credentials
        return false;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: [
                    {
                        email: to,
                        name: toName || to
                    }
                ],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Email Service] Failed to send email via Brevo:', response.status, errorData);
            return false;
        }

        console.log(`[Email Service] Email successfully sent to ${to} (Subject: "${subject}")`);
        return true;
    } catch (error) {
        console.error('[Email Service] Exception during Brevo email API call:', error);
        return false;
    }
}

/**
 * Sends a brutalist-inspired 6-digit OTP verification email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - User's full name
 * @param {string} params.otp - The 6-digit OTP code
 */
export async function sendOtpEmail({ to, name, otp }) {
    const subject = `Verify Your Email Address — RockeryXPrints`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Courier New', Courier, monospace, sans-serif; color: #000000;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; padding: 0;">
        <!-- Header -->
        <div style="background-color: #000000; color: #ffffff; padding: 24px; text-align: left;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">ROCKERYXPRINTS</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3;">// EMAIL VERIFICATION REQUIRED</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; text-transform: uppercase;">HEY ${name ? name.toUpperCase() : 'BUYER'},</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #333333;">
            BEFORE YOU CAN COMPLETE YOUR ORDER, WE NEED TO VERIFY YOUR EMAIL ADDRESS. PLEASE ENTER THE 6-DIGIT VERIFICATION CODE BELOW IN THE CHECKOUT PROMPT:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #000000; color: #ffffff; padding: 20px; text-align: center; margin: 28px 0; border: 2px solid #000000;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase;">
            ⚠ THIS CODE EXPIRES IN 15 MINUTES.
          </p>
          <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">
            IF YOU DID NOT ATTEMPT TO PLACE AN ORDER ON ROCKERYXPRINTS, YOU CAN SAFELY IGNORE THIS MESSAGE.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 4px solid #000000; padding: 16px 24px; background-color: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">
          &copy; ${new Date().getFullYear()} ROCKERYXPRINTS. ALL RIGHTS RESERVED.
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to, toName: name, subject, htmlContent });
}

/**
 * Sends a 6-digit OTP verification email for authorizing password modification
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - User's full name
 * @param {string} params.otp - The 6-digit OTP code
 */
export async function sendPasswordChangeOtpEmail({ to, name, otp }) {
    const subject = `Authorize Password Change — RockeryXPrints`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Courier New', Courier, monospace, sans-serif; color: #000000;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; padding: 0;">
        <!-- Header -->
        <div style="background-color: #000000; color: #ffffff; padding: 24px; text-align: left;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">ROCKERYXPRINTS</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3;">// PASSWORD CHANGE AUTHORIZATION</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; text-transform: uppercase;">HEY ${name ? name.toUpperCase() : 'USER'},</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #333333;">
            A REQUEST HAS BEEN MADE TO CHANGE YOUR ACCESS KEY/PASSWORD. ENTER THE 6-DIGIT AUTHORIZATION CODE BELOW IN THE VERIFICATION PROMPT:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #000000; color: #ffffff; padding: 20px; text-align: center; margin: 28px 0; border: 2px solid #000000;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase;">
            ⚠ THIS CODE EXPIRES IN 15 MINUTES.
          </p>
          <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">
            IF YOU DID NOT REQUEST TO CHANGE YOUR PASSWORD ON ROCKERYXPRINTS, YOUR ACCOUNT MAY BE COMPROMISED. DO NOT SHARE THIS CODE WITH ANYONE.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 4px solid #000000; padding: 16px 24px; background-color: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">
          &copy; ${new Date().getFullYear()} ROCKERYXPRINTS. ALL RIGHTS RESERVED.
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to, toName: name, subject, htmlContent });
}

/**
 * Sends an immediate order confirmation receipt email
 * @param {Object} params
 * @param {Object} params.order - The mongoose order document
 * @param {Object} params.user - The associated user object (or req.user)
 */
export async function sendOrderConfirmationEmail({ order, user }) {
    const to = user.email;
    const toName = user.fullName;
    const subject = `Order Confirmed [${order.orderId}] — RockeryXPrints`;

    const itemsHtml = (order.orderItems || []).map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 2px solid #000000; font-weight: bold; text-transform: uppercase;">
          ${item.name} <span style="color: #666666; font-weight: normal;">×${item.quantity}</span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 2px solid #000000; text-align: right; font-weight: bold;">
          ₹${((item.priceAtPurchase || 0) * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Courier New', Courier, monospace, sans-serif; color: #000000;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; padding: 0;">
        <!-- Header -->
        <div style="background-color: #000000; color: #ffffff; padding: 24px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">ORDER CONFIRMED</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #10b981;">// THANK YOU FOR YOUR PURCHASE!</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; text-transform: uppercase;">HEY ${toName ? toName.toUpperCase() : 'BUYER'},</p>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #333333;">
            YOUR ORDER HAS BEEN RECEIVED AND IS BEING PROCESSED. BELOW IS YOUR OFFICIAL RECEIPT:
          </p>

          <div style="border: 2px solid #000000; padding: 12px 16px; background-color: #f8fafc; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">
              ORDER ID: <span style="color: #2563eb;">${order.orderId}</span><br>
              PAYMENT METHOD: ${order.paymentMethod?.toUpperCase()} (${order.paymentStatus})
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #000000; color: #ffffff; text-align: left;">
                <th style="padding: 10px 8px; text-transform: uppercase;">ITEM</th>
                <th style="padding: 10px 8px; text-align: right; text-transform: uppercase;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; text-transform: uppercase;">FINAL AMOUNT PAID / DUE:</td>
                <td style="padding: 12px 8px; text-align: right; font-size: 18px; font-weight: 900;">₹${(order.finalTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div style="border: 2px solid #000000; padding: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #666666; text-transform: uppercase; letter-spacing: 1px;">SHIPPING TO:</p>
            <p style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; line-height: 1.5;">
              ${order.shippingAddress?.street || ''},<br>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} — ${order.shippingAddress?.zipCode || ''}<br>
              ${order.shippingAddress?.country || ''} · PHONE: ${order.shippingAddress?.phone || ''}
            </p>
          </div>
        </div>

        <div style="border-top: 4px solid #000000; padding: 16px 24px; background-color: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">
          &copy; ${new Date().getFullYear()} ROCKERYXPRINTS. SECURED CHECKOUT & FAST SHIPPING.
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to, toName, subject, htmlContent });
}

/**
 * Sends an email notification when an administrator updates the order status
 * @param {Object} params
 * @param {Object} params.order - The updated mongoose order document
 * @param {Object} params.user - The associated user object
 * @param {string} params.newStatus - The newly applied status
 */
export async function sendOrderStatusEmail({ order, user, newStatus }) {
    const to = user.email;
    const toName = user.fullName;
    const subject = `Order Update: ${order.orderId} is now ${newStatus.toUpperCase()} — RockeryXPrints`;

    // Pick dynamic colors based on status for aesthetic accent
    let statusColor = "#2563eb"; // default blue
    if (newStatus === "Delivered") statusColor = "#10b981"; // green
    if (newStatus === "Cancelled") statusColor = "#ef4444"; // red
    if (newStatus === "Shipped" || newStatus === "Out for Delivery") statusColor = "#f59e0b"; // amber

    const itemsSummary = (order.orderItems || []).map(item => `${item.name} (x${item.quantity})`).join(", ");

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Courier New', Courier, monospace, sans-serif; color: #000000;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; padding: 0;">
        <!-- Header -->
        <div style="background-color: #000000; color: #ffffff; padding: 24px;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">ORDER STATUS UPDATE</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">// STATUS: ${newStatus}</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; text-transform: uppercase;">HEY ${toName ? toName.toUpperCase() : 'BUYER'},</p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #333333;">
            THERE HAS BEEN AN UPDATE ON YOUR ORDER <strong style="color: #000;">#${order.orderId}</strong>:
          </p>
          
          <!-- Status Banner -->
          <div style="border: 4px solid #000000; padding: 20px; text-align: center; background-color: #f8fafc; margin-bottom: 28px;">
            <span style="font-size: 12px; font-weight: bold; color: #666666; text-transform: uppercase; display: block; margin-bottom: 6px;">CURRENT ORDER STATUS:</span>
            <span style="font-size: 26px; font-weight: 900; text-transform: uppercase; color: ${statusColor}; letter-spacing: 1px;">${newStatus.toUpperCase()}</span>
          </div>

          <div style="border: 2px solid #000000; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #666666; text-transform: uppercase;">ORDER ITEMS:</p>
            <p style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase;">${itemsSummary}</p>
            <hr style="border: none; border-top: 1px dashed #cccccc; margin: 12px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: 900;">TOTAL AMOUNT: ₹${(order.finalTotal || 0).toLocaleString('en-IN')}</p>
          </div>
          
          <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5; text-transform: uppercase;">
            ${newStatus === 'Delivered' ? 'THANK YOU FOR SHOPPING WITH ROCKERYXPRINTS! WE HOPE YOU LOVE YOUR PRINTS.' : 'WE WILL KEEP YOU INFORMED AS YOUR ORDER PROGRESSES.'}
          </p>
        </div>

        <div style="border-top: 4px solid #000000; padding: 16px 24px; background-color: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666;">
          &copy; ${new Date().getFullYear()} ROCKERYXPRINTS. REAL-TIME ORDER TRACKING.
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to, toName, subject, htmlContent });
}
