const fs = require('node:fs');
const path = require('node:path');

const { Client, Events, GatewayIntentBits, Partials, Collection, TextChannel} = require('discord.js');

/**
 * @type {} watchableMessages
 * @type {string} watchableMessages.id
 * @type {string} watchableMessages.channelId
 * @type {string} watchableMessages.guildId
 * @type {[x: number]} watchableMessages.emojiIds
 */
const { token, channelId, watchableMessages, emojis } = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction],
});

/**
 * @type {Collection<import("discord.js").Snowflake,Guild>}
 */
const guilds = client.guilds.cache;

//Values should Look like <guildId, <emojiId, Role>>
                                //Role is the discord object Role, the rest are a string representing the id
/**
 *
 * @type {Map<string, Map<string,import("discord.js").Role>>}
 */
emojiToRole = new Map;

//Values should look like <messageId, Collection<Snowflake,User> >... maybe?
/**
 *
 * @type {Map<string, UserManager>}
 */
oldUsers = new Map;




client.on("ready", ()=>
{
    //does this work?????
    // msgs = guilds.get(watchableMessages.);
    watchableMessages.forEach((message)=> //items have 2 elements: ['id', 'messageId'] and ['guildId', 'guildId'] I am sleep deprived
    {
        //I HAVE TO GO THROUGH THIS ROUNDABOUT WAY BECAUSE APPARENTLY YOU CANT GET MESSAGES FROM CLIENT.CHANNELS.CACHE
        //WHO THE HELL LIKES DISCORD.JS ITS ACTUALLY AWFUL LITERALLY LET ME GET A TEXTCHANNEL OBJECT FROM A CHANNEL OBJECT OH MY GOD
        let guild = guilds.get(message.guildId);
        if (guild == null) {
            console.log(`Could not find guild with id ${message.guildId}. RIPpers.`);
        }
        else {
            let channel = guild.channels.cache.get(message.channelId);
            if(channel==null) //we couldn't find the channel
            {
                console.log(`Could not find a monkey or something. Le guild is la ${guild.id}. We looked for the monkey with
                  the name ${message.id} because the item is a message thing thing thing thing thign thing thing. Ya dun goofd`);
            }
            else {
                //make sure the channel is of TextChannel so we can actually use the messages var
                if(!channel.isTextBased)
                {
                    console.log("I found a channel that isn't text based you nerd.");
                }
                else {
                                                                            //no idea why but WebStorm marks messages as undefined (it's not I literally ran this without error)
                    oldUsers.set(message.id, client.channels.cache.get(channelId).messages.fetch(message.id).reactions.cache.fetch(watchableMessages.emojiIds[0])); //i'm really lazy right now and am just testing to make sure this works
                }
            }
        }
    })
    emojis.forEach((emojiItem)=>
    {
        guild = client.guilds.cache.get(emojiItem.guildId);
        if(guild == null || guild.roles.fetch(emojiItem.roleId)==null) //make sure the guild exists and that it has the role we need to check
                                                            //we do not check for the emoji because nitro users exist :barf:
        {
            console.log("couldn't find guild with specified id, or the guild didn't have the role")
            return;
        }

        //maps the emojiId to the cached role (so we don't fetch it every time we see the reaction)
        //emojiToRole.set(item.id,guild.roles.fetch(item.roleId))
        if(emojiToRole.has(emojiItem.guildId)) //if the guild has already been added to the map
        {
            //we need to get the first map to set the nested map so we can add a new value in it
            emojiToRole.get(emojiItem.guildId).set(emojiItem.id,guild.roles.fetch(emojiItem.roleId));
        }
        else //we haven't added the guild to the map and we can use set
        {
            //anyways I was really stupid and you need double square brackets to make an entry (array of arrays because i can't just use <> syntax or something (stupid js amirite)
            emojiToRole.set(emojiItem.guildId, new Map([[emojiItem.id,guild.roles.fetch(emojiItem.roleId)]]));
        }
    })
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // When a reaction is received, check if the structure is partial (what?)
    if (reaction.partial) {
        // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
        try {
            await reaction.fetch();
        } catch (error) { //i love that javascript doesn't have a way to catch only specific errors
            console.error('Something went wrong when fetching the message:', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }
    if(/*!watchableMessages.includes(reaction.message.id)*/watchableMessagesHasVal(reaction.message.id,'id')){
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

/**
 *
 * @param {import("discord.js").Emoji} emoji
 * @param {string|import("discord.js").Snowflake} emoji.id
 * @returns {boolean}
 */
function hasEmoji(emoji)
{
    emojis.forEach((item)=>
    {
        if(emoji.id==item.id)
            return true;
    })
    Console.log(`could not find emoji ${emoji}`)
    return false;
}

/**
 *
 * @param {import("discord.js").Snowflake|string} value
 * @param {string} valueType
 * @returns {boolean}
 */
function watchableMessagesHasVal(value, valueType)
{
    if(valueType==='id')
        watchableMessages.forEach((message)=>
        {
            if(message.id==value)
                return true;
        })
    else if(valueType==='channelId')
        watchableMessages.forEach((message)=>
        {
            if(message.channelId==value)
                return true;
        })
    else if(valueType==='guildId')
        watchableMessages.forEach((message)=>
        {
            if(message.guildId==value)
                return true;
        })
    return false;
}