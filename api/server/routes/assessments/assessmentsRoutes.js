const express = require('express');
const AssessmentsController = require('../../controllers/assessments/assessmentsController');
const { authorization } = require('../../../auth/tokenValidator.js');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

const router = express.Router();

// Specific routes first
router.get('/getAllAssessments', authorization, AssessmentsController.getAllAssessments);
router.get('/list', authorization, AssessmentsController.getAssessmentsList);
router.get('/completionLists', authorization, AssessmentsController.getAssessmentCompletionList);
router.get('/responses/:assessment_id', authorization, AssessmentsController.getUserAssessmentResponses);
router.get('/getAssessmentCompletionList', authorization, AssessmentsController.getAssessmentCompletionList);
router.get('/user-submissions', authorization, AssessmentsController.getUserSubmittedAssessments);
 
// Parameter routes last
router.get('/:id', authorization, AssessmentsController.getAssessmentById);
router.get('/generateAssessmentPdf/:assessment_id', authorization, AssessmentsController.generateAssessmentPdf);

// POST, PUT, DELETE routes
router.post('/createAssessment', authorization, AssessmentsController.createAssessment);
router.put('/updateAssessment', authorization, AssessmentsController.updateAssessment);
router.delete('/deleteAssessment/:id', authorization, AssessmentsController.deleteAssessment);
router.post('/submit', authorization, AssessmentsController.submitAssessment);

module.exports = router;
