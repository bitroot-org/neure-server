const CompanyReportPdfService = require('../../services/pdf/companyReportPdfService');

class ReportController {
  static async generateWellbeingReport(req, res) {
    try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;
      
      // Validate inputs
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null
        });
      }
      
      // Set default date range if not provided
      const today = new Date();
      const defaultEndDate = today.toISOString().split('T')[0];
      
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(today.getMonth() - 1);
      const formattedStartDate = defaultStartDate.toISOString().split('T')[0];
      
      const finalStartDate = start_date || formattedStartDate;
      const finalEndDate = end_date || defaultEndDate;
      
      // Generate the report with 'blob' return type to get the buffer directly
      const result = await CompanyReportPdfService.generateWellbeingReport(
        company_id,
        finalStartDate,
        finalEndDate,
        'blob' // Add this parameter to request binary data
      );
      
      // Convert buffer to base64 string
      const pdfBase64 = result.data.pdfBuffer.toString('base64');
      
      // Return JSON response with status and base64 data
      return res.status(200).json({
        status: true,
        code: 200,
        message: "Well-being report generated successfully",
        data: {
          filename: `wellbeing_report_${company_id}.pdf`,
          contentType: 'application/pdf',
          base64Data: pdfBase64
        }
      });
    } catch (error) {
      console.error('Error generating well-being report:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  static async emailWellbeingReport(req, res) {
    try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;
      
      console.log('Received request to email well-being report:', { company_id, start_date, end_date });
      
      // Validate inputs
      if (!company_id) {
        return res.status(400).json({
          status: false,
          code: 400,
          message: "Company ID is required",
          data: null
        });
      }
      
      // Set default date range if not provided
      const today = new Date();
      const defaultEndDate = today.toISOString().split('T')[0];
      
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(today.getMonth() - 1);
      const formattedStartDate = defaultStartDate.toISOString().split('T')[0];
      
      const finalStartDate = start_date || formattedStartDate;
      const finalEndDate = end_date || defaultEndDate;
      
      // Generate and email the report
      const result = await CompanyReportPdfService.emailWellbeingReport(
        company_id,
        finalStartDate,
        finalEndDate
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error emailing well-being report:', error);
      return res.status(500).json({
        status: false,
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = ReportController;
