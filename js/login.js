"use strict";
const firebase = require("firebase");
let provider = new firebase.auth.GoogleAuthProvider();


module.exports.googleSignin = () => {
    return new Promise((resolve, reject) => { 
        firebase.auth()
        .signInWithPopup(provider).then((userData) => {
            resolve(userData.user);
        }).catch((error) => {
            console.log(error.code);
            console.log(error.message);
        });
    });
};

// module.exports.googleSignout = (logOutFunction) => {
//    firebase.auth()
//    .signOut().then(
//     () => {
//       logOutFunction();
//    }, 
//    (error) => {
//       console.log('Signout Failed');
//    });
// };