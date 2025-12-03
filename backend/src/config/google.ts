import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Google OAuth2 Configuration
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Google API Scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Generate Google OAuth URL
export const getGoogleAuthUrl = (state?: string) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state: state || '',
  });
};

// Set credentials for OAuth2 client
export const setGoogleCredentials = (accessToken: string, refreshToken?: string) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

// Get authenticated Google API clients
export const getGoogleClients = (accessToken: string, refreshToken?: string) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return {
    classroom: google.classroom({ version: 'v1', auth }),
    calendar: google.calendar({ version: 'v3', auth }),
    drive: google.drive({ version: 'v3', auth }),
    sheets: google.sheets({ version: 'v4', auth }),
    oauth2: google.oauth2({ version: 'v2', auth }),
  };
};

export default oauth2Client;
