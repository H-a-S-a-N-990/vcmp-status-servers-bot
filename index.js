require('dotenv').config(); // Load environment variables from .env file
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');
const express = require('express'); 

const app = express(); // 

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.DISCORD_TOKEN; // Get token from environment variables
const CLIENT_ID = process.env.CLIENT_ID; // Get client ID from environment variables

const commands = [
    {
        name: 'serverinfo',
        description: 'Get information about the VCMP server',
        options: [
            {
                name: 'ip',
                type: 3, // Type 3 is for STRING
                description: 'IP address of the VCMP server',
                required: true,
            },
            {
                name: 'port',
                type: 4, // Type 4 is for INTEGER
                description: 'Port of the VCMP server',
                required: true,
            },
        ],
    },
    {
        name: 'botinfo',
        description: 'Get information about the bot',
    },
];

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands globally
        await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('ready', () => {
    console.log('Bot is online!');
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('a game', { type: 'STREAMING' });
});

app.get('/', (req, res) => {
    res.send('Hello World'); // Respond with "Hello World"
});

// Start the Express server
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'serverinfo') {
        const ip = options.getString('ip');
        const port = options.getInteger('port');

        try {
            const response = await axios.get(`https://vcmp-servers-status.onrender.com/${ip}/${port}`);
            const data = response.data;

            if (data.msg === 'success') {
                const state = data.state;

                const players = state.players.length > 0 
                    ? state.players.map(player => player.name).join(', ')
                    : 'No players online';

                const isPassworded = state.raw.passworded ? 'Yes' : 'No';

                const embed = {
                    color: 0x0099ff,
                    title: `Server Info for ${ip}:${port}`,
                    fields: [
                        { name: 'Server Name', value: state.name, inline: true },
                        { name: 'Game Mode', value: state.raw.gamemode, inline: true },
                        { name: 'Players', value: `${state.raw.numplayers}/${state.maxplayers}`, inline: true },
                        { name: 'Player Names', value: players, inline: false },
                        { name: 'Map', value: state.raw.map, inline: true },
                        { name: 'Version', value: state.raw.version, inline: true },
                        { name: 'Ping', value: `${state.ping} ms`, inline: true },
                        { name: 'Password Protected', value: isPassworded, inline: true },
                    ],
                    timestamp: new Date(),
                };

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: 'Could not fetch server info. Please check the IP and port.', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error fetching server information. Please try again later.', ephemeral: true });
        }
    } else if (commandName === 'botinfo') {
        const embed = {
            color: 0x0099ff,
            title: 'Bot Information',
            fields: [
                { name: 'Creator', value: 'H.a.S.a.N', inline: true }, // Replace with your name
 { name: 'Programming Language', value: ' JavaScript', inline: true },
                { name: 'Library', value: 'discord.js', inline: true },
                { name: 'Version', value: '1.0', inline: true }, // Replace with your bot's version
                { name: 'Servers', value: `Currently in ${client.guilds.cache.size} servers`, inline: true },
            ],
            timestamp: new Date(),
        };

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
