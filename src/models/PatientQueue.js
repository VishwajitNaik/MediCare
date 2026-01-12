import mongoose from 'mongoose';

const PatientQueueSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'WAITING'
  },
  queueNumber: {
    type: Number,
    required: true
  },
  tokenNumber: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'addedByModel',
    required: true
  },
  addedByModel: {
    type: String,
    enum: ['Doctor', 'Medical'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
    default: 'NORMAL'
  }
}, { timestamps: true });

// Compound index to ensure unique queue numbers per doctor per day
PatientQueueSchema.index({
  doctorId: 1,
  queueNumber: 1,
  createdAt: 1 // This will group by date automatically
});

// Virtual to get queue age
PatientQueueSchema.virtual('queueAge').get(function() {
  return Date.now() - this.addedAt.getTime();
});

// Virtual to get waiting time
PatientQueueSchema.virtual('waitingTime').get(function() {
  if (!this.calledAt) return Date.now() - this.addedAt.getTime();
  return this.calledAt.getTime() - this.addedAt.getTime();
});

export default mongoose.models.PatientQueue || mongoose.model('PatientQueue', PatientQueueSchema);