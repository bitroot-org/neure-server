const AssessmentsService = require('../../services/assessments/assessmentsService');
const { successResponse, errorResponse } = require('../../utils/responseHandler');

class AssessmentsController {
  static async getAllAssessments(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const all = req.query.all === 'true';
      const { user_id } = req.user; // Get user_id from JWT token

      const { assessments, pagination } = await AssessmentsService.getAllAssessments(page, limit, user_id, all);

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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can create assessments",
          data: null,
        });
      }
      
      const assessmentData = req.body;

      // Validate required fields - removed frequency_days
      if (!assessmentData.title || !assessmentData.questions) {
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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can update assessments",
          data: null,
        });
      }

      const { id } = req.body;
      const assessmentData = req.body;

      // Validate required fields - removed frequency_days
      if (!assessmentData.title || !assessmentData.questions) {
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
      // Check if user is superadmin (role_id = 1)
      const { role_id } = req.user;
      if (role_id !== 1) {
        return res.status(403).json({
          status: false,
          code: 403,
          message: "Access denied. Only superadmins can delete articles",
          data: null,
        });
      }

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

  static async submitAssessment(req, res) {
    try {
      const { assessment_id, responses, company_id } = req.body;
      const { user_id } = req.user;

      console.log("user_id", user_id);

      // Validate required fields
      if (!assessment_id || !responses || !Array.isArray(responses)) {
        return errorResponse(res, 'Invalid submission format', null, 400);
      }

      // Validate responses format
      for (const response of responses) {
        if (!response.question_id || !response.selected_options || !Array.isArray(response.selected_options)) {
          return errorResponse(res, 'Invalid response format', null, 400);
        }
      }

      const result = await AssessmentsService.submitAssessment({
        user_id,
        company_id,
        assessment_id,
        responses
      });

      return successResponse(res, 'Assessment submitted successfully', result);
    } catch (error) {
      if (error.message === 'Assessment not found' || error.message === 'Assessment already submitted') {
        return errorResponse(res, error.message, null, 400);
      }
      return errorResponse(res, 'Error submitting assessment', error);
    }
  }

  static async getAssessmentsList(req, res) {
    try {
      const result = await AssessmentsService.getAssessmentsList();
      return res.status(result.code).json(result);
    } catch (error) {
      return errorResponse(res, 'Error retrieving assessment list', error);
    }
  }

  static async getUserAssessmentResponses(req, res) {
    try {
      const { assessment_id } = req.params;
      const { user_id } = req.query; 

      console.log("user_id", user_id);
      console.log("assessment_id", assessment_id);
      
      // Check if assessment_id is provided
      if (!assessment_id) {
        return errorResponse(res, 'Assessment ID is required', null, 400);
      }
      
      // Check if user_id is provided
      if (!user_id) {
        return errorResponse(res, 'User ID is required', null, 400);
      }
      
      // Verify the requester is authorized to access this data
      // Option 1: Check if requester is the same user (accessing their own data)
      // Option 2: Check if requester is a superadmin (role_id = 1)
      const requesterId = req.user.user_id;
      const requesterRole = req.user.role_id;
      
      // Only allow access if the requester is the same user or a superadmin
      if (requesterId !== parseInt(user_id) && requesterRole !== 1) {
        return errorResponse(res, 'Unauthorized access', null, 403);
      }
      
      const result = await AssessmentsService.getUserAssessmentResponses(user_id, assessment_id);
      return successResponse(res, 'User assessment responses retrieved successfully', result.data);
    } catch (error) {
      if (error.message === 'Assessment not submitted by this user') {
        return errorResponse(res, error.message, null, 404);
      }
      return errorResponse(res, 'Error retrieving user assessment responses', error);
    }
  }

  static async getAssessmentCompletionList(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        company_id = null, 
        assessment_id = null 
      } = req.query;
      
      // Parse IDs to integers if provided
      const parsedCompanyId = company_id ? parseInt(company_id) : null;
      const parsedAssessmentId = assessment_id ? parseInt(assessment_id) : null;
      
      const result = await AssessmentsService.getAssessmentCompletionList({
        page: parseInt(page),
        limit: parseInt(limit),
        company_id: parsedCompanyId,
        assessment_id: parsedAssessmentId
      });
      
      // Use successResponse helper instead of direct res.status().json()
      return successResponse(res, 'Assessment completion list retrieved successfully', {
        completions: result.data || [],
        pagination: result.pagination || {
          total: 0,
          current_page: parseInt(page),
          total_pages: 0,
          per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error("Error in getAssessmentCompletionList controller:", error);
      return errorResponse(res, 'Error retrieving assessment completion list', error);
    }
  }
}

module.exports = AssessmentsController;
