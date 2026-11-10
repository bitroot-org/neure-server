const Catalog = require('../../services/prodesk/serviceCatalogService');
const Intake = require('../../services/prodesk/intakeFormService');
const Purchase = require('../../services/prodesk/servicePurchaseService');
const { getActivityService } = require('../../services/prodesk/activityLogService');
const { convertDatesToIST } = require('../../utils/dateHelper');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json({ ...result, data: convertDatesToIST(result.data) });
};

// The caller's identity always comes from the token. Anything the body says about it is overwritten.
const ctx = (req) => ({ ...req.body, therapist_id: req.user.therapist_id, actor_user_id: req.user.user_id });

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

  // Purchases (what clients booked) + direct-payment verification
  static getServicePurchases = handler(Purchase.getPurchasesService);
  static getServicePurchaseById = handler(Purchase.getPurchaseByIdService);
  static createServicePurchase = handler(Purchase.createPurchaseService);
  static confirmDirectPayment = handler(Purchase.confirmDirectPaymentService);
  static rejectDirectPayment = handler(Purchase.rejectDirectPaymentService);
  static cancelServicePurchase = handler(Purchase.cancelPurchaseService);
  static bookPurchaseSession = handler(Purchase.bookPurchaseSessionService);

  // History
  static getActivity = handler(getActivityService);
}

module.exports = ServiceController;
