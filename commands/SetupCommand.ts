import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { DSLParser } from "../handlers/DSLParser";
import { CommandParam } from "../enum/CommandParam";

export class SetupCommand implements ISlashCommand {
    public command = "setup";
    public i18nParamsExample = "";
    public i18nDescription = "";
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp
    ): Promise<void> {
        const params = context.getArguments();
        console.log(`🚀 Running setup command with params: ${params}`);
        if (params.length === 0) {
            await this.sendMessage(context, modify, "No script provided!");
            return;
        }

        if (params[0] == CommandParam.ALIVE) {
            await this.sendMessage(context, modify, "running!");
        }
        if (params[0] == CommandParam.RUN) {
            const scriptLines = params.slice(1);
            if (scriptLines.length === 0) {
                await this.sendMessage(context, modify, "No script provided!");
                return;
            }

            const script = scriptLines.join("\n");
            await this.sendMessage(context, modify, "Running given script!");

            try {
                const parser = new DSLParser(script, http, modify, context);
                await parser.parse();
                await parser.execute();
            } catch (error) {
                await this.sendMessage(
                    context,
                    modify,
                    `Error: ${error.message}`
                );
            }
        }
    }

    private async sendMessage(
        context: SlashCommandContext,
        modify: IModify,
        message: string
    ): Promise<void> {
        const messageStructure = modify.getCreator().startMessage();
        const sender = context.getSender();
        const room = context.getRoom();

        messageStructure.setSender(sender).setRoom(room).setText(message);

        await modify.getCreator().finish(messageStructure);
    }
}
