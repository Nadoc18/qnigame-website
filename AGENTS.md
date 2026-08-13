# Firebase Configuration

- **Firestore Database ID**: Always use the named database `ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4` when writing backend Cloud Functions using the Firebase Admin SDK.
- **Example Usage**: `getFirestore('ai-studio-qnigamewebsite-80296036-0101-4abf-bef1-bab86a55c1d4')` instead of `getFirestore()`.
- **Reason**: The `(default)` database is empty; the entire application data resides in this named database.
