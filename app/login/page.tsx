import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-red-700">
          Login Admin
        </h1>

        <form action={loginAction} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Email
            </label>

            <input
              name="email"
              type="email"
              placeholder="admin@kmhdimalang.org"
              className="w-full rounded-lg border border-gray-600 bg-white px-4 py-3 outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Password
            </label>

            <input
              name="password"
              type="password"
              placeholder="********"
              className="w-full rounded-lg border border-gray-600 bg-white px-4 py-3 outline-none focus:border-red-600"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-700 py-3 font-semibold text-white transition hover:bg-red-800"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}