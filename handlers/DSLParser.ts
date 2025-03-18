import { IHttp, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";

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
        const scriptTrimmed = this.script.trim().replace(/\n+/g, " "); // Normalize multi-line input
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
        } else {
            console.error(`❌ Invalid ${cmd} command format: ${scriptTrimmed}`);
        }
    }

    async execute() {
        for (const command of this.commands) {
            if (command.type === "CREATE_USER") {
                const [username, name, email] = command.args;
                await this.createUser(username, name, email);
            }
        }
    }

    // private http: IHttp;

    // setHttp(http: IHttp) {
    //     this.http = http;
    // }

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
                    headers: {
                        "X-Auth-Token": ADMIN_AUTH_TOKEN,
                        "X-User-Id": ADMIN_USER_ID,
                        "Content-Type": "application/json",
                    },
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
    private async sendMessage(message: string) {
        const messageStructure = this.modify.getCreator().startMessage();
        const sender = this.context.getSender();
        const room = this.context.getRoom();

        messageStructure.setSender(sender).setRoom(room).setText(message);

        await this.modify.getCreator().finish(messageStructure);
    }
}
