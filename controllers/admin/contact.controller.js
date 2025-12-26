const Contact = require('../../models/contact.model');

/**
 * Get all contacts with filtering and pagination
 */
exports.getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, type, isReachedOut, priority } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.Status = status;
    }

    // Filter by type
    if (type) {
      query.Type = type;
    }

    // Filter by reached out status
    if (isReachedOut !== undefined) {
      query.IsReachedOut = isReachedOut === 'true';
    }

    // Filter by priority
    if (priority) {
      query.Priority = priority;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
        { Company: { $regex: search, $options: 'i' } },
        { Subject: { $regex: search, $options: 'i' } },
        { Message: { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(query)
      .populate('ReachedOutBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: error.message,
    });
  }
};

/**
 * Get contact by ID
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('ReachedOutBy', 'Name Email')
      .populate('AdminNotes.CreatedBy', 'Name Email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact',
      error: error.message,
    });
  }
};

/**
 * Update contact status and mark as reached out
 */
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status, IsReachedOut, Notes, Priority } = req.body;

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    // Update status
    if (Status) {
      contact.Status = Status;
    }

    // Update reached out status
    if (IsReachedOut !== undefined) {
      contact.IsReachedOut = IsReachedOut;
      if (IsReachedOut && !contact.ReachedOutAt) {
        contact.ReachedOutAt = new Date();
        contact.ReachedOutBy = req.user._id;
      }
    }

    // Update notes
    if (Notes !== undefined) {
      contact.Notes = Notes;
    }

    // Update priority
    if (Priority) {
      contact.Priority = Priority;
    }

    await contact.save();

    await contact.populate('ReachedOutBy', 'Name Email');

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message,
    });
  }
};

/**
 * Add admin note to contact
 */
exports.addAdminNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { Note } = req.body;

    if (!Note || !Note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note is required',
      });
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    contact.AdminNotes.push({
      Note: Note.trim(),
      CreatedBy: req.user._id,
    });

    await contact.save();

    await contact.populate('AdminNotes.CreatedBy', 'Name Email');

    res.json({
      success: true,
      message: 'Note added successfully',
      data: contact,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
};

/**
 * Delete contact
 */
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message,
    });
  }
};

/**
 * Get contact statistics
 */
exports.getContactStats = async (req, res) => {
  try {
    const stats = {
      total: await Contact.countDocuments(),
      new: await Contact.countDocuments({ Status: 'new' }),
      contacted: await Contact.countDocuments({ Status: 'contacted' }),
      replied: await Contact.countDocuments({ Status: 'replied' }),
      resolved: await Contact.countDocuments({ Status: 'resolved' }),
      archived: await Contact.countDocuments({ Status: 'archived' }),
      reachedOut: await Contact.countDocuments({ IsReachedOut: true }),
      notReachedOut: await Contact.countDocuments({ IsReachedOut: false }),
      byType: {
        sponsor: await Contact.countDocuments({ Type: 'sponsor' }),
        general: await Contact.countDocuments({ Type: 'general' }),
        support: await Contact.countDocuments({ Type: 'support' }),
        partnership: await Contact.countDocuments({ Type: 'partnership' }),
      },
      byPriority: {
        low: await Contact.countDocuments({ Priority: 'low' }),
        medium: await Contact.countDocuments({ Priority: 'medium' }),
        high: await Contact.countDocuments({ Priority: 'high' }),
        urgent: await Contact.countDocuments({ Priority: 'urgent' }),
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message,
    });
  }
};

