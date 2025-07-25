
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import axios from "axios";

admin.initializeApp();

// Set the API key from Firebase environment configuration
const sendGridApiKey = functions.config().sendgrid.key;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
} else {
  console.error(
    "SendGrid API key not found. Please set it using `firebase functions:config:set sendgrid.key='YOUR_API_KEY'`"
  );
}

// Define the recipient email from environment configuration, with a fallback
const ADMIN_EMAIL = functions.config().email?.admin || "admin@example.com";

export const sendEnquiryNotification = functions.firestore
  .document("mediaEnquiries/{enquiryId}")
  .onCreate(async (snap) => {
    if (!sendGridApiKey) {
      console.log("No SendGrid API key, skipping email.");
      return null;
    }

    const data = snap.data();
    if (!data) {
      console.error("No data in snapshot, cannot send email.");
      return null;
    }

    // 1. Send Email Notification
    const msg = {
      to: ADMIN_EMAIL,
      from: {
        name: "MediaVenue Leads",
        email: "noreply@mediavenue-app.com", // Use a verified sender with your SendGrid account
      },
      subject: `New Media Enquiry from ${data.name}`,
      html: `
        <h1>New Media Enquiry</h1>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <hr>
        <h2>Message:</h2>
        <p>${data.message}</p>
        <hr>
        <p><strong>Enquired About Asset:</strong> ${data.assetLocation || 'N/A'}, ${data.assetCity || 'N/A'}</p>
        <p><strong>Asset ID:</strong> ${data.assetId}</p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log("Enquiry notification email sent successfully to", ADMIN_EMAIL);
    } catch (error) {
      console.error("Error sending email:", error);
      if ((error as any).response) {
        console.error((error as any).response.body);
      }
    }

    // 2. Send WhatsApp Notification (Example)
    // IMPORTANT: Replace 'https://your-bot-provider.com/send' with your actual WhatsApp API provider's endpoint.
    // You will also need to securely store and retrieve any API keys for your WhatsApp provider.
    try {
        const whatsappPayload = {
            to: `+91${data.phone}`, // Assuming an Indian phone number format
            message: `Hi ${data.name}, thanks for enquiring about our media at ${data.assetLocation}. We’ll get back to you soon.`
        };
        
        console.log("Sending WhatsApp notification to:", whatsappPayload.to);
        
        // This is a placeholder and will not work without a real endpoint and auth.
        // await axios.post('https://your-bot-provider.com/send', whatsappPayload);

        console.log("WhatsApp notification logic executed (using placeholder).");

    } catch(error) {
        console.error("Error sending WhatsApp notification:", error);
    }

    return null;
  });


export const onPlanConfirmed = functions.firestore
  .document("plans/{planId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== "confirmed" && after.status === "confirmed") {
      const planId = context.params.planId;
      const db = admin.firestore();

      // Create Sales Order
      const soRef = db.collection("salesEstimates").doc("approvedInvoices")
                      .collection("entries").doc();
      await soRef.set({
        planId,
        customerId: after.customerId,
        employeeId: after.employeeId,
        displayName: after.displayName,
        fromDate: after.startDate,
        toDate: after.endDate,
        status: "approved",
        invoiceAmount: after.costSummary.totalBeforeTax,
        invoiceAmountWithTax: after.costSummary.grandTotal,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create Purchase Order
      const poRef = db.collection("purchaseOrders").doc("generatedPOs")
                      .collection("entries").doc();
      await poRef.set({
        planId,
        customerId: after.customerId,
        employeeId: after.employeeId,
        poStatus: "generated",
        poAmount: after.costSummary.totalBeforeTax,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Auto-generated SO and PO for confirmed plan ${planId}`);
    }
  });
