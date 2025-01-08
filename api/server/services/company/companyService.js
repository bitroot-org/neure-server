const db = require('../../../config/db');

const registerCompany = async (companyName, emailDomain) => {
    try {
        const [result] = await db.query(
            `INSERT INTO companies (company_name, email_domain) VALUES (?, ?)`,
            [companyName, emailDomain]
        );
        return { id: result.insertId, companyName, emailDomain };
    } catch (error) {
        throw error;
    }
};

module.exports = { registerCompany };
