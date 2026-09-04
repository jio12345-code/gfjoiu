/**
 * QuizCraft Pro - High-Resolution Certificate Generator (Canvas 2D)
 */

export class CertificateGenerator {
  /**
   * Draw certificate on a canvas element
   * @param {HTMLCanvasElement} canvas 
   * @param {Object} data - { studentName, quizTitle, scorePercent, grade, date, certId }
   */
  static render(canvas, data) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set high-res canvas dimensions (1600 x 1100 px)
    const W = 1600;
    const H = 1100;
    canvas.width = W;
    canvas.height = H;

    // Background base
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0E131F');
    bgGrad.addColorStop(0.5, '#141B2D');
    bgGrad.addColorStop(1, '#0B0E17');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative geometric background glow
    const radialGlow = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 700);
    radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    radialGlow.addColorStop(0.7, 'rgba(139, 92, 246, 0.03)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, W, H);

    // Outer Gold & Indigo Border
    ctx.lineWidth = 14;
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, '#F59E0B');
    borderGrad.addColorStop(0.3, '#6366F1');
    borderGrad.addColorStop(0.7, '#8B5CF6');
    borderGrad.addColorStop(1, '#F59E0B');
    ctx.strokeStyle = borderGrad;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Inner Subtle Thin Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // Corner Ornaments
    this.drawCorner(ctx, 60, 60, 1, 1);
    this.drawCorner(ctx, W - 60, 60, -1, 1);
    this.drawCorner(ctx, 60, H - 60, 1, -1);
    this.drawCorner(ctx, W - 60, H - 60, -1, -1);

    // Brand Header
    ctx.textAlign = 'center';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillStyle = '#818CF8';
    ctx.fillText('QUIZCRAFT PRO • OFFICIAL VERIFIED ASSESSMENT', W / 2, 140);

    // Main Certificate Title
    ctx.font = '900 54px "Inter", sans-serif';
    const titleGrad = ctx.createLinearGradient(W/2 - 300, 0, W/2 + 300, 0);
    titleGrad.addColorStop(0, '#FFFFFF');
    titleGrad.addColorStop(0.5, '#E0E7FF');
    titleGrad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = titleGrad;
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 230);

    // Subtitle
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('This certificate is proudly awarded to', W / 2, 310);

    // Student / Participant Name
    ctx.font = '800 60px "Inter", sans-serif';
    const nameGrad = ctx.createLinearGradient(W/2 - 250, 0, W/2 + 250, 0);
    nameGrad.addColorStop(0, '#38BDF8');
    nameGrad.addColorStop(0.5, '#818CF8');
    nameGrad.addColorStop(1, '#F472B6');
    ctx.fillStyle = nameGrad;
    ctx.fillText(data.studentName || 'Distinguished Developer', W / 2, 400);

    // Underline for name
    ctx.beginPath();
    ctx.moveTo(W / 2 - 280, 425);
    ctx.lineTo(W / 2 + 280, 425);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6366F1';
    ctx.stroke();

    // Reason / Course info
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('for exceptional performance and successfully completing the assessment:', W / 2, 480);

    // Quiz Title
    ctx.font = '700 36px "Inter", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`"${data.quizTitle || 'Assessment Challenge'}"`, W / 2, 545);

    // Badge Circle & Score Stamp
    this.drawScoreBadge(ctx, W / 2, 690, data.scorePercent || 100, data.grade || 'A+');

    // Bottom Details Row: Date, ID, Signature
    ctx.textAlign = 'left';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`Issue Date: ${data.date || new Date().toLocaleDateString()}`, 120, 940);
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Credential ID: ${data.certId || 'QC-' + Math.random().toString(36).substr(2, 9).toUpperCase()}`, 120, 970);

    // Verified Stamp Right Side
    ctx.textAlign = 'right';
    ctx.font = '700 20px "Inter", sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText('✓ VERIFIED & SECURED', W - 120, 940);
    ctx.font = '400 16px "Inter", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('QuizCraft Pro Certification Engine', W - 120, 970);
  }

  static drawCorner(ctx, x, y, dx, dy) {
    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + dx * 10, y + dy * 45);
    ctx.lineTo(x + dx * 10, y + dy * 10);
    ctx.lineTo(x + dx * 45, y + dy * 10);
    ctx.stroke();
    ctx.restore();
  }

  static drawScoreBadge(ctx, x, y, percent, grade) {
    ctx.save();

    // Outer Badge Ring
    const grad = ctx.createLinearGradient(x - 70, y - 70, x + 70, y + 70);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(0.5, '#FBBF24');
    grad.addColorStop(1, '#D97706');

    ctx.beginPath();
    ctx.arc(x, y, 75, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = grad;
    ctx.stroke();

    // Inner Dotted Ring
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.arc(x, y, 64, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.stroke();
    ctx.setLineDash([]);

    // Percent & Grade Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FBBF24';
    ctx.font = '900 36px "Inter", sans-serif';
    ctx.fillText(`${percent}%`, x, y + 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillText(`GRADE ${grade}`, x, y + 32);

    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('SCORE', x, y - 36);

    ctx.restore();
  }

  /**
   * Download canvas image as high quality PNG
   */
  static downloadPNG(canvas, filename = 'Certificate-Achievement.png') {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  }
}
