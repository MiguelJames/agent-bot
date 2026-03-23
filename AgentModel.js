// AgentModel.js
const mongoose = require('mongoose');

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
  weapon1_ammo_count: Number,
  weapon1_condition: String,
  weapon2_type: String,
  weapon2_sn: String,
  weapon2_ammo_type: String,
  weapon2_ammo_count: Number,
  weapon2_condition: String,
  taser_sn: String,
  num_armours: Number,
  num_ifaks: Number
});

// 'Agent' will automatically create 'agents' collection
const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;