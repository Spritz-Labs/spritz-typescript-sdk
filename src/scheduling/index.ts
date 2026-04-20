import type { HttpClient } from "../lib/http";

// ── Types ──

export interface SchedulingSettings {
    scheduling_enabled: boolean;
    scheduling_slug: string | null;
    scheduling_title: string | null;
    scheduling_bio: string | null;
    scheduling_free_enabled: boolean;
    scheduling_paid_enabled: boolean;
    scheduling_free_duration_minutes: number;
    scheduling_paid_duration_minutes: number;
    scheduling_price_cents: number;
    scheduling_network: string | null;
    scheduling_wallet_address: string | null;
    scheduling_duration_minutes: number;
    scheduling_buffer_minutes: number;
    scheduling_advance_notice_hours: number;
    scheduling_calendar_sync: boolean;
}

export interface ScheduledCall {
    id: string;
    scheduler_wallet_address: string | null;
    recipient_wallet_address: string;
    scheduled_at: string;
    duration_minutes: number;
    title: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    is_paid: boolean;
    payment_amount_cents: number | null;
    payment_transaction_hash: string | null;
    payment_status: string | null;
    guest_email: string | null;
    guest_name: string | null;
    scheduler_email: string | null;
    scheduler_name: string | null;
    notes: string | null;
    timezone: string | null;
    invite_token: string;
    invite_sent_at: string | null;
    invite_opened_at: string | null;
    calendar_event_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface AvailabilitySlot {
    start: string;
    end: string;
}

export interface BookCallData {
    recipientAddress: string;
    scheduledAt: string;
    durationMinutes: number;
    title: string;
    timezone: string;
    guestEmail?: string;
    guestName?: string;
    schedulerEmail?: string;
    schedulerName?: string;
    notes?: string;
    isPaid?: boolean;
    paymentTransactionHash?: string;
}

export interface CreateShareableLinkData {
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    timezone: string;
}

/**
 * Priority Sessions fee configuration.
 *
 * The Spritz platform collects a 1% fee on all **paid** Priority Sessions.
 * The fee is calculated on the `payment_amount_cents` and recorded alongside
 * each booking. This is transparent to both host and guest — the host receives
 * 99% and the Spritz treasury receives 1%.
 *
 * For sessions booked on-chain (USDC), the split can be handled either:
 *  a) At the smart-contract level (splitter / escrow contract), or
 *  b) Off-chain with a cron job that sweeps the 1% from the host payout
 *     wallet using an allowance the host grants during scheduling setup.
 *
 * For sessions with off-chain payment verification (x402 / tx hash),
 * the fee is recorded in `platform_fee_cents` on `shout_scheduled_calls`
 * and settled periodically.
 */
export const PLATFORM_FEE_BPS = 100; // 1% = 100 basis points

export function calculatePlatformFee(amountCents: number): {
    feeCents: number;
    hostCents: number;
} {
    const feeCents = Math.ceil((amountCents * PLATFORM_FEE_BPS) / 10_000);
    return { feeCents, hostCents: amountCents - feeCents };
}

// ── Module ──

export class SchedulingModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async getSettings(address?: string): Promise<SchedulingSettings> {
        const params: Record<string, string> = {};
        if (address) params.address = address;
        return this.http.get<SchedulingSettings>("/api/scheduling/settings", params);
    }

    async updateSettings(data: Partial<SchedulingSettings>): Promise<{ success: boolean }> {
        return this.http.post("/api/scheduling/settings", data);
    }

    async getAvailability(
        address: string,
        opts?: { date?: string; timezone?: string },
    ): Promise<{ slots: AvailabilitySlot[] }> {
        const params: Record<string, string> = { address };
        if (opts?.date) params.date = opts.date;
        if (opts?.timezone) params.timezone = opts.timezone;
        return this.http.get("/api/scheduling/availability", params);
    }

    async bookCall(data: BookCallData): Promise<ScheduledCall> {
        let feeInfo: { feeCents: number; hostCents: number } | undefined;
        if (data.isPaid && data.paymentTransactionHash) {
            const settings = await this.getSettings(data.recipientAddress);
            if (settings.scheduling_price_cents > 0) {
                feeInfo = calculatePlatformFee(settings.scheduling_price_cents);
            }
        }

        return this.http.post<ScheduledCall>("/api/scheduling/schedule", {
            ...data,
            platformFeeCents: feeInfo?.feeCents,
        });
    }

    async createShareableLink(data: CreateShareableLinkData): Promise<ScheduledCall> {
        return this.http.post<ScheduledCall>("/api/scheduling/create-shareable", data);
    }

    async list(opts?: { status?: "upcoming" | "past" | string }): Promise<{ calls: ScheduledCall[] }> {
        const params: Record<string, string> = {};
        if (opts?.status) params.status = opts.status;
        return this.http.get("/api/scheduling/list", params);
    }

    async getByToken(inviteToken: string): Promise<ScheduledCall> {
        return this.http.get<ScheduledCall>(`/api/scheduling/join/${inviteToken}`);
    }

    async joinCall(inviteToken: string): Promise<{ joinUrl: string; joinCode: string; roomId: string }> {
        return this.http.post(`/api/scheduling/join/${inviteToken}`);
    }

    async resendInvite(callId: string): Promise<{ success: boolean }> {
        return this.http.post("/api/scheduling/invite", { callId });
    }

    /**
     * Compute the platform fee split for a given price.
     * Useful for displaying the breakdown to the guest before payment.
     */
    calculateFee(amountCents: number) {
        return calculatePlatformFee(amountCents);
    }
}
