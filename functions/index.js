const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "guoyuxuan1801@gmail.com",
    pass: "kygfqappqlgksbgx",
  },
});


exports.listenOnReportsAndSendNotificationEmail =
    functions.database.ref("/Report/{reportId}/")
        .onCreate(
            (snapshot,
                context) => {
              // Grab the current value of
              // what was written to the Realtime Database.
              const mailOptions = {
                from: "guoyuxuan1801@gmail.com",
                // Something like: Jane Doe <janedoe@gmail.com>
                to: "admin@useshades.com",
                subject: "Received an Report From Shades User",
                // email subject
                text: "New Reported caught " +
                    "from Firebase Database, Please Go Check",
              };

              // returning result
              transporter.sendMail(mailOptions, function(erro, info) {
                if (erro) {
                  functions.logger
                      .log("caught error in sending email: ", erro.toString());
                } else {
                  functions.logger.
                      log("success sending email: ", erro.toString());
                }
              });
              // You must return a Promise when performing
              // asynchronous tasks inside
              // a Functions such as
              // writing to the Firebase
              // Realtime Database.
              // Setting an "uppercase"
              // sibling in the Realtime Database returns a Promise.
              return null;
            });


exports.sendNotificationForNewHobbyCreated =
    functions.firestore.document("Users/{userId}/Hobbies/{hobbyId}")
        .onCreate( async (snapshot, context) => {

            const hobbyName = snapshot.data()["name"];
            const userInfoRef = await snapshot.ref.parent.parent.get();
            const userInfo = userInfoRef.data();
            const uid = context.params.userId;

            functions.logger
                .log("Receive from", uid, hobbyName);

            functions.logger
                .log("Date:", Date.now().toString());

            const listSnapshot = await admin.database().ref("/ListenNewHobby/" + uid).once('value');
            listSnapshot.forEach((childSnapshot) => {

                const toUid = childSnapshot.key;
                const date = Date.now() / 1000 - 978307200;

                functions.logger
                    .log("Sending to:", toUid);

                let postData = {
                    from_uid: uid,
                    from_url: userInfo["imageurl"],
                    from_username: userInfo["username"],
                    hobbyName: hobbyName,
                    time: date,
                    to_uid: toUid,
                    viewed: false,
                    type: "NewHobby"
                };

                const newPostKey = admin.database().ref('Notification/' + toUid + '/NewHobby').push().key;

                postData['id'] = newPostKey;
                let update = {};
                update['Notification/' + toUid + '/NewHobby/' + newPostKey] = postData;
                admin.database().ref().update(update);
            })
        })


