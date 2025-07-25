'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-media-locations.ts';
import '@/ai/flows/fetch-gst-details.ts';
import '@/ai/flows/manage-company-settings.ts';
import '@/ai/flows/assign-invoice-number.ts';
import '@/ai/flows/recalculate-plan-cost.ts';
import '@/ai/flows/manage-approvals.ts';
import '@/ai/flows/convert-plan-to-campaign.ts';
import '@/ai/flows/generate-campaign-ppt.ts';
import '@/ai/flows/generate-monthly-sales-summary.ts';
import '@/ai/flows/manage-operations.ts';
