const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required.'],
    trim: true
  },
  monitoredUrls: {
    type: [String],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'At least one URL is required.']
  },
  clientIndustry: {
    type: String,
    required: [true, 'Client industry is required for AI context.'],
    trim: true
  },
  monitoredComplianceRegs: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('ClientProfile', clientProfileSchema);

