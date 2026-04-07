const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Generate Certificate
router.post('/generate', auth, async (req, res) => {
    try {
        const { skillId, userId, forceRegenerate } = req.body;

        // If teacher is issuing for student, use userId. Otherwise use requester's id.
        const recipientId = userId || req.user.id;

        // Check if certificate already exists
        const existingCert = await Certificate.findOne({ user: recipientId, skill: skillId });

        if (existingCert && !forceRegenerate) {
            return res.json(existingCert);
        }

        const user = await User.findById(recipientId);
        const skill = await Skill.findById(skillId);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });
        if (!user) return res.status(404).json({ msg: 'Recipient not found' });

        // Security check: Only the recipient themselves OR the teacher of the skill can generate it
        if (req.user.id !== recipientId && skill.teacher.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to generate certificate for this user' });
        }

        const uniqueId = `CERT-${Date.now()}-${recipientId.toString().slice(-4)}`;
        const verificationUrl = `http://localhost:5173/verify/${uniqueId}`;

        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
        // Save QR code temporarily if needed or embed directly. 
        // For simplicity, we just embed the Data URL string or similar logic.

        // Generate PDF
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margin: 0 // We'll manage margins manually for the border
        });
        const fileName = `certificate-${uniqueId}.pdf`;
        const filePath = path.join(__dirname, '../uploads', fileName);

        if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads'));
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // --- Executive Honors Premium Design ---
        const width = doc.page.width;
        const height = doc.page.height;
        const navy = '#0a192f';
        const gold = '#c5a059';
        const lightGray = '#64748b';

        // 1. Background Fill (Off-white/Cream with subtle texture)
        doc.rect(0, 0, width, height).fill('#fdfdfb');

        // Subtle Parchment Stripes (Watermark effect)
        doc.fillColor('#000').fillOpacity(0.02);
        for (let i = 0; i < width; i += 4) {
            doc.rect(i, 0, 1, height).fill();
        }
        doc.fillOpacity(1); // Reset opacity

        // 2. Elegant Triple Border with corner accents
        doc.rect(40, 40, width - 80, height - 80).lineWidth(1.5).stroke(gold);
        doc.rect(50, 50, width - 100, height - 100).lineWidth(4).stroke(navy);
        doc.rect(56, 56, width - 112, height - 112).lineWidth(1.5).stroke(gold);

        // 3. Top Branding & Decorative Line
        doc.fillColor(gold).fontSize(14).text('DISTINGUISHED ACHIEVEMENT AWARD', 0, 90, { align: 'center', characterSpacing: 1.5 });
        doc.fillColor(navy).fontSize(34).text('RECOGNITION OF EXCELLENCE', { align: 'center', characterSpacing: 1 });

        doc.moveTo(width / 2 - 120, 150).lineTo(width / 2 + 120, 150).lineWidth(1.5).stroke(gold);

        doc.moveDown(1.5);

        // 4. Sub-header
        doc.fillColor(lightGray).fontSize(12).text('THIS IS TO SOLEMNLY CERTIFY THAT', { align: 'center', characterSpacing: 2 });

        // 5. Recipient Name (Centerpiece)
        doc.moveDown(0.5);
        doc.fillColor(navy).fontSize(50).text(user.name.toUpperCase(), { align: 'center' });

        // 6. Descriptive Text
        doc.moveDown(1);
        doc.fillColor(lightGray).fontSize(14).italic().text('has distinguished themselves through exceptional performance and', { align: 'center' });
        doc.text('demonstrated mastery in the professional domain of', { align: 'center' });

        // 7. Course/Skill Title
        doc.moveDown(0.5);
        doc.fillColor(navy).fontSize(28).text(skill.title.toUpperCase(), { align: 'center', characterSpacing: 1 });

        // 8. Official Seal (Geometric)
        const sealY = height - 180;
        doc.circle(width / 2, sealY + 40, 35).lineWidth(1).stroke(gold);
        doc.fillColor(gold).fontSize(10).text('OFFICIAL SEAL', width / 2 - 30, sealY + 35, { width: 60, align: 'center' });

        // 9. Structured Footer
        const footerY = height - 110;

        // Left: Date of Conferment
        doc.fillColor(navy).fontSize(12).text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 120, footerY, { width: 150, align: 'center' });
        doc.fillColor(lightGray).fontSize(8).text('DATE OF CONFERMENT', 120, footerY + 15, { width: 150, align: 'center' });

        // Right: Signature
        doc.moveTo(width - 270, footerY - 5).lineTo(width - 120, footerY - 5).lineWidth(0.5).stroke(navy);
        doc.fillColor(lightGray).fontSize(8).text('SENIOR EXECUTIVE BOARD', width - 270, footerY + 15, { width: 150, align: 'center' });

        // 10. QR Code & Reference (Subtle & Organized)
        const bottomY = height - 55;
        doc.fillColor(lightGray).fontSize(7).text(`CREDENTIAL REF: ${uniqueId}  •  VERIFIED VIA SKILLSWAP LEDGER`, 0, bottomY, { align: 'center' });

        // QR Code in bottom right corner, away from text
        doc.image(qrCodeDataUrl, width - 90, height - 90, { width: 50 });

        doc.end();

        const pdfUrl = `/uploads/${fileName}`; // Relative path to serve statically

        if (existingCert) {
            existingCert.pdfUrl = pdfUrl;
            existingCert.uniqueId = uniqueId;
            existingCert.qrCodeUrl = qrCodeDataUrl;
            await existingCert.save();
            return res.json(existingCert);
        }

        const newCert = new Certificate({
            uniqueId,
            user: recipientId,
            skill: skillId,
            pdfUrl,
            qrCodeUrl: qrCodeDataUrl // storing data URL for now
        });

        await newCert.save();
        res.json(newCert);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get My Certificates
router.get('/', auth, async (req, res) => {
    try {
        const certs = await Certificate.find({ user: req.user.id }).populate('skill', 'title');
        res.json(certs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Certificate for Specific Skill
router.get('/skill/:skillId', auth, async (req, res) => {
    try {
        const cert = await Certificate.findOne({
            user: req.user.id,
            skill: req.params.skillId
        }).populate('skill', 'title');

        if (!cert) {
            return res.status(404).json({ msg: 'Certificate not found for this skill' });
        }
        res.json(cert);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
