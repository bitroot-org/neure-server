const {
    getNotificationAndAnnouncementsService,
} = require('../../services/notifications/notificationService');

class NotificationController {
    static async getNotificationAndAnnouncements(req, res) {
        try {
            const { company_id, is_announcements, is_notification } = req.body;

            // Validate payload
            if (!company_id) {
                return res.status(400).json({
                    status: false,
                    code: 400,
                    message: 'Company ID is required',
                });
            }

            // Fetch data from the service
            const result = await getNotificationAndAnnouncementsService({
                company_id,
                is_announcements,
                is_notification,
            });

            if (result) {
                return res.status(200).json({
                    status: true,
                    code: 200,
                    message: 'Data retrieved successfully',
                    data: result,
                });
            } else {
                return res.status(404).json({
                    status: false,
                    code: 404,
                    message: 'No data found for the given criteria',
                });
            }
        } catch (error) {
            console.error('Error in fetching notifications and announcements:', error.message);
            return res.status(500).json({
                status: false,
                code: 500,
                message: 'Internal server error',
            });
        }
    }

}

module.exports = NotificationController;
