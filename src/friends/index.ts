import type { HttpClient } from "../lib/http";
import type { Friend, FriendRequest, FriendRequestsResponse } from "../types";

export class FriendsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * List all friends for the authenticated user.
     */
    async list(): Promise<Friend[]> {
        const res = await this.http.get<{ friends: Friend[] }>("/api/friends");
        return res.friends ?? [];
    }

    /**
     * Get incoming and outgoing friend requests.
     * @param type - Filter by "incoming", "outgoing", or "all" (default).
     */
    async getRequests(type?: "incoming" | "outgoing" | "all"): Promise<FriendRequestsResponse> {
        const params: Record<string, string> = {};
        if (type) params.type = type;
        return this.http.get<FriendRequestsResponse>("/api/friend-requests", params);
    }

    /**
     * Send a friend request to the given address.
     * @param toAddress - Wallet address (EVM or Solana) of the recipient.
     * @param memo - Optional short message (max 100 chars).
     */
    async sendRequest(toAddress: string, memo?: string): Promise<FriendRequest> {
        const body: Record<string, string> = { toAddress };
        if (memo) body.memo = memo;
        const res = await this.http.post<{ request: FriendRequest }>("/api/friend-requests", body);
        return res.request;
    }

    /**
     * Accept a pending friend request by ID.
     */
    async acceptRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/accept`);
    }

    /**
     * Reject a pending friend request by ID.
     */
    async rejectRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/reject`);
    }

    /**
     * Cancel an outgoing friend request by ID.
     */
    async cancelRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/friend-requests/${requestId}`);
    }

    /**
     * Remove a friend by their friend record ID.
     */
    async remove(friendId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/friends/${friendId}`);
    }
}
