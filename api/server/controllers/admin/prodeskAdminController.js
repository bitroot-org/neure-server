const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const {
  getOverviewService, getRevenueService, getActiveUsersService, getDiscontinuedUsersService,
  getTherapistsService, getFeedbackService, updateFeedbackStatusService, getDeactivatedAccountsService,
  createOfferTagService, getOfferTagsService, createOfferService, uploadOfferEmailsService,
  getOffersService, getOfferDetailService, updateOfferService,
  getReferralsService, getReferralDetailService, getPendingPayoutsService, processPayoutService,
  getSessionsAdminService, getSubscriptionsAdminService,
  getSubscriptionDetailService, getPaymentsService, getPaymentDetailService,
  getTherapistByIdService
} = require('../../services/admin/prodeskAdminService');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};

class ProdeskAdminController {

  static async getOverview(req, res) {
    try {
      return respond(res, await getOverviewService());
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getRevenue(req, res) {
    try {
      const { start_date, end_date } = req.body;
      return respond(res, await getRevenueService({ start_date, end_date }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getActiveUsers(req, res) {
    try {
      return respond(res, await getActiveUsersService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getDiscontinuedUsers(req, res) {
    try {
      return respond(res, await getDiscontinuedUsersService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getTherapists(req, res) {
    try {
      return respond(res, await getTherapistsService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getFeedback(req, res) {
    try {
      return respond(res, await getFeedbackService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateFeedbackStatus(req, res) {
    try {
      return respond(res, await updateFeedbackStatusService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getDeactivatedAccounts(req, res) {
    try {
      return respond(res, await getDeactivatedAccountsService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createOfferTag(req, res) {
    try {
      return respond(res, await createOfferTagService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getOfferTags(req, res) {
    try {
      return respond(res, await getOfferTagsService());
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async createOffer(req, res) {
    try {
      return respond(res, await createOfferService({ ...req.body, admin_id: req.user.user_id }));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async uploadOfferEmails(req, res) {
    try {
      const { offer_id } = req.body;
      if (!req.file) return res.status(400).json({ status: false, code: 400, message: 'CSV file is required', data: null });
      if (!offer_id) return res.status(400).json({ status: false, code: 400, message: 'offer_id is required', data: null });

      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const records = csv.parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
      fs.unlinkSync(req.file.path);

      const emails = records.map(r => r.email).filter(Boolean);
      return respond(res, await uploadOfferEmailsService({ offer_id: parseInt(offer_id), emails }));
    } catch (e) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSampleCsv(req, res) {
    try {
      const samplePath = path.join(__dirname, '../../../../assests/sample_offer_emails.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="offer_emails_sample.csv"');
      return res.sendFile(path.resolve(samplePath));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getOffers(req, res) {
    try {
      return respond(res, await getOffersService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getOfferDetail(req, res) {
    try {
      return respond(res, await getOfferDetailService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async updateOffer(req, res) {
    try {
      return respond(res, await updateOfferService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getReferrals(req, res) {
    try {
      return respond(res, await getReferralsService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getReferralDetail(req, res) {
    try {
      return respond(res, await getReferralDetailService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getPendingPayouts(req, res) {
    try {
      return respond(res, await getPendingPayoutsService());
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async processPayout(req, res) {
    try {
      return respond(res, await processPayoutService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSessions(req, res) {
    try {
      return respond(res, await getSessionsAdminService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSubscriptions(req, res) {
    try {
      return respond(res, await getSubscriptionsAdminService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getSubscriptionDetail(req, res) {
    try {
      return respond(res, await getSubscriptionDetailService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getPayments(req, res) {
    try {
      return respond(res, await getPaymentsService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getPaymentDetail(req, res) {
    try {
      return respond(res, await getPaymentDetailService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }

  static async getTherapistById(req, res) {
    try {
      return respond(res, await getTherapistByIdService(req.body));
    } catch (e) {
      return res.status(500).json({ status: false, code: 500, message: e.message, data: null });
    }
  }
}

module.exports = ProdeskAdminController;
