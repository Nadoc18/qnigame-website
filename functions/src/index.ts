import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp();
const db = getFirestore();

export const sendCustomPasswordResetEmail = onCall({ invoker: 'public', cors: true }, async (request) => {
  const email = request.data?.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with an email.');
  }

  try {
    // 1. Verify user exists and get their name
    const userRecord = await getAuth().getUserByEmail(email);
    const displayName = userRecord.displayName || email.split('@')[0];

    // 2. Generate the standard Firebase reset link
    const resetLink = await getAuth().generatePasswordResetLink(email);

    // 3. Parse the oobCode from the Firebase reset link
    // The link looks like: https://project.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=XYZ&apiKey=ABC
    const urlObj = new URL(resetLink);
    const oobCode = urlObj.searchParams.get('oobCode');

    if (!oobCode) {
      throw new Error('Failed to extract oobCode from generated link');
    }

    // 4. Construct the custom QniGame reset link
    // We send them to the main domain, where App.tsx will intercept mode=resetPassword
    const customResetLink = `https://qnigame.com/?mode=resetPassword&oobCode=${oobCode}`;

    // 5. Send a beautiful HTML email via the Trigger Email extension
    await db.collection('mail').add({
      to: email,
      from: 'info@qnigame.com',
      message: {
        subject: 'איפוס סיסמה לקניגיים 🔐',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right; background-color: #f8fafc; padding: 30px; border-radius: 20px; border: 2px solid #059669;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #059669; margin-bottom: 5px;">קניגיים</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 0;">המרכז למשחקי יהדות וערכים</p>
            </div>
            
            <h2 style="color: #f59e0b;">שלום ${displayName}! 👋</h2>
            <p style="font-size: 16px; line-height: 1.5;">ביקשת לאפס את הסיסמה שלך למערכת קניגיים.</p>
            <p style="font-size: 16px; line-height: 1.5;">לחץ על הכפתור למטה כדי להגדיר סיסמה חדשה (הקישור בתוקף לשעה אחת):</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${customResetLink}" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                הגדר סיסמה חדשה
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">אם לא ביקשת לאפס את הסיסמה, תוכל להתעלם ממייל זה בבטחה. הסיסמה שלך לא תשתנה.</p>
            
            <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;" />
            <div style="text-align: center; color: #94a3b8; font-size: 12px;">
              <p>מייל זה נשלח אוטומטית. אין להשיב אליו.</p>
              <p>© קניגיים ${new Date().getFullYear()}</p>
            </div>
          </div>
        `
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error generating custom password reset link:', error);
    if (error.code === 'auth/user-not-found') {
      // Don't leak user existence to the client, just return success
      // to mimic Firebase's anti-enumeration protection
      return { success: true };
    }
    throw new HttpsError('internal', 'An error occurred while generating the reset link.');
  }
});
