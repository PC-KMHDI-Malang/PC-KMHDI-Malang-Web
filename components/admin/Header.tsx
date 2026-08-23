"use client";

import Image from "next/image";
import { Bell, ChevronDown, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function Header({
  title,
  description,
  actions,
}: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>

          {description && (
            <p className="mt-2 text-gray-500">
              {description}
            </p>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Actions */}
          {actions}

          {/* Search */}
          <div className="relative hidden md:block">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Cari..."
              className="
                w-72
                rounded-xl
                border
                border-gray-200
                bg-white
                py-3
                pl-11
                pr-4
                text-sm
                outline-none
                transition
                focus:border-red-700
                focus:ring-4
                focus:ring-red-700/10
              "
            />
          </div>

          {/* Notification */}
          <button
            className="
              relative
              rounded-xl
              border
              border-gray-200
              bg-white
              p-3
              transition
              hover:bg-gray-50
            "
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" />
          </button>

          {/* Profile */}
          <button
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2
              transition
              hover:bg-gray-50
            "
          >
            <Image
              src="/images/profile/profile.jpg"
              alt="Admin"
              width={42}
              height={42}
              className="rounded-full object-cover"
            />

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-900">
                Ariana
              </p>

              <p className="text-xs text-gray-500">
                Super Admin
              </p>
            </div>

            <ChevronDown
              size={18}
              className="text-gray-400"
            />
          </button>
        </div>
      </div>
    </header>
  );
}