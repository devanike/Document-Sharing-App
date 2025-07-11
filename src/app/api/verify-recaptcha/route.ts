import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'reCAPTCHA token is missing' }, { status: 400 });
  }

  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

  if (!RECAPTCHA_SECRET_KEY) {
    console.error("RECAPTCHA_SECRET_KEY is not set in environment variables.");
    return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    // For reCAPTCHA v2, we only check data.success (no score threshold)
    if (data.success) { 
      return NextResponse.json({ success: true, message: 'reCAPTCHA verified successfully' }, { status: 200 });
    } else {
      console.warn("reCAPTCHA verification failed:", data['error-codes']);
      return NextResponse.json({
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        errorCode: data['error-codes']
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during reCAPTCHA verification' }, { status: 500 });
  }
}