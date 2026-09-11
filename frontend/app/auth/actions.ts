"use server";

import { signOut, getSignInUrl, getSignUpUrl } from "@workos-inc/authkit-nextjs";

export async function signOutAction() {
  await signOut();
}

export async function getSignInUrlAction() {
  return await getSignInUrl();
}

export async function getSignUpUrlAction() {
  return await getSignUpUrl();
}
