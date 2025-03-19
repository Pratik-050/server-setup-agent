import { IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { fetchRoomId } from "../helpers/fetchRoomId";

const ROCKET_CHAT_URL = "http://localhost:3000";
const ADMIN_USER_ID = "EgqsQDfA5zGrYhQYr";
const ADMIN_AUTH_TOKEN = "cHeEYUogNcTmt0lxC6HQNbJyKvInWvJVlfPQQEipoh3";

type Command = { type: string; args: string[] };

export class DSLParser {
    private commands: Command[] = [];

    constructor(
        private script: string,
        private http: IHttp,
        private modify: IModify,
        private context: SlashCommandContext
    ) {}

    parse() {
        const scriptTrimmed = this.script.trim().replace(/\n+/g, " "); // Keep existing logic
        console.log(`📜 Processed script: ${scriptTrimmed}`);

        const commandRegex = /^(\w+)\s+(.+)$/; // Match command and arguments
        const match = scriptTrimmed.match(commandRegex);

        if (!match) {
            console.error(`⚠️ Invalid command format: ${scriptTrimmed}`);
            return;
        }

        const cmd = match[1]; // Extract command
        const argsString = match[2]; // Extract argument string

        // Smart argument splitting (handles quoted strings)
        const args =
            argsString
                .match(/(?:[^\s"]+|"[^"]*")+/g)
                ?.map((arg) => arg.replace(/"/g, "")) || [];

        console.log(`✅ Parsed command: ${cmd}, args: ${JSON.stringify(args)}`);

        if (cmd === "CREATE_USER" && args.length >= 3) {
            const [username, name, email] = args;
            this.commands.push({
                type: "CREATE_USER",
                args: [username, name, email],
            });
        } else if (cmd === "CREATE_CHANNEL" && args.length >= 2) {
            const [channelName, ...members] = args;
            this.commands.push({
                type: "CREATE_CHANNEL",
                args: [channelName, ...members],
            });
        } else if (cmd === "ADD_ALL_USERS" && args.length === 1) {
            const [channelName] = args;
            this.commands.push({ type: "ADD_ALL_USERS", args: [channelName] });
        } else {
            console.error(`❌ Invalid ${cmd} command format: ${scriptTrimmed}`);
        }
    }

    async execute() {
        for (const command of this.commands) {
            if (command.type === "CREATE_USER") {
                const [username, name, email] = command.args;
                await this.createUser(username, name, email);
            } else if (command.type === "CREATE_CHANNEL") {
                const [channelName, ...members] = command.args;
                await this.createChannel(channelName, members);
            } else if (command.type === "ADD_ALL_USERS") {
                const [channelName] = command.args;
                await this.addAllUsersToChannel(channelName);
            }
        }
    }

    private async createUser(username: string, name: string, email: string) {
        const payload = {
            name,
            email,
            password: "pass123",
            username,
            active: true,
            nickname: username,
            bio: "All about the user",
            joinDefaultChannels: true,
            statusText: "On a vacation",
            roles: ["bot"],
            requirePasswordChange: true,
            setRandomPassword: true,
            sendWelcomeEmail: true,
            verified: true,
            customFields: {
                clearance: "High",
                team: "Queen",
            },
        };

        try {
            const response = await this.http.post(
                `${ROCKET_CHAT_URL}/api/v1/users.create`,
                {
                    headers: this.getHeaders(),
                    data: payload,
                }
            );

            await this.sendMessage(
                `making request to ${ROCKET_CHAT_URL}/api/v1/users.create`
            );

            if (response.statusCode === 200 && response.data.success) {
                await this.sendMessage(
                    `✅ User ${username} created successfully!`
                );
            } else {
                await this.sendMessage(
                    `⚠️ User ${username} creation failed: ${response.content}`
                );
            }
        } catch (error: any) {
            await this.sendMessage(
                `❌ Failed to create user ${username}: ${
                    error.response?.data || error.message
                }`
            );
        }
    }

    private async createChannel(channelName: string, members: string[]) {
        const payload = {
            name: channelName,
            members: members,
            readOnly: false,
            excludeSelf: false,
            customFields: {
                type: "default",
            },
            extraData: {
                broadcast: true,
                encrypted: false,
            },
        };

        try {
            const response = await this.http.post(
                `${ROCKET_CHAT_URL}/api/v1/channels.create`,
                {
                    headers: this.getHeaders(),
                    data: payload,
                }
            );

            await this.sendMessage(
                `making request to ${ROCKET_CHAT_URL}/api/v1/channels.create`
            );

            if (response.statusCode === 200 && response.data.success) {
                await this.sendMessage(
                    `✅ Channel ${channelName} created successfully!`
                );
            } else {
                await this.sendMessage(
                    `⚠️ Channel ${channelName} creation failed: ${response.content}`
                );
            }
        } catch (error: any) {
            await this.sendMessage(
                `❌ Failed to create channel ${channelName}: ${
                    error.response?.data || error.message
                }`
            );
        }
    }

    private async addAllUsersToChannel(channelName: string) {
        try {
            // 🔹 Fetch roomId from /api/v1/rooms.info
            const roomId = await fetchRoomId(this.http, channelName);

            // 🔹 Make request to add all users
            const payload = { roomId, activeUsersOnly: true };

            const addUsersResponse = await this.http.post(
                `${ROCKET_CHAT_URL}/api/v1/channels.addAll`,
                { headers: this.getHeaders(), data: payload }
            );

            await this.sendMessage(
                `making request to ${ROCKET_CHAT_URL}/api/v1/channels.addAll`
            );

            if (
                addUsersResponse.statusCode === 200 &&
                addUsersResponse.data.success
            ) {
                await this.sendMessage(
                    `✅ Added all users to channel ${channelName} successfully!`
                );
            } else {
                await this.sendMessage(
                    `⚠️ Failed to add users to channel ${channelName}: ${addUsersResponse.content}`
                );
            }
        } catch (error: any) {
            await this.sendMessage(
                `❌ Failed to add all users to channel ${channelName}: ${
                    error.response?.data || error.message
                }`
            );
        }
    }

    private async sendMessage(message: string) {
        const messageStructure = this.modify.getCreator().startMessage();
        const sender = this.context.getSender();
        const room = this.context.getRoom();

        messageStructure.setSender(sender).setRoom(room).setText(message);

        await this.modify.getCreator().finish(messageStructure);
    }

    private getHeaders() {
        return {
            "X-Auth-Token": ADMIN_AUTH_TOKEN,
            "X-User-Id": ADMIN_USER_ID,
            "Content-Type": "application/json",
        };
    }
}
