// import { NextResponse } from 'next/server';
// import Prescription from '../../../../../models/Prescription';
// import connectDB from '../../../../../lib/mongodb';
// import { requireAuth } from '../../../../../lib/auth';

// export async function GET(request) {
//   try {
//     await connectDB();
//     await requireAuth('MEDICAL');

//     const { searchParams } = new URL(request.url);
//     const patientId = searchParams.get('patientId');

//     // Build query - find prescriptions that are not fulfilled
//     let query = { fulfilled: { $ne: true } }; // fulfilled is false or undefined

//     // If patientId is provided, filter by patient
//     if (patientId) {
//       query.patientId = patientId;
//     }

//     const prescriptions = await Prescription.find(query)
//       .populate('patientId', 'name age gender mobile')
//       .populate('medicines.medicine', 'name brandName strength')
//       .sort({ createdAt: -1 });

//     return NextResponse.json({ prescriptions });
//   } catch (error) {
//     console.error('Medical prescriptions fetch error:', error);
//     if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
//       return NextResponse.json({ error: error.message }, { status: 401 });
//     }
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

import Prescription from '../../../../../models/Prescription';
import Medicine from '../../../../../models/Medicine';
import Patient from '../../../../../models/Patient';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth(); // Allow both doctors and medical staff

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let query = { fulfilled: { $ne: true } };

    if (patientId) {
      query.patientId = patientId;
    }

    // First get prescriptions
    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name age gender mobile')
      .populate('doctor', 'name specialty licenseNumber')
      .sort({ createdAt: -1 });

    // Manually populate medicines for each prescription
    const populatedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription) => {
        const medicinesWithDetails = await Promise.all(
          prescription.medicines.map(async (med) => {
            const medicineDetails = await Medicine.findById(med.medicine)
              .select('name brandName strength')
              .lean();
            return {
              ...med.toObject(),
              medicine: medicineDetails
            };
          })
        );
        return {
          ...prescription.toObject(),
          medicines: medicinesWithDetails
        };
      })
    );

    return NextResponse.json({ prescriptions });

  } catch (error) {
    console.error('Medical prescriptions fetch error:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
