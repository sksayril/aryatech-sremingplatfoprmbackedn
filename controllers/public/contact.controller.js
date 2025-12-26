const Contact = require('../../models/contact.model');

/**
 * Submit contact form (Public endpoint)
 */
exports.submitContact = async (req, res) => {
  try {
    const { Name, Email, Phone, Company, Subject, Message, Type, Source } = req.body;

    // Validate required fields
    if (!Name || !Email || !Message) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Message are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Create contact
    const contact = await Contact.create({
      Name,
      Email,
      Phone,
      Company,
      Subject,
      Message,
      Type: Type || 'sponsor',
      Source: Source || 'website',
      Status: 'new',
      IsReachedOut: false,
      Priority: 'medium',
    });

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        _id: contact._id,
        Name: contact.Name,
        Email: contact.Email,
        Status: contact.Status,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message,
    });
  }
};

