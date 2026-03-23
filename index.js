require('dotenv').config();
const express = require('express'); // For uptime server
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

// ===== Express server for uptime =====
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Uptime server running'));

// ===== Discord Client =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Temp storage
client.tempData = {};

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== COMMAND =====
client.on(Events.MessageCreate, async message => {
  if (message.content === '!register') {
    const button = new ButtonBuilder()
      .setCustomId('open_form_1')
      .setLabel('Submit Agent Info')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({
      content: 'Click the button to submit your agent info',
      components: [row]
    });
  }
});

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async interaction => {

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    const openModal = (customId, title, fields) => {
      const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
      fields.forEach(f => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(f.id)
              .setLabel(f.label)
              .setStyle(f.style || TextInputStyle.Short)
              .setRequired(f.required ?? true)
          )
        );
      });
      return modal;
    };

    // Form 1
    if (interaction.customId === 'open_form_1') {
      const fields1 = [
        { id: 'agent', label: 'Agent Name' },
        { id: 'division', label: 'Division (Secret Service / PPD)' },
        { id: 'bn', label: 'Badge Number' },
        { id: 'equipment_date', label: 'Equipment Date' },
        { id: 'equipped_by', label: 'Equipped By' }
      ];
      return interaction.showModal(openModal('agent_form_1', 'Agent Registration - Part 1', fields1));
    }

    // Form 2
    if (interaction.customId === 'continue_form_2') {
      const fields2 = [
        { id: 'weapon1_type', label: 'Weapon 1 Type' },
        { id: 'weapon1_sn', label: 'Weapon 1 SN' },
        { id: 'weapon1_ammo_type', label: 'Weapon 1 Ammo Type' },
        { id: 'weapon1_ammo_count', label: 'Weapon 1 Ammo Count' },
        { id: 'weapon1_condition', label: 'Weapon 1 Condition' }
      ];
      return interaction.showModal(openModal(`agent_form_2_${interaction.user.id}`, 'Agent Registration - Part 2', fields2));
    }

    // Form 3
    if (interaction.customId === 'continue_form_3') {
      const fields3 = [
        { id: 'weapon2_type', label: 'Weapon 2 Type' },
        { id: 'weapon2_sn', label: 'Weapon 2 SN' },
        { id: 'weapon2_ammo_type', label: 'Weapon 2 Ammo Type' },
        { id: 'weapon2_ammo_count', label: 'Weapon 2 Ammo Count' },
        { id: 'weapon2_condition', label: 'Weapon 2 Condition' }
      ];
      return interaction.showModal(openModal(`agent_form_3_${interaction.user.id}`, 'Agent Registration - Part 3', fields3));
    }

    // Form 4
    if (interaction.customId === 'continue_form_4') {
      const fields4 = [
        { id: 'taser_sn', label: 'Taser SN' },
        { id: 'num_armours', label: 'Number of Armours' },
        { id: 'num_ifaks', label: 'Number of IFAKs' }
      ];
      return interaction.showModal(openModal(`agent_form_4_${interaction.user.id}`, 'Agent Registration - Part 4', fields4));
    }
  }

  // ===== MODALS =====
  if (interaction.isModalSubmit()) {
    const userId = interaction.user.id;

    // Form 1
    if (interaction.customId === 'agent_form_1') {
      client.tempData[userId] = {
        agent: interaction.fields.getTextInputValue('agent'),
        division: interaction.fields.getTextInputValue('division'),
        bn: interaction.fields.getTextInputValue('bn'),
        equipment_date: interaction.fields.getTextInputValue('equipment_date'),
        equipped_by: interaction.fields.getTextInputValue('equipped_by')
      };

      const btn = new ButtonBuilder()
        .setCustomId('continue_form_2')
        .setLabel('Continue to Part 2')
        .setStyle(ButtonStyle.Success);

      return interaction.reply({
        content: '✅ Part 1 saved. Click below to continue.',
        components: [new ActionRowBuilder().addComponents(btn)],
        flags: 64
      });
    }

    // Form 2
    if (interaction.customId.startsWith('agent_form_2_')) {
      Object.assign(client.tempData[userId], {
        weapon1_type: interaction.fields.getTextInputValue('weapon1_type'),
        weapon1_sn: interaction.fields.getTextInputValue('weapon1_sn'),
        weapon1_ammo_type: interaction.fields.getTextInputValue('weapon1_ammo_type'),
        weapon1_ammo_count: interaction.fields.getTextInputValue('weapon1_ammo_count'),
        weapon1_condition: interaction.fields.getTextInputValue('weapon1_condition')
      });

      if (isNaN(parseInt(client.tempData[userId].weapon1_ammo_count))) {
        return interaction.reply({ content: '❌ Weapon 1 Ammo Count must be a number.', flags: 64 });
      }

      const btn = new ButtonBuilder()
        .setCustomId('continue_form_3')
        .setLabel('Continue to Part 3')
        .setStyle(ButtonStyle.Success);

      return interaction.reply({
        content: '✅ Part 2 saved. Continue.',
        components: [new ActionRowBuilder().addComponents(btn)],
        flags: 64
      });
    }

    // Form 3
    if (interaction.customId.startsWith('agent_form_3_')) {
      Object.assign(client.tempData[userId], {
        weapon2_type: interaction.fields.getTextInputValue('weapon2_type'),
        weapon2_sn: interaction.fields.getTextInputValue('weapon2_sn'),
        weapon2_ammo_type: interaction.fields.getTextInputValue('weapon2_ammo_type'),
        weapon2_ammo_count: interaction.fields.getTextInputValue('weapon2_ammo_count'),
        weapon2_condition: interaction.fields.getTextInputValue('weapon2_condition')
      });

      if (isNaN(parseInt(client.tempData[userId].weapon2_ammo_count))) {
        return interaction.reply({ content: '❌ Weapon 2 Ammo Count must be a number.', flags: 64 });
      }

      const btn = new ButtonBuilder()
        .setCustomId('continue_form_4')
        .setLabel('Continue to Part 4')
        .setStyle(ButtonStyle.Success);

      return interaction.reply({
        content: '✅ Part 3 saved. Continue.',
        components: [new ActionRowBuilder().addComponents(btn)],
        flags: 64
      });
    }

    // Form 4
    if (interaction.customId.startsWith('agent_form_4_')) {
      Object.assign(client.tempData[userId], {
        taser_sn: interaction.fields.getTextInputValue('taser_sn'),
        num_armours: interaction.fields.getTextInputValue('num_armours'),
        num_ifaks: interaction.fields.getTextInputValue('num_ifaks')
      });

      const data = client.tempData[userId];

      if (isNaN(parseInt(data.num_armours)) || isNaN(parseInt(data.num_ifaks))) {
        return interaction.reply({ content: '❌ Number of Armours and IFAKs must be numbers.', flags: 64 });
      }

      const channel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

      const embed = new EmbedBuilder()
        .setTitle('📋 New Agent Submission')
        .setColor(0x00FF00)
        .addFields(
          { name: '👤 Agent', value: data.agent, inline: true },
          { name: '🛡 Division', value: data.division, inline: true },
          { name: '🎖 Badge Number', value: data.bn, inline: true },
          { name: '📅 Equipment Date', value: data.equipment_date, inline: true },
          { name: '🔧 Equipped By', value: data.equipped_by, inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: '🔫 Weapon 1', value: `${data.weapon1_type} | ${data.weapon1_sn} | ${data.weapon1_ammo_type} | ${data.weapon1_ammo_count} | ${data.weapon1_condition}`, inline: false },
          { name: '🔫 Weapon 2', value: `${data.weapon2_type} | ${data.weapon2_sn} | ${data.weapon2_ammo_type} | ${data.weapon2_ammo_count} | ${data.weapon2_condition}`, inline: false },
          { name: '⚡ Taser', value: data.taser_sn, inline: true },
          { name: '🛡 Number of Armours', value: data.num_armours, inline: true },
          { name: '💊 Number of IFAKs', value: data.num_ifaks, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      delete client.tempData[userId];

      return interaction.reply({ content: '✅ Submission completed!', flags: 64 });
    }
  }
});

client.login(process.env.TOKEN);