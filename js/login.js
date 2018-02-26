"use strict";
const firebase = require("firebase");
let provider = new firebase.auth.GoogleAuthProvider();


module.exports.signIn = () => {
    return new Promise((resolve, reject) => { 
        firebase.auth()
        .signInWithPopup(provider).then((userData) => {
            resolve(userData.user);
        }).catch(error => {
            console.log('Error: ', error);
            reject();
        });
    });
};

module.exports.signOut = (logOutFunction) => {
    return new Promise((resolve, reject) => { 
        firebase.auth()
        .signOut().then(
        () => {
            resolve();
        }, error => {
            console.log("Error: ", error);
            reject();
        });
    });
};