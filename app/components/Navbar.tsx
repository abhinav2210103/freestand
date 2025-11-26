// Navbar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

interface NavbarProps {
  deletedTasks?: { name: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ deletedTasks = [] }) => {
  const [open, setOpen] = useState(false); // mobile nav
  const [profileOpen, setProfileOpen] = useState(false); // desktop profile dropdown
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/freestand.avif"
            alt="Freestand Logo"
            width={180}
            height={180}
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 text-gray-600 font-medium">
          <a href="#about" className="hover:text-[#0A2A66]">
            About Us
          </a>
          <a href="#case" className="hover:text-[#0A2A66]">
            Case Study
          </a>
          <a
            href="#ai"
            className="hover:text-[#0A2A66] flex items-center gap-1"
          >
            ⭐ FreeStand AI
          </a>
        </div>

        {/* Desktop Profile / Auth */}
        <div className="hidden md:block relative">
          {session ? (
            <>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="bg-[#0A2A66] text-white font-medium px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#071C47]"
              >
                <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center uppercase text-sm">
                  {userName.charAt(0)}
                </span>
                <span>Profile</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg py-2">
                  {/* Signed in info */}
                  <div className="px-4 py-2 border-b">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {userName}
                    </p>
                  </div>

                  {/* Deleted / Rejected tasks */}
                  {/* <div className="px-4 py-2 border-b max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-1">
                      Deleted / Rejected Tasks ({deletedTasks.length})
                    </p>
                    {deletedTasks.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No deleted tasks
                      </p>
                    ) : (
                      deletedTasks.map((task, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-gray-700 truncate"
                        >
                          • {task.name}
                        </p>
                      ))
                    )}
                  </div> */}

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-[#0A2A66] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#071C47]"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-3xl text-gray-700"
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4 text-gray-600 text-lg">
          <a href="#about" className="hover:text-[#0A2A66]">
            About Us
          </a>
          <a href="#case" className="hover:text-[#0A2A66]">
            Case Study
          </a>
          <a href="#ai" className="hover:text-[#0A2A66]">
            ⭐ FreeStand AI
          </a>

          {/* Mobile Profile / Auth */}
          {session ? (
            <div className="mt-2 border-t pt-4 flex flex-col gap-2">
              <p className="text-sm text-gray-500">
                Signed in as <span className="font-medium">{userName}</span>
              </p>
              <button
                onClick={() => signOut()}
                className="bg-[#0A2A66] text-white px-6 py-3 rounded-xl text-base"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-[#0A2A66] text-white px-6 py-3 rounded-xl text-base"
            >
              Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
