import dotenv from "dotenv";

dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.TOKEN);

// client.on(Events.MessageCreate, async (message) => {
//   console.log(message.content);
//   if (message.content === "ping") {
//     message.reply("pong");
//   }
// });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, guild, channel, member } = interaction;

  if (commandName === "createproject") {
    // Check if command was sent in the "create-projects" channel
    if (channel.name !== "create-projects") {
      return interaction.reply({
        content:
          'You can only use this command in the "create-projects" channel.',
        ephemeral: true,
      });
    }

    // Get the project name from command options
    const projectName = options.getString("project-name");
    if (!projectName) {
      return interaction.reply("Project name is required!");
    }

    // Get the "Staff" and "Executive Staff" roles
    const executiveStaffRole = guild.roles.cache.find(
      (role) => role.name === "Executive Staff"
    );

    // Check if the roles exist
    if (!executiveStaffRole) {
      return interaction.reply(
        'Cannot find the "Staff" or "Executive Staff" roles.'
      );
    }

    // Find the "projects" category

    const projectsCategory = guild.channels.cache.find(
      (c) => c.name == "projects" && c.type == 4
    );

    // Check if the category exists
    if (!projectsCategory) {
      return interaction.reply('Cannot find the "projects" category.');
    }

    // Create the new channel in the "projects" category
    const newChannel = await guild.channels.create({
      name: projectName,
      type: ChannelType.GuildText,
      parent: projectsCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone, // Deny permissions for @everyone
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: member.id, // Grant permissions for command author
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },

        {
          id: executiveStaffRole.id, // Grant permissions for "Executive Staff" role
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`Welcome to ${projectName}`)
      .setDescription("Here are your available commands:")
      .addFields(
        { name: "/invite", value: "Invite someone to the project." },
        { name: "/kick", value: "Kick someone from the project." },
        {
          name: "/complete",
          value: "Finish the project and archive the channel.",
        }
      )
      .setTimestamp()
      .setColor("#0099ff"); // You can change the color to whatever you want

    newChannel.send({ embeds: [embed] });

    return interaction.reply({
      content: `A new project channel "${projectName}" has been created!`,
      ephemeral: true,
    });
  } else if (commandName === "complete") {
    if (!interaction.channel) {
      return interaction.reply(
        "This command can only be used within a channel."
      );
    }

    const projectsCategory = guild.channels.cache.find(
      (c) => c.name == "projects" && c.type == 4
    );

    if (!projectsCategory) {
      return interaction.reply('Cannot find the "projects" category.');
    }

    // Check if the command was executed in a channel under the "projects" category
    if (
      interaction.channel.parentId !== projectsCategory.id ||
      interaction.channel.name === "create-projects"
    ) {
      return interaction.reply(
        'You can only use this command in a project channel under the "projects" category.'
      );
    }

    const completedProjectsCategory = guild.channels.cache.find(
      (c) => c.name == "completed-projects" && c.type == 4
    );

    if (!completedProjectsCategory) {
      return interaction.reply(
        'Cannot find the "completed-projects" category.'
      );
    }

    // Change the parent of the channel to move it to the "completed-projects" category
    interaction.channel.setParent(completedProjectsCategory);

    // Update permissions to make the channel read-only for everyone
    await interaction.channel.permissionOverwrites.set([
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ]);

    const embed = new EmbedBuilder()
      .setTitle("Successfully Finished!")
      .setDescription("This project has been completed and archived.")
      .setColor("#0099ff")
      .setTimestamp();

    interaction.channel.send({ embeds: [embed] });
    return interaction.reply(`Congrats!`);
  } else if (commandName === "invite") {
    if (!interaction.channel) {
      return interaction.reply(
        "This command can only be used within a channel."
      );
    }

    const projectsCategory = guild.channels.cache.find(
      (c) => c.name == "projects" && c.type == 4
    );

    if (!projectsCategory) {
      return interaction.reply('Cannot find the "projects" category.');
    }

    // Check if the command was executed in a channel under the "projects" category
    if (
      interaction.channel.parentId !== projectsCategory.id ||
      interaction.channel.name === "create-projects"
    ) {
      return interaction.reply(
        'You can only use this command in a project channel under the "projects" category.'
      );
    }
    // Get the fellow's username
    const fellowUsername = options.getString("fellow");

    let fellow;
    try {
      fellow = await guild.members.fetch({ query: fellowUsername, limit: 1 });
      fellow = fellow.first();
    } catch (error) {
      console.error(error);
    }

    // Check if the fellow exists
    if (!fellow) {
      return interaction.reply({
        ephemeral: true,
        content: `Cannot find the user "${fellowUsername}".`,
      });
    }
    // Add the fellow to the channel permissions

    // Remove any existing permissions for the user
    await interaction.channel.permissionOverwrites.edit(fellow.id, {
      ViewChannel: true,
      SendMessages: true,
    });

    // Grant new permissions
    return interaction.reply(
      `User "${fellowUsername}" has been invited to the project!`
    );
  } else if (commandName === "kick") {
    if (!interaction.channel) {
      return interaction.reply(
        "This command can only be used within a channel."
      );
    }

    const projectsCategory = guild.channels.cache.find(
      (c) => c.name == "projects" && c.type == 4
    );

    if (!projectsCategory) {
      return interaction.reply('Cannot find the "projects" category.');
    }

    // Check if the command was executed in a channel under the "projects" category
    if (
      interaction.channel.parentId !== projectsCategory.id ||
      interaction.channel.name === "create-projects"
    ) {
      return interaction.reply(
        'You can only use this command in a project channel under the "projects" category.'
      );
    }
    // Get the fellow's username
    const fellowUsername = options.getString("fellow");

    let fellow;
    try {
      fellow = await guild.members.fetch({ query: fellowUsername, limit: 1 });
      fellow = fellow.first();
    } catch (error) {
      console.error(error);
    }

    // Check if the fellow exists
    if (!fellow) {
      return interaction.reply({
        ephemeral: true,
        content: `Cannot find the user "${fellowUsername}".`,
      });
    }

    // Add the fellow to the channel permissions
    await interaction.channel.permissionOverwrites.edit(fellow.id, {
      ViewChannel: false,
      SendMessages: false,
    });

    return interaction.reply(
      `User "${fellowUsername}" has been kicked from the project`
    );
  }
});

client.on("messageCreate", (message) => {
  // Check if the message was sent in the 'create-projects' channel
  if (message.channel.name === "create-projects") {
    // Delete the message after 1 minute (60000 milliseconds)
    setTimeout(() => {
      try {
        message.delete().catch(console.error);
      } catch (e) {}
    }, 60000);
  }
});
