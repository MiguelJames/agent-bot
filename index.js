require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');

// ===== EXPRESS =====
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Uptime server running'));

// ===== MONGOOSE =====
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// ===== SCHEMA =====
const agentSchema = new mongoose.Schema({
  userId: String,
  agent: String,
  division: String,
  bn: String,
  equipment_date: String,
  equipped_by: String,
  weapon1_type: String,
  weapon1_sn: String,
  weapon1_ammo_type: String,
  weapon1_ammo_count: String,
  weapon1_condition: String,
  weapon2_type: String,
  weapon2_sn: String,
  weapon2_ammo_type: String,
  weapon2_ammo_count: String,
  weapon2_condition: String,
  taser_sn: String,
  num_armours: String,
  num_ifaks: String
});
const Agent = mongoose.model('Agent', agentSchema);

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.tempData = {};

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== COMMANDS =====
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // ===== REGISTER =====
  if (message.content === '!register') {
    const button = new ButtonBuilder()
      .setCustomId('open_form_1')
      .setLabel('Submit Agent Info')
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      content: 'Click the button to submit your agent info',
      components: [new ActionRowBuilder().addComponents(button)]
    });
  }

  // ===== INVENTORY =====
  if (message.content.startsWith('!inventory')) {
    const user = message.mentions.users.first() || message.author;
    const agent = await Agent.findOne({ userId: user.id });
    if (!agent) return message.reply('❌ No data found for this agent.');

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${agent.agent} Inventory`)
      .setColor(0x0099FF)
      .addFields(
        { name: '🎖 Badge', value: agent.bn, inline: true },
        { name: '🛡 Division', value: agent.division, inline: true },
        { name: '\u200B', value: '\u200B' },
        { name: '🔫 Weapon 1', value: `${agent.weapon1_type} | Ammo: ${agent.weapon1_ammo_count}`, inline: false },
        { name: '🔫 Weapon 2', value: `${agent.weapon2_type} | Ammo: ${agent.weapon2_ammo_count}`, inline: false },
        { name: '⚡ Taser', value: agent.taser_sn, inline: true },
        { name: '🛡 Armours', value: agent.num_armours, inline: true },
        { name: '💊 IFAKs', value: agent.num_ifaks, inline: true }
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ===== BADGE GENERATOR =====
  if (message.content === '!generatebadgeppd') {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return message.reply(`✅ New PPD Badge: PPD-${rand}`);
  }
  if (message.content === '!generatebadgess') {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return message.reply(`✅ New SS Badge: SS-${rand}`);
  }

  // ===== GET ALL USER IDs BY ROLE (DEBUG ADDED) =====
  if (message.content === '!getallids') {
    console.log('🔥 COMMAND TRIGGERED');

    const roleIds = ['1467573548897009980', '1467573023161843793'];

    const guild = message.guild;
    if (!guild) return message.reply('❌ This command only works in a server.');

    await message.reply('⏳ Fetching members...');

    try {
      await guild.members.fetch();

      console.log('Total members:', guild.members.cache.size);

      const membersWithRoles = guild.members.cache.filter(member =>
        roleIds.some(roleId => member.roles.cache.has(roleId))
      );

      console.log('Found members:', membersWithRoles.size);

      if (!membersWithRoles.size) {
        return message.reply('❌ No members found with these roles.');
      }

      const ids = membersWithRoles.map(m => m.user.id);

      const chunkSize = 1900;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize).join('\n');
        await message.channel.send(`📋 User IDs:\n${chunk}`);
      }

    } catch (err) {
      console.error(err);
      message.reply('❌ Error fetching members.');
    }
  }

  // ===== LIST AGENTS =====
  if (message.content === '!agents') {
    const agents = await Agent.find({});
    if (!agents.length) return message.reply('❌ No agents registered yet.');

    const embed = new EmbedBuilder().setTitle('📋 Registered Agents').setColor(0x00FF00);
    agents.forEach(a => embed.addFields({ name: a.agent, value: `${a.bn} | ${a.division}`, inline: false }));

    return message.channel.send({ embeds: [embed] });
  }
});

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    const openModal = (id, title, fields) => {
      const modal = new ModalBuilder().setCustomId(id).setTitle(title);
      fields.forEach(f => {
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(TextInputStyle.Short).setRequired(true)
        ));
      });
      return modal;
    };

    if (interaction.customId === 'open_form_1') {
      return interaction.showModal(openModal('form1', 'Form 1', [
        { id: 'agent', label: 'Agent Name' },
        { id: 'division', label: 'Division' },
        { id: 'bn', label: 'Badge Number (optional)' },
        { id: 'date', label: 'Equipment Date' },
        { id: 'by', label: 'Equipped By' }
      ]));
    }

    if (interaction.customId === 'next2') return interaction.showModal(openModal('form2', 'Form 2', [
      { id: 'w1type', label: 'Weapon 1 Type' },
      { id: 'w1sn', label: 'Weapon 1 SN' },
      { id: 'w1ammo', label: 'Ammo Type' },
      { id: 'w1count', label: 'Ammo Count' },
      { id: 'w1cond', label: 'Condition' }
    ]));

    if (interaction.customId === 'next3') return interaction.showModal(openModal('form3', 'Form 3', [
      { id: 'w2type', label: 'Weapon 2 Type' },
      { id: 'w2sn', label: 'Weapon 2 SN' },
      { id: 'w2ammo', label: 'Ammo Type' },
      { id: 'w2count', label: 'Ammo Count' },
      { id: 'w2cond', label: 'Condition' }
    ]));

    if (interaction.customId === 'next4') return interaction.showModal(openModal('form4', 'Form 4', [
      { id: 'taser', label: 'Taser SN' },
      { id: 'armour', label: 'Number of Armours' },
      { id: 'ifaks', label: 'Number of IFAKs' }
    ]));
  }

  if (interaction.isModalSubmit()) {
    const id = interaction.user.id;
    if (!client.tempData[id]) client.tempData[id] = {};

    if (interaction.customId === 'form1') {
      let badge = interaction.fields.getTextInputValue('bn');
      if (!badge || badge.trim() === '') badge = `AG-${Math.floor(Math.random() * 9000) + 1000}`;
      Object.assign(client.tempData[id], {
        agent: interaction.fields.getTextInputValue('agent'),
        division: interaction.fields.getTextInputValue('division'),
        bn: badge,
        equipment_date: interaction.fields.getTextInputValue('date'),
        equipped_by: interaction.fields.getTextInputValue('by')
      });
      return interaction.reply({
        content: 'Part 1 saved',
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('next2').setLabel('Next').setStyle(ButtonStyle.Success))],
        flags: 64
      });
    }

    if (interaction.customId === 'form2') {
      Object.assign(client.tempData[id], {
        weapon1_type: interaction.fields.getTextInputValue('w1type'),
        weapon1_sn: interaction.fields.getTextInputValue('w1sn'),
        weapon1_ammo_type: interaction.fields.getTextInputValue('w1ammo'),
        weapon1_ammo_count: interaction.fields.getTextInputValue('w1count'),
        weapon1_condition: interaction.fields.getTextInputValue('w1cond')
      });
      return interaction.reply({
        content: 'Part 2 saved',
        flags: 64
      });
    }

    if (interaction.customId === 'form3') {
      Object.assign(client.tempData[id], {
        weapon2_type: interaction.fields.getTextInputValue('w2type'),
        weapon2_sn: interaction.fields.getTextInputValue('w2sn'),
        weapon2_ammo_type: interaction.fields.getTextInputValue('w2ammo'),
        weapon2_ammo_count: interaction.fields.getTextInputValue('w2count'),
        weapon2_condition: interaction.fields.getTextInputValue('w2cond')
      });
      return interaction.reply({
        content: 'Part 3 saved',
        flags: 64
      });
    }

    if (interaction.customId === 'form4') {
      Object.assign(client.tempData[id], {
        taser_sn: interaction.fields.getTextInputValue('taser'),
        num_armours: interaction.fields.getTextInputValue('armour'),
        num_ifaks: interaction.fields.getTextInputValue('ifaks')
      });

      const data = client.tempData[id];
      await Agent.create({ userId: id, ...data });

      delete client.tempData[id];
      return interaction.reply({ content: 'Done', flags: 64 });
    }
  }
});

client.login(process.env.TOKEN);
