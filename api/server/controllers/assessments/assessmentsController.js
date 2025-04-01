const AssessmentsService = require('../../services/assessments/assessmentsService');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

class AssessmentsController {
  static async getAllAssessments(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const { assessments, pagination } = await AssessmentsService.getAllAssessments(page, limit);

      return successResponse(res, 'Assessments retrieved successfully', { assessments, pagination });
    } catch (error) {
      return errorResponse(res, 'Error retrieving assessments', error);
    }
  }
  static async getAssessmentById(req, res) {
    try {
      const { id } = req.params;
      const assessment = await AssessmentsService.getAssessmentById(id);
      
      if (!assessment) {
        return errorResponse(res, 'Assessment not found', null, 404);
      }

      return successResponse(res, 'Assessment retrieved successfully', assessment);
    } catch (error) {
      return errorResponse(res, 'Error retrieving assessment', error);
    }
  }

  static async createAssessment(req, res) {
    console.log(req.body);
    try {
      const assessmentData = req.body;

      // Validate required fields
      if (!assessmentData.title || !assessmentData.frequency_days || !assessmentData.questions) {
        return errorResponse(res, 'Missing required fields', null, 400);
      }

      // Validate questions
      for (const question of assessmentData.questions) {
        if (!question.question_text || !question.question_type || !question.options) {
          return errorResponse(res, 'Invalid question format', null, 400);
        }

        if (!['single_choice', 'multiple_choice'].includes(question.question_type)) {
          return errorResponse(res, 'Invalid question type', null, 400);
        }

        // Validate options
        if (!Array.isArray(question.options) || question.options.length < 2) {
          return errorResponse(res, 'Each question must have at least 2 options', null, 400);
        }

        for (const option of question.options) {
          if (!option.option_text || typeof option.is_correct !== 'boolean') {
            return errorResponse(res, 'Invalid option format', null, 400);
          }
        }
      }

      const assessment = await AssessmentsService.createAssessment(assessmentData);
      return successResponse(res, 'Assessment created successfully', assessment, 201);
    } catch (error) {
      return errorResponse(res, 'Error creating assessment', error);
    }
  }

  static async updateAssessment(req, res) {
    try {
      const { id } = req.body;
      const assessmentData = req.body;

      // Validate required fields
      if (!assessmentData.title || !assessmentData.frequency_days || !assessmentData.questions) {
        return errorResponse(res, 'Missing required fields', null, 400);
      }

      // Validate questions
      for (const question of assessmentData.questions) {
        if (!question.question_text || !question.question_type || !question.options) {
          return errorResponse(res, 'Invalid question format', null, 400);
        }

        if (!['single_choice', 'multiple_choice'].includes(question.question_type)) {
          return errorResponse(res, 'Invalid question type', null, 400);
        }

        // Validate options
        if (!Array.isArray(question.options) || question.options.length < 2) {
          return errorResponse(res, 'Each question must have at least 2 options', null, 400);
        }

        for (const option of question.options) {
          if (!option.option_text || typeof option.is_correct !== 'boolean') {
            return errorResponse(res, 'Invalid option format', null, 400);
          }
        }
      }

      const updatedAssessment = await AssessmentsService.updateAssessment(id, assessmentData);
      return successResponse(res, 'Assessment updated successfully', updatedAssessment);
    } catch (error) {
      return errorResponse(res, 'Error updating assessment', error);
    }
  }

  static async deleteAssessment(req, res) {
    try {
      const { id } = req.params;
      console.log("id", id);
      if (!id) {
        return errorResponse(res, 'Assessment ID is required', null, 400);
      }

      const result = await AssessmentsService.deleteAssessment(id);
      return successResponse(res, result.message, result.data);
    } catch (error) {
      if (error.message === 'Assessment not found or already deleted') {
        return errorResponse(res, error.message, null, 404);
      }
      return errorResponse(res, 'Error deleting assessment', error);
    }
  }
}

module.exports = AssessmentsController;