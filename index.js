require('dotenv').config();
const express = require('express');
const fs = require('fs');
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

// ===== DATABASE =====
const DATA_FILE = './agents.json';

function loadAgents() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveAgents(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== EXPRESS =====
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 3000);

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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

    const agents = loadAgents();
    const agent = agents.find(a => a.userId === user.id);

    if (!agent) {
      return message.reply('❌ No data found for this agent.');
    }

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

    message.channel.send({ embeds: [embed] });
  }
});

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async interaction => {

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    const openModal = (id, title, fields) => {
      const modal = new ModalBuilder().setCustomId(id).setTitle(title);
      fields.forEach(f => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(f.id)
              .setLabel(f.label)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
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

    if (interaction.customId === 'next2') {
      return interaction.showModal(openModal('form2', 'Form 2', [
        { id: 'w1type', label: 'Weapon 1 Type' },
        { id: 'w1sn', label: 'Weapon 1 SN' },
        { id: 'w1ammo', label: 'Ammo Type' },
        { id: 'w1count', label: 'Ammo Count' },
        { id: 'w1cond', label: 'Condition' }
      ]));
    }

    if (interaction.customId === 'next3') {
      return interaction.showModal(openModal('form3', 'Form 3', [
        { id: 'w2type', label: 'Weapon 2 Type' },
        { id: 'w2sn', label: 'Weapon 2 SN' },
        { id: 'w2ammo', label: 'Ammo Type' },
        { id: 'w2count', label: 'Ammo Count' },
        { id: 'w2cond', label: 'Condition' }
      ]));
    }

    if (interaction.customId === 'next4') {
      return interaction.showModal(openModal('form4', 'Form 4', [
        { id: 'taser', label: 'Taser SN' },
        { id: 'armour', label: 'Number of Armours' },
        { id: 'ifaks', label: 'Number of IFAKs' }
      ]));
    }
  }

  // ===== MODALS =====
  if (interaction.isModalSubmit()) {
    const id = interaction.user.id;

    if (!client.tempData[id]) client.tempData[id] = {};

    // FORM 1
    if (interaction.customId === 'form1') {

      let badge = interaction.fields.getTextInputValue('bn');
      const agents = loadAgents();

      if (!badge || badge.trim() === '') {
        badge = `AG-${(agents.length + 1).toString().padStart(4, '0')}`;
      }

      Object.assign(client.tempData[id], {
        agent: interaction.fields.getTextInputValue('agent'),
        division: interaction.fields.getTextInputValue('division'),
        bn: badge,
        equipment_date: interaction.fields.getTextInputValue('date'),
        equipped_by: interaction.fields.getTextInputValue('by')
      });

      return interaction.reply({
        content: 'Part 1 saved',
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('next2').setLabel('Next').setStyle(ButtonStyle.Success)
        )],
        flags: 64
      });
    }

    // FORM 2
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
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('next3').setLabel('Next').setStyle(ButtonStyle.Success)
        )],
        flags: 64
      });
    }

    // FORM 3
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
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('next4').setLabel('Finish').setStyle(ButtonStyle.Success)
        )],
        flags: 64
      });
    }

    // FORM 4 FINAL
    if (interaction.customId === 'form4') {

      Object.assign(client.tempData[id], {
        taser_sn: interaction.fields.getTextInputValue('taser'),
        num_armours: interaction.fields.getTextInputValue('armour'),
        num_ifaks: interaction.fields.getTextInputValue('ifaks')
      });

      const data = client.tempData[id];

      const agents = loadAgents();
      agents.push({ userId: id, ...data });
      saveAgents(agents);

      const embed = new EmbedBuilder()
        .setTitle('New Agent')
        .addFields(
          { name: 'Agent', value: data.agent },
          { name: 'Badge', value: data.bn }
        );

      const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
      await channel.send({ embeds: [embed] });

      delete client.tempData[id];

      return interaction.reply({ content: 'Done', flags: 64 });
    }
  }
});

client.login(process.env.TOKEN);
