"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/freestand.avif"
          width={200}
          height={200}
          alt="Freestand Logo"
          priority
          className="select-none"
        />

        <h1 className="text-3xl font-semibold text-gray-900">
          Welcome to Freestand Sampling Workspace
        </h1>

        <p className="text-gray-500 max-w-[420px]">
          Manage sampling workflows, track tasks, and streamline operations in a
          simple board.
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-gray-600">
              Signed in as{" "}
              <span className="font-medium">{session.user?.email}</span>
            </p>

            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-black transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="px-5 py-2.5 bg-[#4D4DFF] cursor-pointer text-white rounded-lg hover:bg-[#3b3bd6] transition mt-4"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </main>
  );
}
