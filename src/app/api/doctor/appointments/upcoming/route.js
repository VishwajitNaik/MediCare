import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import Appointment from '../../../../../models/Appointment';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    // Get current date for filtering upcoming appointments
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Fetch upcoming appointments (today and next 7 days)
    const appointments = await Appointment.find({
      doctorId: user.id,
      date: {
        $gte: todayStart,
        $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      status: 'scheduled'
    })
    .populate('patientId', 'name age gender mobile')
    .sort({ date: 1, startTime: 1 })
    .limit(10); // Limit to 10 upcoming appointments

    // Format the appointments for the dashboard
    const formattedAppointments = appointments.map(apt => ({
      id: apt._id,
      time: apt.startTime,
      patient: apt.patientId?.name || 'Unknown Patient',
      type: apt.type || 'Consultation',
      date: apt.date,
      patientId: apt.patientId?._id
    }));

    return NextResponse.json({
      appointments: formattedAppointments,
      count: formattedAppointments.length
    });
  } catch (error) {
    console.error('Upcoming appointments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
