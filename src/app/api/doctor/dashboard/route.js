import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import Patient from '../../../../models/Patient';
import Prescription from '../../../../models/Prescription';
import Appointment from '../../../../models/Appointment';
import connectDB from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    // Get current date for filtering
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Parallel database queries for better performance
    const [
      totalPatients,
      todaysAppointments,
      pendingPrescriptions,
      upcomingAppointments
    ] = await Promise.all([
      // Total patients created by this doctor
      Patient.countDocuments({ createdBy: user.id }),

      // Today's appointments for this doctor
      Appointment.countDocuments({
        doctorId: user.id,
        date: {
          $gte: todayStart,
          $lt: todayEnd
        },
        status: 'scheduled'
      }),

      // Pending prescriptions created by this doctor
      Prescription.countDocuments({
        doctor: user.id,
        fulfilled: false
      }),

      // Upcoming appointments (next 7 days) for this doctor
      Appointment.countDocuments({
        doctorId: user.id,
        date: {
          $gte: todayEnd,
          $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        status: 'scheduled'
      })
    ]);

    // Calculate patient satisfaction (mock calculation based on completed appointments)
    const completedAppointments = await Appointment.countDocuments({
      doctorId: user.id,
      status: 'completed'
    });
    const totalAppointments = await Appointment.countDocuments({
      doctorId: user.id,
      status: { $in: ['completed', 'cancelled', 'no-show'] }
    });
    const patientSatisfaction = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 95;

    const stats = {
      totalPatients,
      todaysAppointments,
      pendingPrescriptions,
      upcomingAppointments,
      patientSatisfaction
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
