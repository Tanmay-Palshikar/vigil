const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This is the "Data Contract" for the whole application
const riskIncidentSchema = new Schema({
  clientProfile: {
    type: Schema.Types.ObjectId,
    ref: 'ClientProfile',
    required: true,
    index: true
  },
  sourceUrl: {
    type: String,
    required: [true, 'Source URL is required.'],
    trim: true
  },
  // As per the build plan, this field is optional for non-text-based risks like SSL checks
  scrapedContentSnippet: {
    type: String,
    required: false,
    trim: true
  },
  aiAnalysis: {
    isRisk: {
      type: Boolean,
      required: true
    },
    riskCategory: {
      type: String,
      required: true,
      enum: ["Reputational", "Security", "Compliance", "None"]
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ["High", "Medium", "Low", "None"]
    },
    justification: {
      type: String,
      required: true
    },
    mitigationStrategy: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('RiskIncident', riskIncidentSchema);

