const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Partials, Collection, TextChannel} = require('discord.js');
const { token, channelId, watchableMessages, emojiIds } = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction],
});

const guilds = client.guilds.cache;

//Values should Look like <guildId, <emojiId, Role>>
                                //Role is the discord object Role, the rest are a string representing the id
emojiToRole = new Map;

//Values should look like <messageId, User>... might be UserResolvable?
oldUsers = new Map;

function hasEmoji(emoji)
{
    emojiIds.forEach((item)=>
    {
        if(emoji.id==item.id)
            return true;
    })
    return false;
}

client.on("ready", ()=>
{
    //does this work?????
    // msgs = guilds.get(watchableMessages.);
    watchableMessages.forEach((item)=> //items have 2 elements: ['id', 'messageId'] and ['guildId', 'guildId'] I am sleep deprived
    {
        //I HAVE TO GO THROUGH THIS ROUNDABOUT WAY BECAUSE APPARENTLY YOU CANT GET MESSAGES FROM CLIENT.CHANNELS.CACHE
        //WHO THE HELL LIKES DISCORD.JS ITS ACTUALLY AWFUL LITERALLY LET ME GET A TEXTCHANNEL OBJECT FROM A CHANNEL OBJECT OH MY GOD
        let guild = guilds.get(item.guildId);
        if (guild == null) {
            console.log(`Could not find guild with id ${item.guildId}. RIPpers.`);
        }
        else {
            let channel = guild.channels.cache.get(item.channelId);
            if(channel==null) //we couldn't find the channel
            {
                console.log(`Could not find a monkey or something. Le guild is la ${guild.id}. We looked for the monkey with
                  the name ${item.id} because the item is a message thing thing thing thing thign thing thing. Ya dun goofd`);
            }
            else {
                if(!channel.isTextBased)
                {
                    console.log()
                }
                oldUsers.set(item.id, );
            }
        }
    })
    emojiIds.forEach((item)=>
    {
        guild = client.guilds.cache.get(item.guildId);
        if(guild == null || guild.roles.fetch(item.roleId)==null) //make sure the guild exists and that it has the role we need to check
                                                            //we do not check for the emoji because nitro users exist :barf:
            return;

        //maps the emojiId to the cached role (so we don't fetch it every time we see the reaction)
        //emojiToRole.set(item.id,guild.roles.fetch(item.roleId))
        if(emojiToRole.includes(item.guildId))
        {
            emojiToRole.get(item.guildId).set(item.id,guild.roles.fetch(item.roleId));
        }
        else //we haven't added the guild to the map and we can use set
        {
            emojiToRole.set(item.guildId, new Map([item.id,guidl.roles.fetch(item.roleId)]));
        }
    })
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    if(!watchableMessages.includes(reaction.message.id)){
        console.log(`Not right message id ${reaction.message.id}`);
        return;
    }

    if(!hasEmoji(reaction.emoji))
    {
        console.log(`Could not find emoji with ID ${reaction.emoji.id}.`);
        return;
    }
    (await reaction.users.fetch()).forEach((user,snowflake,map)=>
    {
        let newUser = oldUsers[reaction.message.id].fetch(user);
        if(newUser==null)
        {
            console.log(`Could not find a user???? I can't understand how anyone can like dynamically typed languages`);
            return;
        }
        reaction.message.guild.members.fetch(newUser).roles.add(emojiToRole.get(reaction.message.guildId).get(reaction.emoji.id));
    })
/*
    // Now the message has been cached and is fully available
    console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
    // The reaction is now also fully available and the properties will be reflected accurately:
    console.log(`${reaction.count} user(s) have given the same reaction to this message!`);*/
});

//client.commands = new Collection();

//const commandsPath = path.join(__dirname, 'commands');
//const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

/*for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}*/

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});
/*
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
*/

// Log in to Discord with your client's token
client.login(token);
