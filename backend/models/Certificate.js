const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    issueDate: { type: Date, default: Date.now },
    pdfUrl: { type: String }, // Path to generated PDF
    qrCodeUrl: { type: String } // Path to QR Code image
});

module.exports = mongoose.model('Certificate', CertificateSchema);
