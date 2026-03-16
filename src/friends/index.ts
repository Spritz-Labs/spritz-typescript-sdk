import type { HttpClient } from "../lib/http";
import type { Friend, FriendRequest, FriendRequestsResponse } from "../types";

export class FriendsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * List the authenticated user's friends.
     */
    async list(): Promise<{ friends: Friend[] }> {
        return this.http.get("/api/friends");
    }

    /**
     * List incoming and/or outgoing friend requests.
     * @param type - "incoming" | "outgoing" | "all" (default "all")
     */
    async listRequests(type: "incoming" | "outgoing" | "all" = "all"): Promise<FriendRequestsResponse> {
        return this.http.get("/api/friend-requests", { type });
    }

    /**
     * Send a friend request to an address.
     */
    async sendRequest(toAddress: string, memo?: string): Promise<{ request: FriendRequest }> {
        return this.http.post("/api/friend-requests", { toAddress, memo });
    }

    /**
     * Accept an incoming friend request by id.
     */
    async acceptRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/accept`);
    }

    /**
     * Reject an incoming friend request by id.
     */
    async rejectRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/reject`);
    }

    /**
     * Cancel an outgoing friend request by id.
     */
    async cancelRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/friend-requests/${requestId}`);
    }

    /**
     * Remove a friend by friend record id.
     */
    async removeFriend(friendId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/friends/${friendId}`);
    }

    /**
     * Update a friend's nickname by friend record id.
     */
    async updateNickname(friendId: string, nickname: string): Promise<{ success: boolean }> {
        return this.http.patch(`/api/friends/${friendId}`, { nickname });
    }
}
