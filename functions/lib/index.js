"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.sendEnquiryNotification = functions.firestore
    .document("mediaEnquiries/{enquiryId}")
    .onCreate(async (snap) => {
    // This is where you could add logic to send an email,
    // a WhatsApp message, or trigger another workflow.
    const enquiry = snap.data();
    console.log("New enquiry received:", snap.id, enquiry);
    // Example: Log to Firestore for admin review
    const logRef = admin.firestore().collection("internal_logs").doc();
    await logRef.set({
        message: `New enquiry from ${enquiry.name} for asset ${enquiry.assetId}`,
        data: enquiry,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return null;
});
exports.onPlanConfirmed = functions.firestore
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
//# sourceMappingURL=index.js.map