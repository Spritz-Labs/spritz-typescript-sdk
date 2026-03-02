import type { HttpClient } from "../lib/http";
import type {
    UserProfile,
    Social,
    ProfileWidget,
    ProfileTheme,
    UpdateProfileData,
} from "../types";

export class AccountModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Get a user's public profile by wallet address.
     * If no address is provided, returns the authenticated user's profile.
     */
    async getProfile(address?: string): Promise<UserProfile> {
        if (address) {
            return this.http.get<UserProfile>(`/api/public/user/${address}`);
        }
        const session = await this.http.get<{ userAddress: string }>("/api/auth/session");
        return this.http.get<UserProfile>(`/api/public/user/${session.userAddress}`);
    }

    /**
     * Update the authenticated user's profile fields.
     */
    async updateProfile(data: UpdateProfileData): Promise<{ success: boolean }> {
        return this.http.patch("/api/user/profile", data);
    }

    // ── Profile Widgets ──

    /**
     * Get profile widgets for a given address, or the authenticated user.
     */
    async getWidgets(address?: string): Promise<{ widgets: ProfileWidget[] }> {
        const params: Record<string, string> = {};
        if (address) params.address = address;
        return this.http.get("/api/profile/widgets", params);
    }

    /**
     * Add a widget to the authenticated user's profile.
     */
    async addWidget(widget: Omit<ProfileWidget, "id">): Promise<{ widget: ProfileWidget }> {
        return this.http.post("/api/profile/widgets", widget);
    }

    /**
     * Bulk update widget positions, visibility, and config.
     */
    async updateWidgets(
        widgets: Array<Pick<ProfileWidget, "id"> & Partial<ProfileWidget>>
    ): Promise<{ success: boolean }> {
        return this.http.put("/api/profile/widgets", { widgets });
    }

    /**
     * Delete a profile widget by ID.
     */
    async deleteWidget(id: string): Promise<{ success: boolean }> {
        return this.http.delete("/api/profile/widgets", { id });
    }

    // ── Socials (via profile widgets) ──

    /**
     * Set social links. Replaces existing social_link widgets with the provided list.
     * Each social becomes a profile widget of type "social_link".
     */
    async setSocials(socials: Social[]): Promise<{ success: boolean }> {
        const { widgets: existing } = await this.getWidgets();
        const socialWidgets = existing.filter((w) => w.type === "social_link");

        for (const widget of socialWidgets) {
            if (widget.id) {
                await this.deleteWidget(widget.id);
            }
        }

        const startPosition = existing.filter((w) => w.type !== "social_link").length;

        for (let i = 0; i < socials.length; i++) {
            const social = socials[i];
            await this.addWidget({
                type: "social_link",
                position: startPosition + i,
                is_visible: true,
                config: {
                    platform: social.platform,
                    handle: social.handle,
                    url: social.url || "",
                },
            });
        }

        return { success: true };
    }

    /**
     * Get the current social links for a user.
     */
    async getSocials(address?: string): Promise<Social[]> {
        const { widgets } = await this.getWidgets(address);
        return widgets
            .filter((w) => w.type === "social_link" && w.config)
            .map((w) => ({
                platform: (w.config?.platform as string) || "",
                handle: (w.config?.handle as string) || "",
                url: (w.config?.url as string) || undefined,
            }));
    }

    // ── Theme ──

    /**
     * Get profile theme for a given address, or the authenticated user.
     */
    async getTheme(address?: string): Promise<ProfileTheme> {
        const params: Record<string, string> = {};
        if (address) params.address = address;
        return this.http.get("/api/profile/theme", params);
    }

    /**
     * Set the authenticated user's profile theme.
     */
    async setTheme(theme: ProfileTheme): Promise<{ success: boolean }> {
        return this.http.post("/api/profile/theme", theme);
    }
}
