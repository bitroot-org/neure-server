const express = require('express');
const AssessmentsController = require('../../controllers/assessments/assessmentsController');
const { authorization } = require('../../../auth/tokenValidator.js');

const router = express.Router();

router.get('/getAllAssessments', authorization, AssessmentsController.getAllAssessments);
router.get('/:id', authorization, AssessmentsController.getAssessmentById);
router.post('/createAssessment', authorization, AssessmentsController.createAssessment);
router.put('/updateAssessment', authorization, AssessmentsController.updateAssessment);
router.delete('/deleteAssessment/:id', authorization, AssessmentsController.deleteAssessment);

module.exports = router;