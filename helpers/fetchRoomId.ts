import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

const ROCKET_CHAT_URL = "http://localhost:3000";
const ADMIN_USER_ID = "EgqsQDfA5zGrYhQYr";
const ADMIN_AUTH_TOKEN = "cHeEYUogNcTmt0lxC6HQNbJyKvInWvJVlfPQQEipoh3";

/**
 * Fetches the roomId of a given channel name.
 * @param http - Rocket.Chat HTTP client
 * @param channelName - Name of the channel
 * @returns The roomId if found, otherwise null
 */

export const fetchRoomId = async (
    http: IHttp,
    channelName: string
): Promise<string | null> => {
    try {
        const response = await http.get(
            `${ROCKET_CHAT_URL}/api/v1/rooms.info?roomName=${channelName}`,
            {
                headers: {
                    "X-Auth-Token": ADMIN_AUTH_TOKEN,
                    "X-User-Id": ADMIN_USER_ID,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.statusCode === 200 && response.data.success) {
            return response.data.room._id; // Return the room object
        } else {
            console.error(
                `⚠️ Failed to fetch roomId for ${channelName}: ${response.content}`
            );
            return null;
        }
    } catch (error: any) {
        console.error(
            `Error fetching roomId for ${channelName}: ${error.message}`
        );
        return null;
    }
};
