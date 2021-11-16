var admin = require('firebase-admin');
var serviceAccount = require('../config/firebaseAdmin.json');
import { IEmergencyLocation } from '../interfaces/IEmergencyLocation';
import axios from 'axios';
import { mapboxKey } from '../config/mapboxKey';

// This file connects to the FCM - FIrebase Cloud messaging API using firebase-admin NPM package.

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://my-project.firebaseio.com'
});

async function getStreetAddress(emergencyLocation: IEmergencyLocation) {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${emergencyLocation?.longitude},${emergencyLocation?.latitude}.json?types=address&access_token=${mapboxKey}`,
    );

    if (
      response?.data?.['features']?.[0]?.['address'] &&
      response?.data?.['features']?.[0]?.['text']
    ) {
      return `${response?.data?.['features']?.[0]?.['address']} ${response?.data?.['features']?.[0]?.['text']}`;
    } else {
      return 'Emergency In Your Area!';
    }
  } catch (error) {
    console.error('There was an error finding the emergency address. ', error);
    return 'Emergency In Your Area!';
  }
}

export default module.exports = {
  sendEmergencyTopicPushNotification: async (
    emergencyLocation: IEmergencyLocation,
  ) => {
    const nearestIntersection = await getStreetAddress(emergencyLocation);

    var message = {
      notification: {
        title: 'Emergency Reported',
        body: `${nearestIntersection}`,
      },
      android: {
        notification: {
          channel_id: 'hero',
        },
      },
      data: {
        emergencyId: emergencyLocation.emergency.toString(),
        latitude: emergencyLocation.latitude.toString(),
        longitude: emergencyLocation.longitude.toString(),
      },
      topic: 'emergency',
    };

    admin
      .messaging()
      .send(message)
      .then((response: any) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error: any) => {
        console.log('Error sending message:', error);
      });
  },
};
