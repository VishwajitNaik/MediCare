import { NextResponse } from 'next/server';
import DoctorLeave from '../../../../../models/DoctorLeave';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

// GET - Get doctor's leave records
export async function GET(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const leaves = await DoctorLeave.find({
      doctorId: doctor.id,
      $or: [
        { isCancelled: false },
        { isCancelled: { $exists: false } }
      ]
    })
      .sort({ startDate: -1 })
      .lean();

    // Format leave data for frontend
    const formattedLeaves = leaves.map(leave => ({
      id: leave._id,
      startDate: leave.startDate.toISOString().split('T')[0],
      endDate: leave.endDate.toISOString().split('T')[0],
      reason: leave.reason,
      type: leave.type,
      isApproved: leave.isApproved,
      isEmergency: leave.isEmergency,
      notes: leave.notes,
      createdAt: leave.createdAt,
      approvedAt: leave.approvedAt,
      approvalStatus: getApprovalStatus(leave)
    }));

    return NextResponse.json({
      success: true,
      data: {
        leaves: formattedLeaves
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor leaves GET error:', error);
    return NextResponse.json({
      error: 'Failed to fetch leaves',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Add new leave request
export async function POST(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const { startDate, endDate, reason, type, isEmergency } = await request.json();

    // Validate required fields
    if (!startDate || !endDate || !reason || !type) {
      return NextResponse.json({
        error: 'Start date, end date, reason, and type are required'
      }, { status: 400 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > end) {
      return NextResponse.json({
        error: 'Start date cannot be after end date'
      }, { status: 400 });
    }

    if (start < today) {
      return NextResponse.json({
        error: 'Cannot request leave for past dates'
      }, { status: 400 });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await DoctorLeave.findOne({
      doctorId: doctor.id,
      $or: [
        { isCancelled: false },
        { isCancelled: { $exists: false } }
      ],
      $or: [
        // New leave starts during existing leave
        { startDate: { $lte: start }, endDate: { $gte: start } },
        // New leave ends during existing leave
        { startDate: { $lte: end }, endDate: { $gte: end } },
        // New leave completely contains existing leave
        { startDate: { $gte: start }, endDate: { $lte: end } }
      ]
    });

    if (overlappingLeave) {
      return NextResponse.json({
        error: 'You already have a leave request for these dates'
      }, { status: 409 });
    }

    // Create leave request
    const leave = new DoctorLeave({
      doctorId: doctor.id,
      requestedBy: doctor.id,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      type,
      isEmergency: isEmergency || false,
      isApproved: isEmergency ? true : false, // Emergency leaves are auto-approved
      approvedAt: isEmergency ? new Date() : undefined
    });

    await leave.save();

    return NextResponse.json({
      success: true,
      message: isEmergency
        ? 'Emergency leave approved automatically'
        : 'Leave request submitted for approval',
      data: {
        leave: {
          id: leave._id,
          startDate: leave.startDate.toISOString().split('T')[0],
          endDate: leave.endDate.toISOString().split('T')[0],
          reason: leave.reason,
          type: leave.type,
          isApproved: leave.isApproved,
          isEmergency: leave.isEmergency,
          createdAt: leave.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor leaves POST error:', error);
    return NextResponse.json({
      error: 'Failed to create leave request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT - Cancel a leave request (only if not approved)
export async function PUT(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const { leaveId, cancellationReason } = await request.json();

    if (!leaveId) {
      return NextResponse.json({
        error: 'Leave ID is required'
      }, { status: 400 });
    }

    // Find and update the leave
    const leave = await DoctorLeave.findOne({
      _id: leaveId,
      doctorId: doctor.id,
      $or: [
        { isCancelled: false },
        { isCancelled: { $exists: false } }
      ]
    });

    if (!leave) {
      return NextResponse.json({
        error: 'Leave request not found'
      }, { status: 404 });
    }

    if (leave.isApproved) {
      return NextResponse.json({
        error: 'Cannot cancel approved leave requests'
      }, { status: 400 });
    }

    // Cancel the leave
    leave.isCancelled = true;
    leave.cancelledAt = new Date();
    leave.cancellationReason = cancellationReason;
    await leave.save();

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor leaves PUT error:', error);
    return NextResponse.json({
      error: 'Failed to cancel leave request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to get approval status
function getApprovalStatus(leave) {
  if (leave.isEmergency) return 'Auto-Approved (Emergency)';
  if (leave.isApproved) return 'Approved';
  if (leave.isCancelled) return 'Cancelled';
  return 'Pending Approval';
}
