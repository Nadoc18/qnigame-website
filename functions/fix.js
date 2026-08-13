const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({projectId: 'molten-protocol-whnbb'}); 
const db = getFirestore(); 
db.collection('users').doc('sYkJPtQJpLgKHalGaUeGPhsSvVC2').set({isAdmin: true}, {merge: true}).then(() => console.log('Fixed!'));
