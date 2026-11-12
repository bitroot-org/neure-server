const Catalog = require('../../services/prodesk/serviceCatalogService');
const Intake = require('../../services/prodesk/intakeFormService');
const Purchase = require('../../services/prodesk/servicePurchaseService');
const Consent = require('../../services/prodesk/consentFormService');
const { createReadStream, unlinkSync } = require('fs');
const { nanoid } = require('nanoid');
const { s3Client } = require('../../../config/s3Client.js');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getActivityService } = require('../../services/prodesk/activityLogService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

// The caller's identity always comes from the token. Anything the body says about it is overwritten.
const clientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  return ((fwd ? fwd.split(',')[0].trim() : req.ip || '') || '').replace(/^::ffff:/, '').slice(0, 64) || null;
};
const ctx = (req) => ({ ...req.body, therapist_id: req.user.therapist_id, actor_user_id: req.user.user_id, ip_address: clientIp(req) });

const handler = (fn) => async (req, res) => {
  try { return respond(res, await fn(ctx(req))); }
  catch (e) { console.log('serviceController error::>>', e); return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null }); }
};

class ServiceController {
  // Services + packages
  static getServices = handler(Catalog.getServicesService);
  static getServiceById = handler(Catalog.getServiceByIdService);
  static createService = handler(Catalog.createServiceService);
  static updateService = handler(Catalog.updateServiceService);
  static deleteService = handler(Catalog.deleteServiceService);

  // Intake forms
  static getIntakeForms = handler(Intake.getFormsService);
  static getIntakeFormById = handler(Intake.getFormByIdService);
  static createIntakeForm = handler(Intake.createFormService);
  static updateIntakeForm = handler(Intake.updateFormService);
  static deleteIntakeForm = handler(Intake.deleteFormService);
  static getIntakeResponses = handler(Intake.getResponsesService);

  // Consent (agreement) forms
  static getConsentForms = handler(Consent.getConsentFormsService);
  static getConsentFormById = handler(Consent.getConsentFormByIdService);
  static createConsentForm = handler(Consent.createConsentFormService);
  static updateConsentForm = handler(Consent.updateConsentFormService);
  static deleteConsentForm = handler(Consent.deleteConsentFormService);

  // Agreement PDF: stored in S3, the returned URL is then sent with create / update
  static async uploadConsentFile(req, res) {
    try {
      const f = req.file;
      if (!f || f.mimetype !== 'application/pdf') {
        if (f) try { unlinkSync(f.path); } catch (_) {}
        return res.status(400).json({ status: false, code: 400, message: 'A PDF file is required', data: null });
      }
      const key = `consents/${req.user.therapist_id}/${nanoid()}.pdf`;
      await s3Client.send(new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: createReadStream(f.path), ContentType: 'application/pdf' }));
      unlinkSync(f.path);
      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return res.status(200).json({ status: true, code: 200, message: 'Uploaded', data: { url } });
    } catch (e) {
      console.log('uploadConsentFile error::>>', e);
      return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
    }
  }

  // Purchases (what clients booked) + direct-payment verification
  static getBookingRequirements = handler(Purchase.getRequirementsService);
  static getServicePurchases = handler(Purchase.getPurchasesService);
  static getServicePurchaseById = handler(Purchase.getPurchaseByIdService);
  static createServicePurchase = handler(Purchase.createPurchaseService);
  static confirmDirectPayment = handler(Purchase.confirmDirectPaymentService);
  static cancelServicePurchase = handler(Purchase.cancelPurchaseService);
  static bookPurchaseSession = handler(Purchase.bookPurchaseSessionService);

  // History
  static getActivity = handler(getActivityService);
}

module.exports = ServiceController;
