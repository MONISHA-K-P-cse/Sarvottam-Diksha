import { sendPasswordResetEmail } from './utils/emailService.js';

const testAccounts = [
  'pmonisha0629@gmail.com',
  'dikshasarvottam@gmail.com',
  'sarvottamdiksha.support@gmail.com'
];

async function runMultiAccountStressTest() {
  console.log('===============================================================');
  console.log('🚀 RUNNING MULTI-ACCOUNT MULTI-ITERATION PASSWORD RECOVERY TEST');
  console.log('===============================================================\n');

  let totalSuccess = 0;
  let totalAttempts = 0;

  for (let round = 1; round <= 2; round++) {
    console.log(`\n--- ROUND ${round} ---`);
    for (const email of testAccounts) {
      totalAttempts++;
      const resetToken = `stress_token_${round}_${Date.now()}`;
      const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
      
      console.log(`[Attempt #${totalAttempts}] Dispatching password recovery to: ${email}...`);
      try {
        const res = await sendPasswordResetEmail({
          toEmail: email,
          userName: email.split('@')[0],
          resetToken,
          resetLink
        });

        if (res.success) {
          totalSuccess++;
          console.log(`  ✅ SUCCESS -> Message ID: ${res.messageId}`);
        } else {
          console.log(`  ❌ FAILED -> No success flag returned`);
        }
      } catch (err) {
        console.error(`  ❌ ERROR -> ${err.message}`);
      }
      
      // Small pause between dispatches to mimic real traffic
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n===============================================================');
  console.log(`📊 TEST COMPLETE: ${totalSuccess}/${totalAttempts} emails delivered successfully via Gmail SMTP!`);
  console.log('===============================================================');
}

runMultiAccountStressTest();
