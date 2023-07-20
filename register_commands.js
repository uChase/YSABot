import { REST, Routes, ApplicationCommandOptionType } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const commands = [
  {
    name: "createproject",
    description: "Create a new project channel",
    options: [
      {
        name: "project-name",
        description: "project name",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "complete",
    description: "Finish a project and archive it",
  },
  {
    name: "invite",
    description: "Invite a fellow",
    options: [
      {
        name: "fellow",
        description: "fellow-name",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "kick",
    description: "Kick a fellow",
    options: [
      {
        name: "fellow",
        description: "fellow-name",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log("register commands");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("registered");
  } catch (error) {
    console.log(error);
  }
})();
