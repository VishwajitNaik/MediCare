import { NextResponse } from 'next/server';

// Dummy OTP storage (in production, use Redis or database)
const otpStorage = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, action, otp } = body;

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return NextResponse.json({
        error: 'Valid 10-digit mobile number required'
      }, { status: 400 });
    }

    if (action === 'send') {
      // Generate dummy OTP (in production, integrate with SMS service)
      const otp = '123456'; // Fixed OTP for testing
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

      // Store OTP
      otpStorage.set(mobile, {
        otp,
        expiresAt,
        attempts: 0
      });

      // In production, send SMS here
      console.log(`OTP sent to ${mobile}: ${otp}`);

      return NextResponse.json({
        message: 'OTP sent successfully',
        expiresIn: 300 // 5 minutes
      });

    } else if (action === 'verify') {

      if (!otp) {
        return NextResponse.json({
          error: 'OTP required'
        }, { status: 400 });
      }

      const storedData = otpStorage.get(mobile);

      if (!storedData) {
        return NextResponse.json({
          error: 'OTP not found or expired. Please request a new one.'
        }, { status: 400 });
      }

      // Check expiration
      if (Date.now() > storedData.expiresAt) {
        otpStorage.delete(mobile);
        return NextResponse.json({
          error: 'OTP expired. Please request a new one.'
        }, { status: 400 });
      }

      // Check attempts (max 3)
      if (storedData.attempts >= 3) {
        otpStorage.delete(mobile);
        return NextResponse.json({
          error: 'Too many failed attempts. Please request a new OTP.'
        }, { status: 429 });
      }

      // Verify OTP
      if (storedData.otp === otp) {
        // Clear OTP after successful verification
        otpStorage.delete(mobile);
        return NextResponse.json({
          message: 'OTP verified successfully',
          verified: true
        });
      } else {
        // Increment attempts
        storedData.attempts++;
        otpStorage.set(mobile, storedData);

        return NextResponse.json({
          error: 'Invalid OTP',
          attemptsLeft: 3 - storedData.attempts
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('OTP API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
