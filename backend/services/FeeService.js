const PDFDocument = require('pdfkit');
const FeeRepository = require('../repositories/FeeRepository');
const StudentRepository = require('../repositories/StudentRepository');
const { FeeCalculationContext, RegularFeeStrategy, ScholarshipFeeStrategy } = require('../patterns/strategies/FeeCalculationStrategy');
const { notificationDispatcher } = require('../patterns/observers');

class FeeService {
  constructor() {
    this.feeRepo = new FeeRepository();
    this.studentRepo = new StudentRepository();
    this.regularStrategy = new RegularFeeStrategy();
    this.scholarshipStrategy = new ScholarshipFeeStrategy();
    this.feeContext = new FeeCalculationContext(this.regularStrategy);
  }

  async generateFeeVoucher({ studentId, title, semester, baseAmount, discountType = 'regular', discountCriteria = {}, dueDate }) {
    if (discountType === 'scholarship' || discountCriteria.gpa || discountCriteria.needBased) {
      this.feeContext.setStrategy(this.scholarshipStrategy);
    } else {
      this.feeContext.setStrategy(this.regularStrategy);
    }

    const calcResult = this.feeContext.execute(baseAmount, discountCriteria);

    const fee = await this.feeRepo.create({
      student_id: studentId,
      title,
      semester,
      base_amount: calcResult.baseAmount,
      discount_type: calcResult.discountType,
      discount_amount: calcResult.discountAmount,
      final_amount: calcResult.finalAmount,
      status: 'pending',
      due_date: dueDate
    });

    // Notify student via Observer pattern
    const student = await this.studentRepo.findById(studentId);
    if (student) {
      await notificationDispatcher.notify('FEE_GENERATED', {
        studentUserId: student.user_id,
        title: `Fee Challan Issued: ${title}`,
        message: `Your semester fee voucher of PKR ${calcResult.finalAmount.toLocaleString()} has been generated. Due Date: ${dueDate}`,
        type: 'info'
      });
    }

    return fee;
  }

  async generateChallanPDF(feeId) {
    const fee = await this.feeRepo.findByIdWithDetails(feeId);
    if (!fee) {
      throw new Error('Fee voucher not found');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            filename: `Challan_${fee.reg_no || fee.id}_Sem${fee.semester}.pdf`
          });
        });

        // Bank / University copies format
        const renderCopy = (copyTitle, yOffset) => {
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
             .text('UNIVERSITY OF ENGINEERING & COMPUTER SCIENCES', 40, yOffset, { align: 'center' });
          doc.fontSize(10).font('Helvetica').fillColor('#475569')
             .text(`FEE DEPOSIT CHALLAN - ${copyTitle.toUpperCase()}`, 40, yOffset + 18, { align: 'center' });
          doc.fontSize(8).fillColor('#64748b')
             .text('Bank Alfalah / HBL - Account # 1002-394857-010', 40, yOffset + 32, { align: 'center' });

          doc.rect(40, yOffset + 48, doc.page.width - 80, 150).strokeColor('#cbd5e1').stroke();

          // Details grid
          const col1 = 55;
          const col2 = 200;
          const col3 = 340;
          const col4 = 440;

          doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
          doc.text('Challan No:', col1, yOffset + 58);
          doc.font('Helvetica').text(`CH-${String(fee.id).padStart(6, '0')}`, col2, yOffset + 58);

          doc.font('Helvetica-Bold').text('Issue Date:', col3, yOffset + 58);
          doc.font('Helvetica').text(new Date().toISOString().split('T')[0], col4, yOffset + 58);

          doc.font('Helvetica-Bold').text('Student Name:', col1, yOffset + 75);
          doc.font('Helvetica').text(fee.student_name || 'Student', col2, yOffset + 75);

          doc.font('Helvetica-Bold').text('Due Date:', col3, yOffset + 75);
          doc.font('Helvetica').fillColor('#dc2626').text(fee.due_date, col4, yOffset + 75);

          doc.fillColor('#1e293b').font('Helvetica-Bold').text('Registration No:', col1, yOffset + 92);
          doc.font('Helvetica').text(fee.reg_no || '-', col2, yOffset + 92);

          doc.font('Helvetica-Bold').text('Class & Section:', col3, yOffset + 92);
          doc.font('Helvetica').text(fee.class_name || `Semester ${fee.semester}`, col4, yOffset + 92);

          doc.font('Helvetica-Bold').text('Fee Description:', col1, yOffset + 109);
          doc.font('Helvetica').text(fee.title, col2, yOffset + 109);

          doc.font('Helvetica-Bold').text('Payment Status:', col3, yOffset + 109);
          doc.font('Helvetica-Bold')
             .fillColor(fee.status === 'paid' ? '#16a34a' : '#d97706')
             .text(fee.status.toUpperCase(), col4, yOffset + 109);

          // Amounts
          doc.fillColor('#1e293b');
          doc.font('Helvetica').text(`Tuition / Base Fee: PKR ${fee.base_amount.toLocaleString()}`, col1, yOffset + 130);
          if (fee.discount_amount > 0) {
            doc.text(`Scholarship / Discount: -PKR ${fee.discount_amount.toLocaleString()} (${fee.discount_type})`, col1, yOffset + 145);
          }
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af')
             .text(`Total Payable: PKR ${fee.final_amount.toLocaleString()}`, col1, yOffset + 165);

          // Signatures
          doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
          doc.text('Student Signature ____________________', 60, yOffset + 185);
          doc.text('Bank Officer / Cashier ____________________', 350, yOffset + 185);
        };

        // Bank Copy
        renderCopy('Student Copy', 40);

        // Divider
        doc.dash(5, { space: 3 });
        doc.moveTo(40, 290).lineTo(doc.page.width - 40, 290).strokeColor('#94a3b8').stroke();
        doc.undash();

        // University / Bank Copy
        renderCopy('University Accounts Copy', 310);

        // Divider
        doc.dash(5, { space: 3 });
        doc.moveTo(40, 560).lineTo(doc.page.width - 40, 560).strokeColor('#94a3b8').stroke();
        doc.undash();

        // Bank Copy
        renderCopy('Bank Branch Copy', 580);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = FeeService;
