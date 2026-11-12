const Page = require('../../services/prodesk/bookingPageService');
const { uploadImage } = require('../upload/UploadController');

const respond = (res, result) => {
  if (!result) return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
  return res.status(result.code).json(result);
};
// identity always comes from the token
const ctx = (req) => ({ ...req.body, therapist_id: req.user.therapist_id, actor_user_id: req.user.user_id });
const handler = (fn) => async (req, res) => {
  try { return respond(res, await fn(ctx(req))); }
  catch (e) { console.log('bookingPageController error::>>', e); return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null }); }
};

class BookingPageController {
  static getBookingPageContent = handler(Page.getBookingPageContentService);
  static deleteGalleryImage = handler(Page.deleteGalleryImageService);
  static saveReview = handler(Page.saveReviewService);
  static deleteReview = handler(Page.deleteReviewService);

  // The picture goes to S3 first (same upload code as profile pictures), then is added to the gallery
  static async addGalleryImage(req, res) {
    try {
      if (!req.file || !req.file.mimetype.startsWith('image/')) return res.status(400).json({ status: false, code: 400, message: 'An image file is required', data: null });
      req.body.type = 'profile';
      const up = await uploadImage(req);
      if (!up || !up.url) return res.status(500).json({ status: false, code: 500, message: 'Upload failed', data: null });
      return respond(res, await Page.addGalleryImageService({ therapist_id: req.user.therapist_id, actor_user_id: req.user.user_id, image_url: up.url }));
    } catch (e) {
      console.log('addGalleryImage error::>>', e);
      return res.status(500).json({ status: false, code: 500, message: 'Internal server error', data: null });
    }
  }
}

module.exports = BookingPageController;
