# VYROX starter project

VYROX is a messaging-app project foundation built with Expo, React Native, TypeScript and Supabase.

## Included in this package

- Expo mobile app entry point
- Email sign-up and sign-in screen
- Supabase client setup
- Initial profiles, conversations, memberships and messages database schema
- Basic row-level security policies
- Environment-variable example

## Important status

This is a starter foundation, not a finished app and not ready for public store release. It does not yet include conversation creation UI, complete one-to-one/group chat flows, stories, calls, media uploads, wallet, earning rewards, withdrawals, admin dashboard, push notifications, full privacy controls, or audited end-to-end encryption.

Do not advertise features as available until they have been implemented and tested.

## Setup

1. Install dependencies in an Expo-compatible development environment:
   `npm install`
2. Copy `.env.example` to `.env`.
3. Add the Supabase project URL and publishable/anon key to `.env`.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. Start the app with `npx expo start`.

## Android-only workflow note

GitHub stores the project source; it does not build or run the mobile app by itself. Use an Expo-compatible build workflow when ready to test on a device. A laptop or a supported cloud build workflow may be needed for some build and store-submission steps.

## Security notes

- Never put a Supabase service-role key, database password, signing secret or payout-provider secret in the mobile app or GitHub.
- The publishable/anon key is intended for client use only when row-level security is correctly configured.
- Review and test all RLS policies before real users or private data are added.
- Do not enable cash rewards until reward-provider rules, fraud controls, budget limits and server-side verification are implemented.
- Do not claim end-to-end encryption until a reviewed protocol and key management are implemented.
