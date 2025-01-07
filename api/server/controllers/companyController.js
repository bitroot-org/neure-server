const companyService = require('../services/companyService');


const registerCompany = async (req, res) => {
    const { companyName, emailDomain } = req.body;

    if (!companyName || !emailDomain) {
        return res.status(400).json({ message: 'Company name and email domain are required.' });
    }

    try {
        const newCompany = await companyService.registerCompany(companyName, emailDomain);
        res.status(201).json({ message: 'Company registered successfully!', data: newCompany });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while registering the company.' });
    }
};

module.exports = { registerCompany };