
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

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
      return null;
    } catch (error) {
      console.error("Error sending email:", error);
      // For detailed error reporting with SendGrid
      if ((error as any).response) {
        console.error((error as any).response.body);
      }
      return null;
    }
  });
