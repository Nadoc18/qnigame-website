import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as nodemailer from 'nodemailer';
admin.initializeApp();
export const sendCustomPasswordResetEmail = onCall({ 
  invoker: 'public', 
  cors: true
}, async (request) => {
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

    // 5. Send a beautiful HTML email via nodemailer (Brevo SMTP)
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'b53fb0001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_PASS || '',
      },
    });

    const htmlContent = `
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
          <img src="https://qnigame.com/assets/qnigame_logo_main.png" alt="Qnigame" style="height: 45px; margin: 15px 0; opacity: 0.8;" />
          <p>© קניגיים ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Qnigame" <info@qnigame.com>',
      replyTo: 'noreply@qnigame.com',
      to: email,
      subject: 'איפוס סיסמה לקניגיים 🔐',
      html: htmlContent,
    });

    console.log(`Successfully sent nodemailer email to: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('CRITICAL ERROR in sendCustomPasswordResetEmail:', error);
    if (error.code === 'auth/user-not-found') {
      console.log('User not found. Returning success to prevent enumeration.');
      // Don't leak user existence to the client, just return success
      // to mimic Firebase's anti-enumeration protection
      return { success: true };
    }
    throw new HttpsError('internal', 'An error occurred while generating the reset link.');
  }
});

export const sendCustomVerificationEmail = onCall({ 
  invoker: 'public', 
  cors: true
}, async (request) => {
  const email = request.data?.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with an email.');
  }

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    const displayName = userRecord.displayName || email.split('@')[0];

    // Generate the standard Firebase verification link
    const verificationLink = await getAuth().generateEmailVerificationLink(email);

    // Parse the oobCode from the Firebase verification link
    const urlObj = new URL(verificationLink);
    const oobCode = urlObj.searchParams.get('oobCode');

    if (!oobCode) {
      throw new Error('Failed to extract oobCode from generated link');
    }

    // Construct the custom QniGame verify link
    const customVerifyLink = `https://qnigame.com/?mode=verifyEmail&oobCode=${oobCode}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: 'b53fb0001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_PASS || '',
      },
    });

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right; background-color: #f8fafc; padding: 30px; border-radius: 20px; border: 2px solid #059669;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #059669; margin-bottom: 5px;">ברוכים הבאים לקניגיים! 🎉</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 0;">המרכז למשחקי יהדות וערכים</p>
        </div>
        
        <h2 style="color: #f59e0b;">שלום ${displayName}! 👋</h2>
        <p style="font-size: 16px; line-height: 1.5;">איזה כיף שהצטרפת אלינו! אנחנו שמחים לראות אותך כאן.</p>
        <p style="font-size: 16px; line-height: 1.5;">כדי לסיים את תהליך ההרשמה ולהתחיל לשחק ולצבור נקודות, כל מה שנשאר זה לאמת את כתובת המייל שלך.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${customVerifyLink}" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            אימות כתובת מייל
          </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">אם לא נרשמת לקניגיים, אנא התעלם ממייל זה.</p>
        
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;" />
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>מייל זה נשלח אוטומטית. אין להשיב אליו.</p>
          <img src="https://qnigame.com/assets/qnigame_logo_main.png" alt="Qnigame" style="height: 45px; margin: 15px 0; opacity: 0.8;" />
          <p>© קניגיים ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Qnigame" <info@qnigame.com>',
      replyTo: 'noreply@qnigame.com',
      to: email,
      subject: 'ברוכים הבאים לקניגיים! 🎮 אנא אמת את כתובת המייל שלך',
      html: htmlContent,
    });

    console.log(`Successfully sent verification email to: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('CRITICAL ERROR in sendCustomVerificationEmail:', error);
    throw new HttpsError('internal', 'An error occurred while generating the verification link.');
  }
});

// TEMPORARY FUNCTION TO CLEAN UP ORPHANED FIRESTORE DATA

export const cleanupOrphans = onRequest(async (req, res) => {
  try {
    const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');
    const auth = getAuth();

    // 1. Fetch all auth users
    const listUsersResult = await auth.listUsers();
    const validAuthUids = new Set(listUsersResult.users.map((u: any) => u.uid));
    
    // We also need to consider anonymous users if they are in auth?
    // listUsers() returns all users, including anonymous.

    let deletedUsersCount = 0;
    let deletedLeaderboardCount = 0;

    // 2. Cleanup 'users' collection
    const usersSnapshot = await db.collection('users').get();
    for (const doc of usersSnapshot.docs) {
      if (!validAuthUids.has(doc.id)) {
        await doc.ref.delete();
        deletedUsersCount++;
        console.log(`Deleted orphaned user doc: ${doc.id}`);
      }
    }

    // 3. Cleanup 'leaderboard' collection
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    for (const doc of leaderboardSnapshot.docs) {
      if (!validAuthUids.has(doc.id)) {
        await doc.ref.delete();
        deletedLeaderboardCount++;
        console.log(`Deleted orphaned leaderboard doc: ${doc.id}`);
      }
    }

    // We could also clean up comments, but comments are inside games.
    // That requires querying all games and all comments subcollections.
    // It's usually fine to leave orphaned comments, or we can clean them too.
    
    res.status(200).send(`
      <h1>Cleanup Complete!</h1>
      <p>Deleted orphaned users: ${deletedUsersCount}</p>
      <p>Deleted orphaned leaderboard entries: ${deletedLeaderboardCount}</p>
    `);
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).send('Error during cleanup: ' + error);
  }
});

// Admin Cloud Functions for User Management

// Helper function to check if caller is an admin
async function checkIsAdmin(uid: string): Promise<boolean> {
  console.log(`[checkIsAdmin] Checking admin status for uid: ${uid}`);
  const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    console.log(`[checkIsAdmin] User document does not exist for uid: ${uid}`);
    return false;
  }
  const data = userDoc.data();
  console.log(`[checkIsAdmin] User data:`, JSON.stringify(data));
  const isAdm = data?.isAdmin === true || data?.isAdmin === 'true';
  console.log(`[checkIsAdmin] isAdm evaluated to: ${isAdm}`);
  return isAdm;
}

export const adminToggleUserStatus = onCall({ 
  invoker: 'public', 
  cors: true
}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const isAdmin = await checkIsAdmin(request.auth.uid);
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }

  const { targetUid, disabled } = request.data;
  if (!targetUid || typeof disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Missing targetUid or disabled boolean.');
  }

  try {
    const auth = getAuth();
    const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');

    // 1. Update Firebase Auth status (if the user exists in Auth)
    try {
      await auth.updateUser(targetUid, { disabled });
    } catch (authErr: any) {
      if (authErr.code === 'auth/user-not-found') {
        console.warn(`[adminToggleUserStatus] Auth user ${targetUid} not found. Proceeding to update Firestore only.`);
      } else {
        throw authErr;
      }
    }

    // 2. Update Firestore document so the frontend sees the status
    await db.collection('users').doc(targetUid).update({ disabled });

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    throw new HttpsError('internal', 'Error updating user status.');
  }
});

export const adminToggleUserVipStatus = onCall({ 
  invoker: 'public', 
  cors: true
}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const isAdmin = await checkIsAdmin(request.auth.uid);
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }

  const { targetUid, isVip } = request.data;
  if (!targetUid || typeof isVip !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Missing targetUid or isVip boolean.');
  }

  try {
    const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');
    
    // Update Firestore users collection
    await db.collection('users').doc(targetUid).update({
      isVip: isVip
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling VIP status:', error);
    throw new HttpsError('internal', 'Error toggling user VIP status.');
  }
});

export const adminDeleteUser = onCall({ 
  invoker: 'public', 
  cors: true
}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const isAdmin = await checkIsAdmin(request.auth.uid);
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can perform this action.');
  }

  const { targetUid } = request.data;
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Missing targetUid.');
  }

  try {
    const auth = getAuth();
    const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');

    // 1. Delete from Firebase Auth
    try {
      await auth.deleteUser(targetUid);
    } catch (authErr: any) {
      // If user doesn't exist in Auth, just ignore and clean up Firestore anyway
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    // 2. Delete from Firestore users collection
    await db.collection('users').doc(targetUid).delete();

    // 3. Delete from public leaderboard
    await db.collection('leaderboard').doc(targetUid).delete();

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new HttpsError('internal', 'Error deleting user account.');
  }
});

// ==========================================
// MORNING PAY INTEGRATION
// ==========================================

export const createMorningCheckout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { tier } = request.data;
  if (!tier || (tier !== 'TIER_1' && tier !== 'TIER_2')) {
    throw new HttpsError('invalid-argument', 'Invalid subscription tier.');
  }

  const userId = request.auth.uid;
  const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');

  // Fetch user to get email for the invoice (optional, but good practice)
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  console.log(`Preparing Morning Pay checkout for: ${userData?.email}`);

  // TODO: Insert real Morning Pay API call here.
  // We need the Morning Pay API Key and Secret.
  // The payload will look something like this:
  /*
  const response = await fetch('https://sandbox.morning.co.il/api/v1/payments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MORNING_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: tier === 'TIER_1' ? 29 : 59,
      description: `Qnigame ${tier} Subscription`,
      customer: { email: userData?.email || '' },
      webhook_url: 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/morningPayWebhook',
      custom_data: { userId, tier }
    })
  });
  const data = await response.json();
  return { checkoutUrl: data.payment_url };
  */

  // ⚠️ TEMPORARY MOCK MODE: Since we don't have keys yet, return a mock success
  console.log(`[MOCK] Created checkout for ${userId} for tier ${tier}`);
  
  return { 
    checkoutUrl: null, // No real URL yet
    mockMode: true,
    message: 'Morning Pay credentials not configured yet. Using mock flow.'
  };
});

export const morningPayWebhook = onRequest(async (request, response) => {
  // Morning Pay will send a POST request here when a payment succeeds
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = request.body;
    
    // TODO: Verify the Morning Pay webhook signature!
    // const signature = request.headers['x-morning-signature'];
    // verifySignature(payload, signature, MORNING_WEBHOOK_SECRET);

    console.log('Received Morning Pay Webhook:', payload);

    // Assuming the custom data we sent contains the userId and tier
    const userId = payload.custom_data?.userId;
    const tier = payload.custom_data?.tier;

    if (payload.status === 'success' && userId && tier) {
      const db = getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4');
      
      await db.collection('users').doc(userId).update({
        subscriptionTier: tier
      });

      console.log(`Successfully upgraded user ${userId} to ${tier}`);
      response.status(200).send('Webhook processed successfully');
    } else {
      console.warn('Unhandled webhook event or missing data', payload);
      response.status(400).send('Invalid payload');
    }

  } catch (error) {
    console.error('Webhook error:', error);
    response.status(500).send('Internal Server Error');
  }
});
