'use server';

/**
 * @fileOverview This flow handles operational tasks like mounting and flex stock management.
 *
 * - completeMountingTask - Sets a task's status to 'completed' and updates related inventory.
 * - receiveFlex - Updates the flex stock inventory.
 */

import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './assign-invoice-number'; // Import the shared db instance

// === MOUNTING TASK COMPLETION ===
const CompleteMountingTaskSchema = z.object({
  taskId: z.string().describe("The document ID of the mounting task."),
  inventoryId: z.string().describe("The ID of the related media asset (inventory).")
});

export async function completeMountingTask(input: z.infer<typeof CompleteMountingTaskSchema>): Promise<{ status: string }> {
    const taskRef = db.doc(`operations/mountingTasks/${input.taskId}`);
    const inventoryRef = db.doc(`media_assets/${input.inventoryId}`);
    
    await db.runTransaction(async (transaction) => {
        transaction.update(taskRef, {
            status: 'completed',
            completionTimestamp: FieldValue.serverTimestamp()
        });
        transaction.update(inventoryRef, {
            status: 'active' // Or 'booked', depending on desired status
        });
    });
    
    return { status: 'Mounting task completed' };
}


// === FLEX STOCK MANAGEMENT ===
const ReceiveFlexSchema = z.object({
  iid: z.string().describe("The inventory ID of the flex being received."),
  quantity: z.number().int().positive().describe("The number of units received."),
  waitingForFlexId: z.string().describe("The ID of the record in 'waitingForFlex' to mark as received."),
});

export async function receiveFlex(input: z.infer<typeof ReceiveFlexSchema>): Promise<{ status: string }> {
    const flexStockRef = db.doc(`operations/flexStock/${input.iid}`);
    const waitingRef = db.doc(`operations/waitingForFlex/${input.waitingForFlexId}`);

    await db.runTransaction(async (transaction) => {
        transaction.set(flexStockRef, {
            stock: FieldValue.increment(input.quantity),
            lastReceived: FieldValue.serverTimestamp()
        }, { merge: true });

        transaction.update(waitingRef, {
            status: 'received'
        });
    });

    return { status: 'Flex stock updated' };
}

// Note: These are simple DB operations and don't require being wrapped in a Genkit flow
// unless more complex, multi-step logic is added later.
