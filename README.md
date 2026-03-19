# ReadySafe

ReadySafe is a mobile app prototype for local disaster preparedness. It was developed as part of the **CM3070 Computer Science Final Project**, using the project template from **CM3050 Mobile Development, Project Idea 1: Developing a Mobile App for Local Disaster Preparedness and Response**.

The app is designed for non-expert users and aims to make disaster preparedness feel more practical, calm, and manageable. Instead of focusing only on emergency response, ReadySafe supports everyday preparedness through small actions, simple guidance, and lightweight interactive features.

## Project Overview

The purpose of this project is to explore how a mobile application can support household-level disaster preparedness for ordinary users. The app focuses on helping users complete practical tasks, review their readiness, store emergency information, and access basic emergency-related resources in one place.

ReadySafe was developed as a final-year project to demonstrate the design, implementation, and evaluation of a mobile application that combines:

- preparedness task management
- simple gamification
- emergency information storage
- simulated alerts
- local resource access

## Main Features

- Preparedness task checklist
- Task detail guidance
- Preparedness score
- Preparedness quiz
- Emergency profile
- Simulated alerts
- Resource hub
- Local data persistence
- Audio and haptic interaction feedback

## Screens

The app includes the following main screens:

- Home
- Preparedness Tasks
- Task Detail
- Preparedness Quiz
- Emergency Profile
- Simulated Alerts
- Resource Hub

## Built With

- React Native
- Expo
- React Navigation
- AsyncStorage
- Expo Haptics
- Expo Audio

## Design Goals

The app was designed around the following goals:

- to make disaster preparedness feel approachable rather than intimidating
- to present preparedness as a series of practical tasks
- to provide lightweight interactive feedback through quiz and progress tracking
- to support calm and user-friendly mobile interaction
- to store essential preparedness information locally on the device

A warm visual design was used in the final version to make the app feel calmer and more supportive for users, rather than overly technical or stressful.

##Module Information

#CM3070 Computer Science Final Project

#Project template used:
#CM3050 Mobile Development, Project Idea 1: Developing a Mobile App for Local Disaster Preparedness and Response

##Author
Cho Hoey Ning

## Installation

Clone the repository:

```bash
git clone https://github.com/Cris0000007/ReadySafe_FYP.git
cd ReadySafe_FYP

Install dependencies:

npm install
Run the App

Start the Expo development server:

npx expo start

Then:

press i to open the iOS simulator

press a to open the Android emulator

or scan the QR code using Expo Go on your phone

Project Structure

A simplified version of the project structure is shown below:

ReadySafe_FYP/
├── App.js
├── package.json
├── README.md
└── assets/
    └── sounds/
        ├── alert.mp3
        └── success.mp3
Notes

This is a prototype project and does not provide live official emergency alerts.

Alert content in the app is simulated for demonstration and evaluation purposes.

Emergency profile data is stored locally on the device.

Audio files are included as local assets for alert and success feedback.

Future Improvements

Possible future improvements include:

live weather or disaster alert API integration

more quiz questions and personalised recommendations

expanded local resource support

multilingual support

broader usability testing
