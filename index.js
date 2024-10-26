require('dotenv').config(); // Load environment variables from .env file
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');

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
    console.log(`Logged in as ${client.user.tag}`);
    
    // Set the bot's activity
    client.user.setActivity('VCMP Servers', { type: 'WATCHING' }); // Customize the activity here
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

                // Extract player names properly
                const players = state.players.length > 0 
                    ? state.players.map(player => player.name).join(', ') // Assuming 'name' is the correct property
                    : 'No players online';

                // Check if the server is passworded
                const isPassworded = state.raw.passworded ? 'Yes' : 'No'; // Adjust based on the actual property name

                const embed = {
                    color: 0x0099ff,
                    title: `Server Info for ${ip}:${port}`,
                    fields: [
                        { name: 'Server Name', value: state.state.name, inline: true },
                        { name: 'Game Mode', value: state.raw.gamemode, inline: true },
                        { name: 'Players', value: `${state.raw.numplayers}/${state.maxplayers}`, inline: true },
                        { name: 'Player Names', value: players, inline: false },
                        { name: 'Map', value: state.raw.map, inline: true },
                        { name: 'Version', value: state.raw.version, inline: true },
                        { name: 'Ping', value: `${state.ping} ms`, inline: true },
                        { name: 'Password Protected', value: isPassworded, inline: true }, // Added password protection info
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
    }
});

client.login(TOKEN);
