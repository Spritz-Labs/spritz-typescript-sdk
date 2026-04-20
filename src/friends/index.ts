import type { HttpClient } from "../lib/http";
import type { Friend, FriendRequest, FriendRequestsResponse } from "../types";

export class FriendsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(): Promise<Friend[]> {
        const res = await this.http.get<{ friends: Friend[] }>("/api/friends");
        return res.friends ?? [];
    }

    async getRequests(): Promise<FriendRequestsResponse> {
        return this.http.get<FriendRequestsResponse>("/api/friend-requests");
    }

    async sendRequest(toAddress: string, memo?: string): Promise<FriendRequest> {
        return this.http.post<FriendRequest>("/api/friend-requests", {
            to_address: toAddress,
            memo,
        });
    }

    async acceptRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/accept`);
    }

    async rejectRequest(requestId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/friend-requests/${requestId}/reject`);
    }

    async remove(friendAddress: string): Promise<{ success: boolean }> {
        return this.http.delete("/api/friends", { friendAddress });
    }

    async setNickname(friendAddress: string, nickname: string): Promise<{ success: boolean }> {
        return this.http.patch("/api/friends", { friendAddress, nickname });
    }
}
