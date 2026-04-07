const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
const User = require('./models/User');
const Skill = require('./models/Skill');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const regenerateAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const certificates = await Certificate.find().populate('user').populate('skill');
        console.log(`🔍 Found ${certificates.length} certificates to regenerate.`);

        for (const cert of certificates) {
            try {
                if (!cert.user || !cert.skill) {
                    console.warn(`⚠️  Skipping cert ${cert._id}: Missing user or skill.`);
                    continue;
                }
                console.log(`🛠  Regenerating certificate for ${cert.user.name} - ${cert.skill.title}...`);

                const uniqueId = `CERT-${Date.now()}-${cert.user._id.toString().slice(-4)}`;
                const verificationUrl = `http://localhost:5173/verify/${uniqueId}`;
                const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

                const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
                const fileName = `certificate-${uniqueId}.pdf`;
                const filePath = path.join(__dirname, 'uploads', fileName);

                if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
                    fs.mkdirSync(path.join(__dirname, 'uploads'));
                }

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // --- Executive Honors Premium Design ---
                const width = doc.page.width;
                const height = doc.page.height;
                const navy = '#0a192f';
                const gold = '#c5a059';
                const lightGray = '#64748b';

                doc.rect(0, 0, width, height).fill('#fdfdfb');
                doc.fillColor('#000').fillOpacity(0.02);
                for (let i = 0; i < width; i += 4) { doc.rect(i, 0, 1, height).fill(); }
                doc.fillOpacity(1);

                doc.rect(40, 40, width - 80, height - 80).lineWidth(1.5).stroke(gold);
                doc.rect(50, 50, width - 100, height - 100).lineWidth(4).stroke(navy);
                doc.rect(56, 56, width - 112, height - 112).lineWidth(1.5).stroke(gold);

                doc.fillColor(gold).fontSize(14).text('DISTINGUISHED ACHIEVEMENT AWARD', 0, 90, { align: 'center', characterSpacing: 1.5 });
                doc.fillColor(navy).fontSize(34).text('RECOGNITION OF EXCELLENCE', { align: 'center', characterSpacing: 1 });
                doc.moveTo(width / 2 - 120, 150).lineTo(width / 2 + 120, 150).lineWidth(1.5).stroke(gold);
                doc.moveDown(1.5);

                doc.fillColor(lightGray).fontSize(12).text('THIS IS TO SOLEMNLY CERTIFY THAT', { align: 'center', characterSpacing: 2 });
                doc.moveDown(0.5);
                doc.fillColor(navy).fontSize(50).text(cert.user.name.toUpperCase(), { align: 'center' });                // 6. Descriptive Text
                doc.moveDown(1);
                doc.fillColor(lightGray).fontSize(14).font('Helvetica-Oblique').text('has distinguished themselves through exceptional performance and', { align: 'center' });
                doc.text('demonstrated mastery in the professional domain of', { align: 'center' });
                doc.font('Helvetica'); // Reset
                doc.moveDown(0.5);
                doc.fillColor(navy).fontSize(28).text(cert.skill.title.toUpperCase(), { align: 'center', characterSpacing: 1 });

                const sealY = height - 180;
                doc.circle(width / 2, sealY + 40, 35).lineWidth(1).stroke(gold);
                doc.fillColor(gold).fontSize(10).text('OFFICIAL SEAL', width / 2 - 30, sealY + 35, { width: 60, align: 'center' });

                const footerY = height - 110;
                doc.fillColor(navy).fontSize(12).text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 120, footerY, { width: 150, align: 'center' });
                doc.fillColor(lightGray).fontSize(8).text('DATE OF CONFERMENT', 120, footerY + 15, { width: 150, align: 'center' });
                doc.moveTo(width - 270, footerY - 5).lineTo(width - 120, footerY - 5).lineWidth(0.5).stroke(navy);
                doc.fillColor(lightGray).fontSize(8).text('SENIOR EXECUTIVE BOARD', width - 270, footerY + 15, { width: 150, align: 'center' });

                const bottomY = height - 55;
                doc.fillColor(lightGray).fontSize(7).text(`CREDENTIAL REF: ${uniqueId}  •  VERIFIED VIA SKILLSWAP LEDGER`, 0, bottomY, { align: 'center' });
                doc.image(qrCodeDataUrl, width - 90, height - 90, { width: 50 });

                doc.end();

                cert.pdfUrl = `/uploads/${fileName}`;
                cert.uniqueId = uniqueId;
                cert.qrCodeUrl = qrCodeDataUrl;
                await cert.save();
                console.log(`✅ Success for ${cert.user.name}`);
            } catch (err) {
                console.error(`❌ Failed to regenerate cert for ${cert._id}:`, err);
            }
        }

        console.log('✨ All certificates have been upgraded!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Global Error:', err);
        process.exit(1);
    }
};

regenerateAll();
